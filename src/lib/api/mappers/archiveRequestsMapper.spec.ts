import { describe, expect, it } from 'vitest';

import { archiveRequestsListResponseSchema } from '$lib/api/schemas/archiveRequests';
import { mapArchiveRequestsList } from './archiveRequestsMapper';

describe('mapArchiveRequestsList', () => {
	it('preserves a null deduplication key from a legacy request', () => {
		const response = archiveRequestsListResponseSchema.parse({
			requests: [
				{
					id: 'request-1',
					tenant_id: 'tenant-1',
					target_type: 'object',
					target_id: 'OBJ-1',
					action_type: 'object_resync',
					requested_by: 'user-1',
					dedupe_key: null,
					status: 'PENDING',
					failure_reason: null,
					created_at: '2026-08-03T00:00:00.000Z',
					updated_at: '2026-08-03T00:00:00.000Z',
					completed_at: null
				}
			],
			next_cursor: 'cursor-1',
			filtered_count: 1
		});

		const mapped = mapArchiveRequestsList(response);

		expect(mapped.requests[0]?.dedupeKey).toBeNull();
		expect(mapped.nextCursor).toBe('cursor-1');
		expect(mapped.filteredCount).toBe(1);
	});
});
