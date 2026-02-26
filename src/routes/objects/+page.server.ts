import { objectsService } from '$lib/services';
import { AUTH_COOKIE_NAME, clearSessionCookie } from '$lib/server/auth';
import { isApiClientError, isUnauthorizedError } from '$lib/server/apiClient';
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type {
	AccessLevel,
	AvailabilityState,
	ObjectsFilters,
	ObjectsSort
} from '$lib/services/objects';

const allowedSorts: ObjectsSort[] = [
	'created_at_desc',
	'created_at_asc',
	'updated_at_desc',
	'updated_at_asc',
	'title_asc',
	'title_desc'
];

const allowedAvailabilityStates: AvailabilityState[] = [
	'AVAILABLE',
	'ARCHIVED',
	'RESTORE_PENDING',
	'RESTORING',
	'UNAVAILABLE'
];

const allowedAccessLevels: AccessLevel[] = ['private', 'family', 'public'];

const normalizeEnum = <TValue extends string>(
	value: string | null,
	allowedValues: readonly TValue[]
): TValue | undefined => {
	if (!value) {
		return undefined;
	}

	const normalized = value.trim() as TValue;
	if (!allowedValues.includes(normalized)) {
		return undefined;
	}

	return normalized;
};

const normalizeText = (value: string | null): string | undefined => {
	const normalized = value?.trim();
	return normalized ? normalized : undefined;
};

const normalizeLimit = (value: string | null): number => {
	const parsed = Number(value ?? '25');
	if (Number.isNaN(parsed)) {
		return 25;
	}

	if (parsed < 1) {
		return 1;
	}

	if (parsed > 200) {
		return 200;
	}

	return parsed;
};

export const _parseObjectsFilters = (url: URL): ObjectsFilters => {
	const sort = normalizeEnum(url.searchParams.get('sort'), allowedSorts) ?? 'created_at_desc';
	const availabilityState = normalizeEnum(
		url.searchParams.get('availability_state'),
		allowedAvailabilityStates
	);
	const accessLevel = normalizeEnum(url.searchParams.get('access_level'), allowedAccessLevels);

	return {
		q: normalizeText(url.searchParams.get('q')),
		sort,
		availabilityState,
		accessLevel,
		language: normalizeText(url.searchParams.get('language')),
		batchLabel: normalizeText(url.searchParams.get('batch_label')),
		type: normalizeText(url.searchParams.get('type')),
		from: normalizeText(url.searchParams.get('from')),
		to: normalizeText(url.searchParams.get('to')),
		tag: normalizeText(url.searchParams.get('tag')),
		cursor: normalizeText(url.searchParams.get('cursor')),
		limit: normalizeLimit(url.searchParams.get('limit'))
	};
};

export const load: PageServerLoad = async ({ locals, cookies, fetch, url }) => {
	const token = cookies.get(AUTH_COOKIE_NAME);
	if (!locals.session || !token) {
		throw redirect(303, '/login');
	}

	try {
		const filters = _parseObjectsFilters(url);
		const context = { fetchFn: fetch, token };
		const [recent, list] = await Promise.all([
			objectsService.listRecent({ context }),
			objectsService.listObjects({
				context,
				filters
			})
		]);

		return {
			recent,
			list,
			filters
		};
	} catch (cause) {
		if (isUnauthorizedError(cause)) {
			clearSessionCookie(cookies);
			throw redirect(303, '/login');
		}

		if (isApiClientError(cause)) {
			throw error(502, {
				message: cause.requestId
					? `Failed to load objects (request: ${cause.requestId}).`
					: 'Failed to load objects.'
			});
		}

		throw cause;
	}
};
