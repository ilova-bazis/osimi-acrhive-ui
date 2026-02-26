import { env } from '$env/dynamic/private';
import { z } from 'zod';
import { backendErrorSchema } from '$lib/api/schemas/errors';

export type ApiClientErrorCode =
	| 'UNAUTHORIZED'
	| 'FORBIDDEN'
	| 'LOCKED'
	| 'NOT_FOUND'
	| 'BAD_REQUEST'
	| 'INVALID_RESPONSE'
	| 'NETWORK_ERROR'
	| 'UNKNOWN_ERROR';

export class ApiClientError extends Error {
	status: number;
	code: ApiClientErrorCode;
	requestId: string | null;
	details: unknown;

	constructor(options: {
		message: string;
		status: number;
		code: ApiClientErrorCode;
		requestId?: string | null;
		details?: unknown;
	}) {
		super(options.message);
		this.name = 'ApiClientError';
		this.status = options.status;
		this.code = options.code;
		this.requestId = options.requestId ?? null;
		this.details = options.details;
	}
}

export type BackendRequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type BackendRequestBaseOptions = {
	fetchFn: typeof fetch;
	path: string;
	context: string;
	method?: BackendRequestMethod;
	token?: string;
	headers?: HeadersInit;
};

export type BackendRequestOptions<TRequest, TResponseSchema extends z.ZodTypeAny> =
	BackendRequestBaseOptions & {
		body?: TRequest;
		requestSchema?: z.ZodType<TRequest>;
		responseSchema: TResponseSchema;
	};

const getApiBase = (): string =>
	env.PRIVATE_API_BASE || env.PUBLIC_API_BASE || 'http://localhost:3000';

const isJsonResponse = (response: Response): boolean =>
	response.headers.get('content-type')?.toLowerCase().includes('application/json') ?? false;

const parseResponseBody = async (response: Response): Promise<unknown> => {
	if (response.status === 204) {
		return null;
	}

	if (isJsonResponse(response)) {
		try {
			return await response.json();
		} catch {
			return null;
		}
	}

	try {
		return await response.text();
	} catch {
		return null;
	}
};

const toAppCode = (status: number, backendCode?: string): ApiClientErrorCode => {
	if (backendCode === 'BAD_REQUEST' || status === 400) return 'BAD_REQUEST';
	if (backendCode === 'UNAUTHORIZED' || status === 401) return 'UNAUTHORIZED';
	if (backendCode === 'FORBIDDEN' || status === 403) return 'FORBIDDEN';
	if (backendCode === 'LOCKED' || status === 423) return 'LOCKED';
	if (backendCode === 'NOT_FOUND' || status === 404) return 'NOT_FOUND';
	return 'UNKNOWN_ERROR';
};

const toApiClientError = (status: number, payload: unknown, fallbackMessage: string): ApiClientError => {
	const parsed = backendErrorSchema.safeParse(payload);

	if (parsed.success) {
		const { request_id, error } = parsed.data;
		return new ApiClientError({
			status,
			code: toAppCode(status, error?.code),
			message: error?.message ?? fallbackMessage,
			requestId: request_id ?? null,
			details: error?.details
		});
	}

	return new ApiClientError({
		status,
		code: toAppCode(status),
		message: fallbackMessage,
		details: payload
	});
};

const formatZodValidationDetails = (error: z.ZodError): { tree: ReturnType<typeof z.treeifyError>; issues: z.ZodIssue[] } => ({
	tree: z.treeifyError(error),
	issues: error.issues
});

const validateTransport = <TSchema extends z.ZodTypeAny>(
	schema: TSchema,
	payload: unknown,
	context: string
): z.infer<TSchema> => {
	const parsed = schema.safeParse(payload);

	if (!parsed.success) {
		throw new ApiClientError({
			status: 502,
			code: 'INVALID_RESPONSE',
			message: `Invalid backend response for ${context}`,
			details: formatZodValidationDetails(parsed.error)
		});
	}

	return parsed.data;
};

const validateRequest = <TRequest>(
	requestSchema: z.ZodType<TRequest> | undefined,
	body: TRequest | undefined,
	context: string
): TRequest | undefined => {
	if (!requestSchema) {
		return body;
	}

	const parsed = requestSchema.safeParse(body);
	if (!parsed.success) {
		throw new ApiClientError({
			status: 400,
			code: 'BAD_REQUEST',
			message: `Invalid request payload for ${context}`,
			details: formatZodValidationDetails(parsed.error)
		});
	}

	return parsed.data;
};

export const backendRequest = async <TRequest, TResponseSchema extends z.ZodTypeAny>(
	options: BackendRequestOptions<TRequest, TResponseSchema>
): Promise<z.infer<TResponseSchema>> => {
	const method = options.method ?? 'GET';
	const headers = new Headers(options.headers ?? {});

	if (options.token) {
		headers.set('authorization', `Bearer ${options.token}`);
	}

	const validatedBody = validateRequest(options.requestSchema, options.body, options.context);
	const hasBody = typeof validatedBody !== 'undefined';
	if (hasBody && !headers.has('content-type')) {
		headers.set('content-type', 'application/json');
	}

	let response: Response;
	try {
		response = await options.fetchFn(`${getApiBase()}${options.path}`, {
			method,
			headers,
			body: hasBody ? JSON.stringify(validatedBody) : undefined
		});
	} catch (error) {
		throw new ApiClientError({
			status: 0,
			code: 'NETWORK_ERROR',
			message: error instanceof Error ? error.message : 'Network request failed'
		});
	}

	const payload = await parseResponseBody(response);

	if (!response.ok) {
		throw toApiClientError(response.status, payload, `Request failed for ${options.context}`);
	}

	return validateTransport(options.responseSchema, payload, options.context);
};

export const isApiClientError = (error: unknown): error is ApiClientError => error instanceof ApiClientError;

export const isUnauthorizedError = (error: unknown): boolean =>
	isApiClientError(error) && error.code === 'UNAUTHORIZED';
