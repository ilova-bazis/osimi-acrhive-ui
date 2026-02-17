import { z } from 'zod';

export const backendUserSchema = z
	.object({
		id: z.string(),
		username: z.string(),
		tenant_id: z.string().nullable().optional(),
		role: z.string()
	});

export const loginRequestSchema = z.strictObject({
		username: z.string().min(1),
		password: z.string().min(1),
		tenant_id: z.string().optional()
});

export const loginResponseSchema = z
	.object({
		token: z.string().min(1),
		token_type: z.literal('Bearer'),
		user: backendUserSchema
	});

export const meResponseSchema = z
	.object({
		user: backendUserSchema
	});

export const logoutResponseSchema = z
	.object({
		status: z.string()
	});
