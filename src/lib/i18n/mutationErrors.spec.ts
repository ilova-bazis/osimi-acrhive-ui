import { describe, expect, it } from 'vitest';

import {
	mutationErrorCodeForResponse,
	mutationErrorCodes,
	isMutationErrorCode,
	type MutationErrorCode
} from '$lib/services/mutationErrors';
import {
	mutationErrorKeys,
	localizeMutationError,
	readMutationErrorPayloadFromBody,
	readMutationErrorPayload,
	renderLocalizedMessage,
	StructuredFailureError,
	type LocalizedMessageState
} from './mutationErrors';
import { translate } from './translate';
import { translations } from './translations';

const dictionary = translations.en;
const russian = translations.ru;

const localize = (code: MutationErrorCode, requestId: string | null = null, explicit = true): string =>
	localizeMutationError(
		dictionary,
		{ code, requestId, explicit },
		'Fallback sentence.'
	);

describe('mutation error contract', () => {
	it('accepts only known error codes', () => {
		for (const code of mutationErrorCodes) {
			expect(isMutationErrorCode(code)).toBe(true);
		}
		expect(isMutationErrorCode('constructor')).toBe(false);
		expect(isMutationErrorCode('__proto__')).toBe(false);
		expect(isMutationErrorCode('')).toBe(false);
		expect(isMutationErrorCode(undefined)).toBe(false);
		expect(isMutationErrorCode(42)).toBe(false);
	});

	it('maps a backend status onto a stable code', () => {
		expect(mutationErrorCodeForResponse(401)).toBe('unauthorized');
		expect(mutationErrorCodeForResponse(403)).toBe('forbidden');
		expect(mutationErrorCodeForResponse(404)).toBe('notFound');
		expect(mutationErrorCodeForResponse(409)).toBe('conflict');
		expect(mutationErrorCodeForResponse(423)).toBe('locked');
		expect(mutationErrorCodeForResponse(400)).toBe('invalidPayload');
		expect(mutationErrorCodeForResponse(422)).toBe('invalidPayload');
		expect(mutationErrorCodeForResponse(429)).toBe('rateLimited');
		expect(mutationErrorCodeForResponse(502)).toBe('requestFailed');
		expect(mutationErrorCodeForResponse(0)).toBe('requestFailed');
	});

	it('refines the mapped code with the backend code', () => {
		expect(mutationErrorCodeForResponse(409, 'LOCKED')).toBe('locked');
		expect(mutationErrorCodeForResponse(423, 'LOCKED')).toBe('locked');
		expect(mutationErrorCodeForResponse(400, 'VALIDATION_FAILED')).toBe('invalidPayload');
		expect(mutationErrorCodeForResponse(404, 'NOT_FOUND')).toBe('notFound');
		expect(mutationErrorCodeForResponse(409, 'REVISION_CONFLICT')).toBe('conflict');
		expect(mutationErrorCodeForResponse(409, 'PUBLICATION_ALREADY_ACTIVE')).toBe('conflict');
	});

	it('maps rate limiting onto its own code', () => {
		expect(mutationErrorCodeForResponse(429, 'RATE_LIMITED')).toBe('rateLimited');
	});

	it('still recognizes rate limiting after upstream status normalization', () => {
		// Routes normalize unexpected backend statuses to 502, so the backend code
		// must keep the rate-limit meaning instead of collapsing into requestFailed.
		expect(mutationErrorCodeForResponse(502, 'RATE_LIMITED')).toBe('rateLimited');
		expect(mutationErrorCodeForResponse(502)).toBe('requestFailed');
	});
});

