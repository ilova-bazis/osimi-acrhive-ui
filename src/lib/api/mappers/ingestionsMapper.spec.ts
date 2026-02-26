import { describe, expect, it } from 'vitest';
import { mapCreatedIngestionBatchId, mapIngestionOverviewSummary } from './ingestionsMapper';

describe('mapIngestionOverviewSummary', () => {
	it('maps list response into overview summary groups', () => {
		const mapped = mapIngestionOverviewSummary({
			ingestions: [
				{
					ingestion_id: 'ing-1',
					batch_label: 'Batch A',
					status: 'DRAFT',
					created_at: '2026-02-01T00:00:00.000Z',
					total_objects: 10,
					processed_objects: 0
				},
				{
					ingestion_id: 'ing-2',
					batch_label: 'Batch B',
					status: 'QUEUED',
					created_at: '2026-02-02T00:00:00.000Z',
					total_objects: 20,
					processed_objects: 5
				},
				{
					ingestion_id: 'ing-3',
					batch_label: 'Batch C',
					status: 'FAILED',
					created_at: '2026-02-03T00:00:00.000Z',
					total_objects: 8,
					processed_objects: 2
				}
			],
			next_cursor: null
		});

		expect(mapped.stats.totalBatches).toBe(3);
		expect(mapped.stats.inProgress).toBe(1);
		expect(mapped.stats.needsAttention).toBe(1);
		expect(mapped.drafts).toHaveLength(1);
		expect(mapped.activeAndRecent).toHaveLength(2);
		expect(mapped.drafts[0]?.actions).toEqual(['resume', 'delete']);
		expect(mapped.activeAndRecent[0]?.actions).toEqual(['view', 'cancel']);
		expect(mapped.activeAndRecent[1]?.actions).toEqual(['view', 'retry', 'cancel']);
	});
});

describe('mapCreatedIngestionBatchId', () => {
	it('extracts batch id from ingestion response payload', () => {
		expect(mapCreatedIngestionBatchId({ ingestion_id: 'ing-42' })).toBe('ing-42');
		expect(mapCreatedIngestionBatchId({ batch_id: 'batch-7' })).toBe('batch-7');
		expect(mapCreatedIngestionBatchId({ batch_label: 'Label' })).toBe('Label');
	});
});
