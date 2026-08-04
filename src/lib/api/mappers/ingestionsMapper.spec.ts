import { describe, expect, it } from 'vitest';
import { mapCreatedIngestionBatchId, mapIngestionOverviewSummary } from './ingestionsMapper';

describe('mapIngestionOverviewSummary', () => {
	it('maps list response into overview summary groups', () => {
		const retained = {
			staging_purge: { state: 'NOT_SCHEDULED' as const, started_at: null, purged_at: null },
			action_capabilities: {
				can_resume: false,
				can_retry: false,
				can_cancel: false,
				can_restore: false,
				can_delete: false
			}
		};
		const mapped = mapIngestionOverviewSummary({
			ingestions: [
				{
					ingestion_id: 'ing-1',
					batch_label: 'Batch A',
					status: 'DRAFT',
					created_at: '2026-02-01T00:00:00.000Z',
					total_objects: 10,
					processed_objects: 0,
					...retained,
					action_capabilities: { ...retained.action_capabilities, can_resume: true, can_delete: true }
				},
				{
					ingestion_id: 'ing-2',
					batch_label: 'Batch B',
					status: 'QUEUED',
					created_at: '2026-02-02T00:00:00.000Z',
					total_objects: 20,
					processed_objects: 5,
					...retained,
					action_capabilities: { ...retained.action_capabilities, can_cancel: true }
				},
				{
					ingestion_id: 'ing-3',
					batch_label: 'Batch C',
					status: 'FAILED',
					created_at: '2026-02-03T00:00:00.000Z',
					total_objects: 8,
					processed_objects: 2,
					...retained,
					action_capabilities: { ...retained.action_capabilities, can_retry: true }
				},
				{
					ingestion_id: 'ing-4',
					batch_label: 'Batch D',
					status: 'COMPLETED_WITH_ERRORS',
					created_at: '2026-02-04T00:00:00.000Z',
					total_objects: 5,
					processed_objects: 3,
					...retained
				}
			],
			next_cursor: null
		});

		expect(mapped.stats.totalBatches).toBe(4);
		expect(mapped.stats.inProgress).toBe(1);
		expect(mapped.stats.needsAttention).toBe(2);
		expect(mapped.stats.objectsCreated).toBe(3);
		expect(mapped.drafts).toHaveLength(1);
		expect(mapped.activeAndRecent).toHaveLength(3);
		expect(mapped.drafts[0]?.actions).toEqual(['view', 'resume', 'delete']);
		expect(mapped.activeAndRecent[0]?.actions).toEqual(['view', 'cancel']);
		expect(mapped.activeAndRecent[1]?.actions).toEqual(['view', 'retry']);
		expect(mapped.activeAndRecent[2]).toMatchObject({
		status: 'completed_with_errors',
		progress: { completed: 3, total: 5 },
		actions: ['view']
	});
	});
});

describe('mapCreatedIngestionBatchId', () => {
	it('extracts batch id from ingestion response payload', () => {
		expect(mapCreatedIngestionBatchId({ ingestion_id: 'ing-42' })).toBe('ing-42');
		expect(mapCreatedIngestionBatchId({ batch_id: 'batch-7' })).toBe('batch-7');
		expect(mapCreatedIngestionBatchId({ batch_label: 'Label' })).toBe('Label');
	});
});
