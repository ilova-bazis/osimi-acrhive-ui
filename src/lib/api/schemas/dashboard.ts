import { z } from 'zod';

export const dashboardSummaryResponseSchema = z.object({
	summary: z.object({
		total_ingestions: z.number().int().nonnegative(),
		total_objects: z.number().int().nonnegative(),
		processed_today: z.number().int().nonnegative(),
		processed_week: z.number().int().nonnegative(),
		failed_count: z.number().int().nonnegative()
	})
});

export const dashboardActivityItemSchema = z.object({
	id: z.string().min(1),
	event_id: z.string().min(1),
	type: z.string().min(1),
	ingestion_id: z.string().min(1).nullable().optional(),
	object_id: z.string().min(1).nullable().optional(),
	payload: z.unknown().optional(),
	actor_user_id: z.string().min(1).nullable().optional(),
	created_at: z.string().min(1)
});

export const dashboardActivityResponseSchema = z.object({
	activity: z.array(dashboardActivityItemSchema),
	next_cursor: z.string().nullable().optional()
});

export type DashboardSummaryResponse = z.infer<typeof dashboardSummaryResponseSchema>;
export type DashboardActivityResponse = z.infer<typeof dashboardActivityResponseSchema>;
