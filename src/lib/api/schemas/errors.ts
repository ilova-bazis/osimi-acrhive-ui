import { z } from 'zod';

export const backendErrorSchema = z
	.object({
		request_id: z.string().optional(),
		error: z
			.object({
				code: z.string().optional(),
				message: z.string().optional(),
				details: z.unknown().optional()
			})
			.optional()
	});
