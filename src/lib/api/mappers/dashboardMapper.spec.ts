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
		expect(mapped.roleTagline).toBe('Prepare and validate ingestion batches.');
		expect(mapped.recentActivity[0]?.title).toBe('Ingestion Completed');
		expect(mapped.recentActivity[0]?.description).toBe('Ingestion ing-1 updated.');
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

		expect(mapped.primaryAction).toBe('Open latest releases');
		expect(mapped.secondaryAction).toBe('View activity summary');
	});
});
