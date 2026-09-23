import {
	createIngestionRequestSchema,
	createIngestionResponseSchema
} from '$lib/api/schemas/ingestions';
import { backendRequest } from '$lib/server/apiClient';
import type { IngestionNewService } from './ingestionNew';

export const apiIngestionNewService: IngestionNewService = {
	createDraft: async ({ payload, context }) => {
		const response = await backendRequest({
			fetchFn: context.fetchFn,
			path: '/api/ingestions',
			context: 'ingestions.create',
			method: 'POST',
			token: context.token,
			headers: {
				'x-idempotency-key': context.idempotencyKey
			},
			body: {
				batch_label: payload.name,
				schema_version: '1.0',
				classification_type: payload.classificationType,
				item_kind: payload.itemKind,
				language_code: payload.languageCode,
				pipeline_preset: payload.pipelinePreset,
				access_level: payload.accessLevel,
				embargo_until: payload.embargoUntil,
				rights_note: payload.rightsNote,
				sensitivity_note: payload.sensitivityNote,
				summary: payload.summary
			},
			requestSchema: createIngestionRequestSchema,
			responseSchema: createIngestionResponseSchema
		});

		return { batchId: response.ingestion.id };
	}
};
