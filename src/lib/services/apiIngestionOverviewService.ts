import { mapIngestionOverviewSummary } from '$lib/api/mappers/ingestionsMapper';
import { ingestionsListResponseSchema } from '$lib/api/schemas/ingestions';
import { backendRequest } from '$lib/server/apiClient';
import type { IngestionOverviewService } from './ingestionOverview';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

const clampLimit = (value: number | undefined): number => {
	if (!value || Number.isNaN(value)) return DEFAULT_LIMIT;
	if (value < 1) return 1;
	if (value > MAX_LIMIT) return MAX_LIMIT;
	return value;
};

const toIngestionsPath = (limit: number, cursor?: string): string => {
	const params = new URLSearchParams();
	params.set('limit', String(limit));
	if (cursor) {
		params.set('cursor', cursor);
	}
	return `/api/ingestions?${params.toString()}`;
};

export const apiIngestionOverviewService: IngestionOverviewService = {
	getSummary: async ({ fetchFn, token, limit, cursor }) => {
		const response = await backendRequest({
			fetchFn,
			path: toIngestionsPath(clampLimit(limit), cursor),
			context: 'ingestions.list',
			method: 'GET',
			token,
			responseSchema: ingestionsListResponseSchema
		});

		return mapIngestionOverviewSummary(response);
	}
};