describe('mutation error localization', () => {
	it('localizes every error code in both locales', () => {
		for (const key of Object.values(mutationErrorKeys)) {
			expect(translate(translations.en, key)).not.toBe(key);
			expect(translate(translations.ru, key)).not.toBe(key);
		}
	});

	it('never renders the raw server message', () => {
		expect(localize('locked')).toBe('This item is locked and cannot be changed right now.');
		expect(localize('notFound')).toBe('The requested item could not be found.');
		expect(localize('unauthorized')).toBe(
			'Your session has expired. Sign in again to continue.'
		);
	});

	it('renders Russian copy for the same code', () => {
		expect(
			localizeMutationError(
				russian,
				{ code: 'locked', requestId: null, explicit: true },
				'Fallback sentence.'
			)
		).toBe('Элемент заблокирован. Сейчас его нельзя изменить.');
	});

	it('shows the wait-and-retry guidance for rate limiting in both locales', () => {
		expect(localize('rateLimited')).toBe(
			'Too many requests. Please wait a moment before trying again.'
		);
		expect(
			localizeMutationError(
				russian,
				{ code: 'rateLimited', requestId: null, explicit: true },
				'Fallback sentence.'
			)
		).toBe('Слишком много запросов. Немного подождите и повторите попытку.');
	});

	it('appends the request id to the rate limit guidance', () => {
		expect(localize('rateLimited', 'req-9')).toBe(
			'Too many requests. Please wait a moment before trying again. (request: req-9)'
		);
	});

	it('uses the operation fallback when the server did not name the failure', () => {
		expect(localize('conflict', null, false)).toBe('Fallback sentence.');
		expect(localize('locked', null, false)).toBe('Fallback sentence.');
	});

	it('uses the operation fallback for generic failures', () => {
		expect(localize('requestFailed')).toBe('Fallback sentence.');
		expect(localize('unexpected')).toBe('Fallback sentence.');
		expect(localize('creationFailed')).toBe('Fallback sentence.');
	});

	it('appends the request id when the server provided one', () => {
		expect(localize('locked', 'req-42')).toBe(
			'This item is locked and cannot be changed right now. (request: req-42)'
		);
	});

	it('interpolates the request id into the localized template', () => {
		expect(
			localizeMutationError(
				russian,
				{ code: 'locked', requestId: 'req-42', explicit: true },
				'Fallback sentence.'
			)
		).toBe('Элемент заблокирован. Сейчас его нельзя изменить. (запрос: req-42)');
	});
});

describe('readMutationErrorPayloadFromBody', () => {
	it('prefers an explicit error code from the body', () => {
		const payload = readMutationErrorPayloadFromBody(
			{ errorCode: 'locked', error: 'Batch is locked' },
			500
		);

		expect(payload.code).toBe('locked');
		expect(payload.explicit).toBe(true);
		expect(payload.requestId).toBeNull();
	});

	it('falls back to the status when the body carries no code', () => {
		const payload = readMutationErrorPayloadFromBody(
			{ error: 'Batch is locked' },
			423
		);

		expect(payload.code).toBe('locked');
		expect(payload.explicit).toBe(false);
	});

	it('reads the request id from either casing', () => {
		expect(readMutationErrorPayloadFromBody({ requestId: 'req-1' }, 500).requestId).toBe(
			'req-1'
		);
		expect(readMutationErrorPayloadFromBody({ request_id: 'req-2' }, 500).requestId).toBe(
			'req-2'
		);
	});

	it('tolerates a malformed body', () => {
		const payload = readMutationErrorPayloadFromBody(null, 500);

		expect(payload.code).toBe('requestFailed');
		expect(payload.explicit).toBe(false);
		expect(payload.requestId).toBeNull();
	});

	it('ignores an unknown error code in the body', () => {
		const payload = readMutationErrorPayloadFromBody({ errorCode: 'nope' }, 409);

		expect(payload.code).toBe('conflict');
		expect(payload.explicit).toBe(false);
	});

	it('treats a bare 429 as an explicitly named rate limit', () => {
		const payload = readMutationErrorPayloadFromBody({ error: 'Too many requests' }, 429);

		expect(payload.code).toBe('rateLimited');
		expect(payload.explicit).toBe(true);
	});

	it('accepts an explicit rate limited error code from the body', () => {
		const payload = readMutationErrorPayloadFromBody({ errorCode: 'rateLimited' }, 502);

		expect(payload.code).toBe('rateLimited');
		expect(payload.explicit).toBe(true);
	});

	it.each(['<html>upstream failure</html>', '{invalid json'])('handles an unparseable response body: %s', async (body) => {
		const failure = await readMutationErrorPayload(new Response(body, { status: 502 }));
		expect(failure).toEqual({ code: 'requestFailed', explicit: false, requestId: null });
		expect(localizeMutationError(russian, failure, 'Не удалось выполнить действие.')).toBe(
			'Не удалось выполнить действие.'
		);
	});
});

