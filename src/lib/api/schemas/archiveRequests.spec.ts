import { describe, expect, it } from 'vitest';

import { archiveRequestsListResponseSchema } from './archiveRequests';

const request = {
	id: 'request-1',
	tenant_id: 'tenant-1',
	target_type: 'object',
	target_id: 'OBJ-1',
	action_type: 'object_resync',
	requested_by: 'user-1',
	status: 'PENDING' as const,
	failure_reason: null,
	created_at: '2026-08-03T00:00:00.000Z',
	updated_at: '2026-08-03T00:00:00.000Z',
	completed_at: null
};

describe('archiveRequestsListResponseSchema', () => {
	it('accepts legacy requests without a deduplication key', () => {
		const parsed = archiveRequestsListResponseSchema.parse({
			requests: [{ ...request, dedupe_key: null }],
			next_cursor: null,
			filtered_count: 1
		});

		expect(parsed.requests[0]?.dedupe_key).toBeNull();
	});

	it('accepts non-empty deduplication keys', () => {
		const parsed = archiveRequestsListResponseSchema.safeParse({
			requests: [{ ...request, dedupe_key: 'object_resync:OBJ-1' }],
			next_cursor: null,
			filtered_count: 1
		});

		expect(parsed.success).toBe(true);
	});

	it('rejects missing and empty non-null deduplication keys', () => {
		const missing = archiveRequestsListResponseSchema.safeParse({
			requests: [request],
			next_cursor: null,
			filtered_count: 1
		});
		const empty = archiveRequestsListResponseSchema.safeParse({
			requests: [{ ...request, dedupe_key: '' }],
			next_cursor: null,
			filtered_count: 1
		});

		expect(missing.success).toBe(false);
		expect(empty.success).toBe(false);
	});
});
