import { ingestionDetailService } from '$lib/services';
import { ingestionSummarySchema } from '$lib/api/schemas/ingestions';
import { clearSessionCookie } from '$lib/server/auth';
import { isApiClientError, isUnauthorizedError } from '$lib/server/apiClient';
import { isAuthFailureResponse, mapApiErrorStatus, requireMutationAuth } from '$lib/server/routeGuards';
import { json } from '@sveltejs/kit';
import { z } from 'zod';
import type { RequestHandler } from './$types';

const metadataUpdateSchema = z
	.object({
		batchLabel: z.string().min(1).optional(),
		classificationType: z
			.enum([
				'newspaper_article',
				'magazine_article',
				'book_chapter',
				'book',
				'letter',
				'speech',
				'interview',
				'report',
				'manuscript',
				'image',
				'document',
				'other'
			])
			.optional(),
		itemKind: z
			.enum(['photo', 'audio', 'video', 'scanned_document', 'document', 'other'])
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

export const PATCH: RequestHandler = async ({ params, request, locals, cookies, fetch }) => {
	const auth = requireMutationAuth({ request, locals, cookies });
	if (isAuthFailureResponse(auth)) return auth;
	const { token } = auth;

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
