import { ingestionDetailService } from '$lib/services';
import { ingestionSummarySchema } from '$lib/api/schemas/ingestions';
import { AUTH_COOKIE_NAME, clearSessionCookie } from '$lib/server/auth';
import { isApiClientError, isUnauthorizedError } from '$lib/server/apiClient';
import { json } from '@sveltejs/kit';
import { z } from 'zod';
import type { RequestHandler } from './$types';

const metadataUpdateSchema = z
	.object({
		batchLabel: z.string().min(1).optional(),
		documentType: z
			.enum([
				'newspaper_article',
				'magazine_article',
				'book_chapter',
				'book',
				'photo',
				'letter',
				'speech',
				'interview',
				'document',
				'other'
			])
			.optional(),
		languageCode: z.string().min(1).optional(),
		pipelinePreset: z
			.enum([
				'auto',
				'none',
				'ocr_text',
				'audio_transcript',
				'video_transcript',
				'ocr_and_audio_transcript',
				'ocr_and_video_transcript'
			])
			.optional(),
		accessLevel: z.enum(['private', 'family', 'public']).optional(),
		embargoUntil: z.string().datetime().nullable().optional(),
		rightsNote: z.string().nullable().optional(),
		sensitivityNote: z.string().nullable().optional(),
		summary: ingestionSummarySchema.optional()
	})
	.strict();

const mapApiErrorStatus = (status: number): number => {
	if (status === 400 || status === 401 || status === 403 || status === 404 || status === 409 || status === 423) {
		return status;
	}

	return 502;
};

export const PATCH: RequestHandler = async ({ params, request, locals, cookies, fetch }) => {
	const token = cookies.get(AUTH_COOKIE_NAME);
	if (!locals.session || !token) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const payload = await request.json().catch(() => null);
	const parsed = metadataUpdateSchema.safeParse(payload);
	if (!parsed.success) {
		return json({ error: 'Invalid metadata update payload.' }, { status: 400 });
	}

	try {
		await ingestionDetailService.update({
			fetchFn: fetch,
			token,
			batchId: params.batchId,
			payload: parsed.data
		});

		return json({ ok: true });
	} catch (cause) {
		if (isUnauthorizedError(cause)) {
			clearSessionCookie(cookies);
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		if (isApiClientError(cause)) {
			return json(
				{
					error: cause.message,
					requestId: cause.requestId
				},
				{ status: mapApiErrorStatus(cause.status) }
			);
		}

		return json({ error: 'Unexpected metadata update error.' }, { status: 500 });
	}
};
