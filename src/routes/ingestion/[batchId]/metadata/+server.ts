import { ingestionDetailService } from '$lib/services';
import {
	classificationTypeSchema,
	itemKindSchema,
	ingestionSummarySchema
} from '$lib/api/schemas/ingestions';
import {
	pipelinePresets,
	validatePipelinePresetCompatibility
} from '$lib/ingestion/pipelineCapabilities';
import { clearSessionCookie } from '$lib/server/auth';
import { isApiClientError, isUnauthorizedError } from '$lib/server/apiClient';
import { isAuthFailureResponse, mapApiErrorStatus, requireMutationAuth } from '$lib/server/routeGuards';
import { json } from '@sveltejs/kit';
import { z } from 'zod';
import type { RequestHandler } from './$types';

const metadataUpdateSchema = z
	.object({
		batchLabel: z.string().min(1).optional(),
		classificationType: classificationTypeSchema.optional(),
		itemKind: itemKindSchema.optional(),
		languageCode: z.string().min(1).optional(),
		pipelinePreset: z.enum(pipelinePresets).optional(),
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
		if (
			parsed.data.itemKind !== undefined ||
			parsed.data.pipelinePreset !== undefined ||
			parsed.data.classificationType !== undefined
		) {
			const context = await ingestionDetailService.getPipelineCapabilityContext({
				fetchFn: fetch,
				token,
				batchId: params.batchId
			});

			const targetPreset = parsed.data.pipelinePreset ?? context.pipelinePreset;
			const targetItemKind = parsed.data.itemKind ?? context.itemKind;
			const targetClassificationType =
				parsed.data.classificationType ?? context.classificationType;

			const validation = validatePipelinePresetCompatibility({
				preset: targetPreset,
				batchItemKind: targetItemKind,
				classificationType: targetClassificationType,
				itemOverrides: context.itemOverrides
			});

			if (!validation.valid) {
				return json(
					{
						error: 'Incompatible pipeline preset.',
						code: 'INVALID_PIPELINE_CAPABILITY',
						details: validation
					},
					{ status: 400 }
				);
			}
		}

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
