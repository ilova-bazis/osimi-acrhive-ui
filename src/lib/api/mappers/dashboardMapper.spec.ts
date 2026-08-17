import { describe, expect, it } from 'vitest';
import { mapDashboardSummary } from './dashboardMapper';

describe('mapDashboardSummary', () => {
	it('maps summary counters and recent activity', () => {
		const mapped = mapDashboardSummary({
			role: 'archiver',
			summaryResponse: {
				summary: {
					total_ingestions: 12,
					total_objects: 85,
					processed_today: 4,
					processed_week: 20,
					failed_count: 2
				}
			},
			activityResponse: {
				activity: [
					{
						id: 'a1',
						event_id: 'e1',
						type: 'ingestion.completed',
						ingestion_id: 'ing-1',
						created_at: '2026-01-01T00:00:00.000Z'
					}
				],
				next_cursor: null
			}
		});

		expect(mapped.metrics.activeBatches).toBe(12);
		expect(mapped.metrics.needsReview).toBe(2);
		expect(mapped.metrics.pendingUploads).toBe(4);
		expect(mapped.roleCopyCode).toBe('archiver');
		expect(mapped.recentActivity[0]?.eventCode).toBe('INGESTION_COMPLETED');
		expect(mapped.recentActivity[0]?.description).toEqual({ code: 'ingestionUpdated', id: 'ing-1' });
	});

	it('falls back to viewer copy for unknown roles', () => {
		const mapped = mapDashboardSummary({
			role: 'custom-role',
			summaryResponse: {
				summary: {
					total_ingestions: 1,
					total_objects: 1,
					processed_today: 1,
					processed_week: 1,
					failed_count: 0
				}
			},
			activityResponse: {
				activity: [],
				next_cursor: null
			}
		});

		expect(mapped.roleCopyCode).toBe('viewer');
	});

	it('preserves unknown event types and payload messages as raw external values', () => {
		const mapped = mapDashboardSummary({
			role: 'viewer',
			summaryResponse: {
				summary: { total_ingestions: 0, total_objects: 0, processed_today: 0, processed_week: 0, failed_count: 0 }
			},
			activityResponse: {
				activity: [{
					id: 'a2', event_id: 'e2', type: 'external.custom',
					payload: { message: 'External detail' }, created_at: '2026-01-01T00:00:00.000Z'
				}]
			}
		});

		expect(mapped.recentActivity[0]).toMatchObject({
			eventCode: null,
			typeFallback: 'external.custom',
			description: { code: 'raw', text: 'External detail' }
		});
	});
});