describe('renderLocalizedMessage', () => {
	const render = (state: LocalizedMessageState, locale: 'en' | 'ru' = 'en'): string =>
		renderLocalizedMessage(translations[locale], locale, state);

	it('renders a plain template', () => {
		expect(render({ key: 'mutationErrors.unexpected' })).toBe(
			'Something went wrong while performing this action.'
		);
	});

	it('interpolates verbatim text params', () => {
		expect(
			render({
				key: 'ingestionOverview.errors.failedNamed',
				params: {
					action: { kind: 'text', value: 'delete' },
					name: { kind: 'text', value: 'Batch 01' }
				}
			})
		).toBe('Failed to delete ingestion Batch 01.');
	});

	it('resolves label params from the active dictionary', () => {
		expect(
			render({
				key: 'ingestionOverview.errors.failedNamed',
				params: {
					action: { kind: 'label', key: 'ingestionOverview.actions.delete', lower: true },
					name: { kind: 'text', value: 'Batch 01' }
				}
			})
		).toBe('Failed to delete ingestion Batch 01.');
	});

	it('retranslates label params against the Russian dictionary', () => {
		expect(
			render(
				{
					key: 'ingestionOverview.errors.failedNamed',
					params: {
						action: {
							kind: 'label',
							key: 'ingestionOverview.actions.delete',
							lower: true
						},
						name: { kind: 'text', value: 'Партия 01' }
					}
				},
				'ru'
			)
		).toBe('Не удалось удалить загрузку «Партия 01».');
	});

	it('keeps user content verbatim in both locales', () => {
		const state: LocalizedMessageState = {
			key: 'ingestionOverview.errors.failedNamed',
			params: {
				action: { kind: 'text', value: 'delete' },
				name: { kind: 'text', value: 'Партия 01' }
			}
		};
		expect(render(state, 'ru')).toBe('Не удалось delete загрузку «Партия 01».');
	});

	it('formats count params with the active locale', () => {
		const state: LocalizedMessageState = {
			key: 'ingestionSetup.files.moreRejected',
			params: {
				sample: { kind: 'text', value: 'a.txt, b.txt' },
				count: { kind: 'count', value: 1500 }
			}
		};
		expect(render(state)).toBe('a.txt, b.txt +1,500 more');
		expect(render(state, 'ru')).toBe('a.txt, b.txt и ещё 1\u00a0500');
	});

	it('prefers the specific wording of an explicitly named failure', () => {
		expect(
			render({
				key: 'ingestionOverview.errors.failedNamed',
				params: {
					action: { kind: 'label', key: 'ingestionOverview.actions.delete', lower: true },
					name: { kind: 'text', value: 'Batch 01' }
				},
				failure: { code: 'locked', requestId: null, explicit: true }
			})
		).toBe('This item is locked and cannot be changed right now.');
	});

	it('appends the request id when the failure carried one', () => {
		expect(
			render({
				key: 'ingestionOverview.errors.failedNamed',
				params: {
					action: { kind: 'label', key: 'ingestionOverview.actions.delete', lower: true },
					name: { kind: 'text', value: 'Batch 01' }
				},
				failure: { code: 'locked', requestId: 'req-7', explicit: true }
			})
		).toBe('This item is locked and cannot be changed right now. (request: req-7)');
	});

	it('prefers the rate limit guidance when a bare 429 was parsed', () => {
		expect(
			render(
				{
					key: 'ingestionOverview.errors.failed',
					params: { action: { kind: 'label', key: 'ingestionOverview.actions.delete', lower: true } },
					failure: readMutationErrorPayloadFromBody({}, 429)
				},
				'ru'
			)
		).toBe('Слишком много запросов. Немного подождите и повторите попытку.');
	});
});

describe('StructuredFailureError', () => {
	it('carries the message state for structured catch handling', () => {
		const state: LocalizedMessageState = {
			key: 'ingestionSetup.mutations.fallbackUpdateDefaults'
		};
		const error = new StructuredFailureError(state);

		expect(error).toBeInstanceOf(Error);
		expect(error.name).toBe('StructuredFailureError');
		expect(error.state).toBe(state);
	});
});
