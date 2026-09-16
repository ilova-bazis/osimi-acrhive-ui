import { fail, redirect } from '@sveltejs/kit';
import { ingestionNewService } from '$lib/services';
import { AUTH_COOKIE_NAME, clearSessionCookie } from '$lib/server/auth';
import { isApiClientError, isUnauthorizedError } from '$lib/server/apiClient';
import { translate, formatTemplate } from '$lib/i18n/translate';
import { translations, type LocaleKey } from '$lib/i18n/translations';
import {
	classificationTypeSchema,
	itemKindSchema
} from '$lib/api/schemas/ingestions';
import {
	isItemKindAllowedForClassification,
	type ClassificationType,
	type ItemKind
} from '$lib/ingestion/kindMappings';
import {
	isPipelinePreset,
	isPipelinePresetAllowedForItemKind,
	type PipelinePreset
} from '$lib/ingestion/pipelineCapabilities';
import type { Actions } from './$types';

const DEFAULTS = {
	languageCode: 'en',
	accessLevel: 'private' as const,
	pipelinePreset: 'auto' as const,
	classificationType: 'document' as const,
	itemKind: 'document' as const
};

const toOptionalString = (value: FormDataEntryValue | null): string | undefined => {
	const normalized = String(value ?? '').trim();
	return normalized.length > 0 ? normalized : undefined;
};

const toRfc3339 = (value: string | undefined): string | undefined => {
	if (!value) return undefined;
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return undefined;
	return date.toISOString();
};

const parseTags = (value: string): string[] =>
	Array.from(
		new Set(
			value
				.split(',')
				.map((tag) => tag.trim().replace(/^#/, ''))
				.filter((tag) => tag.length > 0)
		)
	);

const toBatchLabel = (value: string, localeKey: string): string => {
	const normalized = value.trim();
	if (normalized.length > 0) return normalized;

	const locale = localeKey in translations ? (localeKey as LocaleKey) : 'en';
	const dictionary = translations[locale];
	const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
	return formatTemplate(translate(dictionary, 'ingestionNew.untitledBatch'), {
		stamp
	});
};

const classificationFromItemKind = (
	itemKind: 'photo' | 'audio' | 'video' | 'scanned_document' | 'document' | 'other'
):
	| 'newspaper_article'
	| 'magazine_article'
	| 'book_chapter'
	| 'book'
	| 'letter'
	| 'speech'
	| 'interview'
	| 'report'
	| 'manuscript'
	| 'image'
	| 'document'
	| 'other' => {
	if (itemKind === 'photo') return 'image';
	if (itemKind === 'audio' || itemKind === 'video' || itemKind === 'other') return 'other';
	return 'document';
};

export const actions: Actions = {
	default: async ({ request, fetch, cookies, locals }) => {
		const token = cookies.get(AUTH_COOKIE_NAME);
		if (!locals.session || !token) {
			throw redirect(303, '/login');
		}

		const data = await request.formData();
		const name = toBatchLabel(
			String(data.get('name') ?? ''),
			String(data.get('locale') ?? '')
		);

		const rawItemKind = String(data.get('itemKind') ?? '').trim();
		let itemKind: ItemKind;
		if (rawItemKind.length > 0) {
			const parsedKind = itemKindSchema.safeParse(rawItemKind);
			if (!parsedKind.success) {
				return fail(400, {
					error: 'Invalid item kind.',
					code: 'INVALID_PIPELINE_CAPABILITY'
				});
			}
			itemKind = parsedKind.data;
		} else {
			itemKind = DEFAULTS.itemKind;
		}

		const rawClassificationType = String(
			data.get('classificationType') ?? data.get('documentType') ?? ''
		).trim();
		let classificationType: ClassificationType;
		if (rawClassificationType.length > 0) {
			const parsedClassification = classificationTypeSchema.safeParse(rawClassificationType);
			if (!parsedClassification.success) {
				return fail(400, {
					error: 'Invalid classification type.',
					code: 'INVALID_PIPELINE_CAPABILITY'
				});
			}
			classificationType = parsedClassification.data;
		} else {
			classificationType = classificationFromItemKind(itemKind);
		}

		if (!isItemKindAllowedForClassification(classificationType, itemKind)) {
			return fail(400, {
				error: 'Incompatible classification type and item kind.',
				code: 'INVALID_PIPELINE_CAPABILITY'
			});
		}

		const rawPipelinePreset = String(data.get('pipelinePreset') ?? '').trim();
		let pipelinePreset: PipelinePreset;
		if (rawPipelinePreset.length > 0) {
			if (!isPipelinePreset(rawPipelinePreset)) {
				return fail(400, {
					error: 'Invalid pipeline preset.',
					code: 'INVALID_PIPELINE_CAPABILITY'
				});
			}
			pipelinePreset = rawPipelinePreset;
		} else {
			pipelinePreset = DEFAULTS.pipelinePreset;
		}

		if (!isPipelinePresetAllowedForItemKind(pipelinePreset, itemKind)) {
			return fail(400, {
				error: 'Incompatible pipeline preset and item kind.',
				code: 'INVALID_PIPELINE_CAPABILITY'
			});
		}

		const rawAccessLevel = String(data.get('accessLevel') ?? '').trim();
		let accessLevel: 'private' | 'family' | 'public';
		if (rawAccessLevel.length > 0) {
			if (rawAccessLevel !== 'private' && rawAccessLevel !== 'family' && rawAccessLevel !== 'public') {
				return fail(400, {
					error: 'Invalid access level.',
					code: 'INVALID_PIPELINE_CAPABILITY'
				});
			}
			accessLevel = rawAccessLevel;
		} else {
			accessLevel = DEFAULTS.accessLevel;
		}

		const languageCode = String(data.get('languageCode') ?? '').trim() || DEFAULTS.languageCode;
		const embargoUntil = toRfc3339(toOptionalString(data.get('embargoUntil')));
		const rightsNote = toOptionalString(data.get('rightsNote'));
		const sensitivityNote = toOptionalString(data.get('sensitivityNote'));
		const summaryText = String(data.get('summary') ?? '').trim();
		const summaryTags = parseTags(String(data.get('summaryTags') ?? ''));
		const summary = {
			title: {
				primary: name,
				original_script: null,
				translations: []
			},
			classification: {
				tags: summaryTags,
				summary: summaryText.length > 0 ? summaryText : null
			},
			dates: {
				published: {
					value: null,
					approximate: false,
					confidence: 'medium' as const,
					note: null
				},
				created: {
					value: null,
					approximate: false,
					confidence: 'medium' as const,
					note: null
				}
			}
		};

		let result;
		try {
			result = await ingestionNewService.createDraft({
				payload: {
					name,
					classificationType,
					itemKind,
					languageCode,
					pipelinePreset,
					accessLevel,
					embargoUntil,
					rightsNote,
					sensitivityNote,
					summary
				},
				context: {
					fetchFn: fetch,
					token
				}
			});
		} catch (cause) {
			if (isUnauthorizedError(cause)) {
				clearSessionCookie(cookies);
				throw redirect(303, '/login');
			}

			if (isApiClientError(cause)) {
				return fail(cause.code === 'BAD_REQUEST' ? 400 : 502, {
					error: cause.message
				});
			}

			throw cause;
		}

		cookies.set(`ingestion-item-kind:${result.batchId}`, itemKind, {
			path: `/ingestion/${result.batchId}`,
			httpOnly: true,
			sameSite: 'lax',
			maxAge: 60 * 30
		});

		throw redirect(303, `/ingestion/${result.batchId}/setup`);
	}
};
