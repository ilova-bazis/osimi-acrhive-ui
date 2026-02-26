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
		.strict()
]);

const mapApiErrorStatus = (status: number): number => {
	if (status === 400 || status === 401 || status === 403 || status === 404 || status === 423) {
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
