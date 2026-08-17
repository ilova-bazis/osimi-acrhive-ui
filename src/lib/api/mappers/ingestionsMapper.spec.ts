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

describe('mapIngestionOverviewSummary status normalization', () => {
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

	it('maps PROCESSING to the frontend ingesting status', () => {
		const mapped = mapIngestionOverviewSummary({
			ingestions: [
				{
					ingestion_id: 'ing-1',
					batch_label: 'Processing batch',
					status: 'PROCESSING',
					created_at: '2026-02-01T00:00:00.000Z',
					...retained
				}
			],
			next_cursor: null
		});

		expect(mapped.activeAndRecent[0]?.status).toBe('ingesting');
		expect(mapped.activeAndRecent[0]?.statusRaw).toBe('PROCESSING');
		expect(mapped.stats.inProgress).toBe(1);
	});

	it('resolves hyphenated and mixed-case variants', () => {
		const mapped = mapIngestionOverviewSummary({
			ingestions: [
				{
					ingestion_id: 'ing-1',
					batch_label: 'Separator batch',
					status: 'completed-with-errors',
					created_at: '2026-02-01T00:00:00.000Z',
					processed_objects: 2,
					...retained
				}
			],
			next_cursor: null
		});

		expect(mapped.activeAndRecent[0]?.status).toBe('completed_with_errors');
		expect(mapped.stats.needsAttention).toBe(1);
	});

	it('keeps unknown statuses visible and out of every known bucket', () => {
		const mapped = mapIngestionOverviewSummary({
			ingestions: [
				{
					ingestion_id: 'ing-1',
					batch_label: 'Future batch',
					status: 'Future_State',
					created_at: '2026-02-01T00:00:00.000Z',
					processed_objects: 9,
					...retained
				}
			],
			next_cursor: null
		});

		const batch = mapped.activeAndRecent[0];
		expect(batch?.status).toBeNull();
		expect(batch?.statusRaw).toBe('Future_State');
		expect(mapped.drafts).toHaveLength(0);
		expect(mapped.stats.objectsCreated).toBe(0);
		expect(mapped.stats.inProgress).toBe(0);
		expect(mapped.stats.needsAttention).toBe(0);
	});

	it('does not accept legacy aliases', () => {
		const mapped = mapIngestionOverviewSummary({
			ingestions: [
				{
					ingestion_id: 'ing-1',
					batch_label: 'Legacy alias',
					status: 'done',
					created_at: '2026-02-01T00:00:00.000Z',
					...retained
				}
			],
			next_cursor: null
		});

		expect(mapped.activeAndRecent[0]?.status).toBeNull();
		expect(mapped.activeAndRecent[0]?.statusRaw).toBe('done');
	});

	it('treats a missing status as unresolved, not draft', () => {
		const mapped = mapIngestionOverviewSummary({
			ingestions: [
				{
					ingestion_id: 'ing-1',
					batch_label: 'No status',
					created_at: '2026-02-01T00:00:00.000Z',
					...retained
				}
			],
			next_cursor: null
		});

		expect(mapped.activeAndRecent[0]?.status).toBeNull();
		expect(mapped.activeAndRecent[0]?.statusRaw).toBe('');
		expect(mapped.drafts).toHaveLength(0);
	});
});
