import { ingestionSetupService } from '$lib/services';
import { AUTH_COOKIE_NAME, clearSessionCookie } from '$lib/server/auth';
import { isApiClientError, isUnauthorizedError } from '$lib/server/apiClient';
import { json } from '@sveltejs/kit';
import { z } from 'zod';
import type { RequestHandler } from './$types';

const setupActionSchema = z.discriminatedUnion('action', [
	z
		.object({
			action: z.literal('presign'),
			filename: z.string().min(1),
			contentType: z.string().min(1),
			sizeBytes: z.number().int().positive()
		})
		.strict(),
	z
		.object({
			action: z.literal('commit'),
			fileId: z.string().min(1),
			checksumSha256: z.string().min(1)
		})
		.strict(),
	z
		.object({
			action: z.literal('submit')
		})
		.strict(),
	z
		.object({
			action: z.literal('create_item'),
			itemIndex: z.number().int().min(1),
			label: z.string().min(1).optional()
		})
		.strict(),
	z
		.object({
			action: z.literal('update_item'),
			itemId: z.string().min(1),
			label: z.string().optional(),
			metadata: z
				.object({
					title: z.string().optional(),
					date: z
						.object({
							value: z.union([z.null(), z.string().regex(/^(\d{4}|\d{4}-\d{2}|\d{4}-\d{2}-\d{2})$/)]),
							approximate: z.boolean()
						})
						.strict()
						.optional(),
					tags: z.array(z.string().min(1)).optional(),
					description: z.string().optional(),
					people: z.array(z.string().min(1)).optional()
				})
				.strict()
				.optional()
		})
		.strict(),
	z
		.object({
			action: z.literal('reorder_items'),
			items: z.array(
				z.object({ itemId: z.string().min(1), itemIndex: z.number().int().min(1) }).strict()
			)
		})
		.strict(),
	z
		.object({
			action: z.literal('attach_file'),
			itemId: z.string().min(1),
			fileId: z.string().min(1),
			sortOrder: z.number().int().min(1),
			role: z.string().optional()
		})
		.strict(),
	z
		.object({
			action: z.literal('reorder_item_files'),
			itemId: z.string().min(1),
			files: z.array(
				z.object({ fileId: z.string().min(1), sortOrder: z.number().int().min(1) }).strict()
			)
		})
		.strict()
]);

const mapApiErrorStatus = (status: number): number => {
	if (
		status === 400 ||
		status === 401 ||
		status === 403 ||
		status === 404 ||
		status === 409 ||
		status === 423
	) {
		return status;
	}

	return 502;
};

export const POST: RequestHandler = async ({ request, params, cookies, locals, fetch }) => {
	const token = cookies.get(AUTH_COOKIE_NAME);
	if (!locals.session || !token) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const payload = await request.json().catch(() => null);
	const parsed = setupActionSchema.safeParse(payload);
	if (!parsed.success) {
		return json({ error: 'Invalid setup request payload.' }, { status: 400 });
	}

	const context = {
		fetchFn: fetch,
		token
	};

	try {
		if (parsed.data.action === 'presign') {
			const presigned = await ingestionSetupService.presignFile({
				batchId: params.batchId,
				filename: parsed.data.filename,
				contentType: parsed.data.contentType,
				sizeBytes: parsed.data.sizeBytes,
				context
			});

			return json(presigned);
		}

		if (parsed.data.action === 'commit') {
			await ingestionSetupService.commitFile({
				batchId: params.batchId,
				fileId: parsed.data.fileId,
				checksumSha256: parsed.data.checksumSha256,
				context
			});

			return json({ ok: true });
		}

		if (parsed.data.action === 'create_item') {
			const result = await ingestionSetupService.createItem({
				batchId: params.batchId,
				itemIndex: parsed.data.itemIndex,
				label: parsed.data.label,
				context
			});

			return json(result);
		}

		if (parsed.data.action === 'update_item') {
			await ingestionSetupService.updateItem({
				batchId: params.batchId,
				itemId: parsed.data.itemId,
				label: parsed.data.label,
				metadata: parsed.data.metadata,
				context
			});

			return json({ ok: true });
		}

		if (parsed.data.action === 'reorder_items') {
			await ingestionSetupService.reorderItems({
				batchId: params.batchId,
				items: parsed.data.items,
				context
			});

			return json({ ok: true });
		}

		if (parsed.data.action === 'attach_file') {
			await ingestionSetupService.attachFileToItem({
				batchId: params.batchId,
				itemId: parsed.data.itemId,
				fileId: parsed.data.fileId,
				sortOrder: parsed.data.sortOrder,
				role: parsed.data.role,
				context
			});

			return json({ ok: true });
		}

		if (parsed.data.action === 'reorder_item_files') {
			await ingestionSetupService.reorderItemFiles({
				batchId: params.batchId,
				itemId: parsed.data.itemId,
				files: parsed.data.files,
				context
			});

			return json({ ok: true });
		}

		// submit
		await ingestionSetupService.submit({
			batchId: params.batchId,
			context
		});

		return json({ ok: true });
	} catch (cause) {
		if (isUnauthorizedError(cause)) {
			clearSessionCookie(cookies);
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		if (isApiClientError(cause)) {
			return json(
				{
					error: cause.message,
					requestId: cause.requestId
				},
				{ status: mapApiErrorStatus(cause.status) }
			);
		}

		return json({ error: 'Unexpected setup error.' }, { status: 500 });
	}
};
