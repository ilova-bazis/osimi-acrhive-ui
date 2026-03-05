import { fail, redirect } from '@sveltejs/kit';
import { ingestionNewService } from '$lib/services';
import { AUTH_COOKIE_NAME, clearSessionCookie } from '$lib/server/auth';
import { isApiClientError, isUnauthorizedError } from '$lib/server/apiClient';
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

const toBatchLabel = (value: string): string => {
	const normalized = value.trim();
	if (normalized.length > 0) return normalized;

	const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
	return `Untitled ingestion ${stamp}`;
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
		const name = toBatchLabel(String(data.get('name') ?? ''));
		const inputClassificationType =
			(String(data.get('classificationType') ?? data.get('documentType') ?? '').trim() as
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
				| 'other') || '';
		const itemKind =
			(String(data.get('itemKind') ?? '').trim() as
				| 'photo'
				| 'audio'
				| 'video'
				| 'scanned_document'
				| 'document'
				| 'other') || DEFAULTS.itemKind;
		const classificationType = inputClassificationType || classificationFromItemKind(itemKind);
		const languageCode = String(data.get('languageCode') ?? '').trim() || DEFAULTS.languageCode;
		const pipelinePreset =
			(String(data.get('pipelinePreset') ?? '').trim() as
				| 'auto'
				| 'none'
				| 'ocr_text'
				| 'audio_transcript'
				| 'video_transcript'
				| 'ocr_and_audio_transcript'
				| 'ocr_and_video_transcript') || DEFAULTS.pipelinePreset;
		const accessLevel =
			(String(data.get('accessLevel') ?? '').trim() as 'private' | 'family' | 'public') ||
			DEFAULTS.accessLevel;
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

		throw redirect(303, `/ingestion/${result.batchId}/setup`);
	}
};
