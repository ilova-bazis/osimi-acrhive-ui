import { z } from 'zod';

export const archiveRequestSchema = z.object({
	id: z.string().min(1),
	tenant_id: z.string().min(1),
	target_type: z.string().min(1),
	target_id: z.string().min(1),
	action_type: z.string().min(1),
	requested_by: z.string().min(1),
	dedupe_key: z.string().min(1),
	status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELED']),
	failure_reason: z.string().nullable(),
	failure_details: z.unknown().nullable().optional(),
	created_at: z.string().min(1),
	updated_at: z.string().min(1),
	completed_at: z.string().nullable(),
	action_payload: z.record(z.string(), z.unknown()).optional()
});

export const archiveRequestsListResponseSchema = z.object({
	requests: z.array(archiveRequestSchema),
	next_cursor: z.string().nullable(),
	filtered_count: z.number().int().nonnegative()
});

export type ArchiveRequestDto = z.infer<typeof archiveRequestSchema>;
export type ArchiveRequestsListResponseDto = z.infer<typeof archiveRequestsListResponseSchema>;
