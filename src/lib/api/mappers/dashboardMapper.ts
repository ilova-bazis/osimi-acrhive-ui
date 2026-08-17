import type { Role } from '$lib/auth/types';
import type {
	DashboardActivityResponse,
	DashboardSummaryResponse
} from '$lib/api/schemas/dashboard';
import type { DashboardActivity, DashboardSummary } from '$lib/services/dashboard';
import type {
	DashboardActivityDescription,
	DashboardActivityEventCode,
	DashboardRoleCopyCode
} from '$lib/services/dashboard';

const activityEventCodes = new Set<DashboardActivityEventCode>([
	'INGESTION_SUBMITTED', 'INGESTION_QUEUED', 'INGESTION_PROCESSING', 'INGESTION_COMPLETED',
	'INGESTION_FAILED', 'INGESTION_CANCELED', 'LEASE_GRANTED', 'LEASE_RENEWED', 'LEASE_EXPIRED',
	'LEASE_RELEASED', 'FILE_VALIDATED', 'FILE_FAILED', 'PIPELINE_STEP_STARTED',
	'PIPELINE_STEP_COMPLETED', 'PIPELINE_STEP_FAILED', 'INGESTION_ITEM_CREATED',
	'INGESTION_ITEM_UPDATED', 'INGESTION_ITEM_PROCESSING', 'INGESTION_ITEM_COMPLETED',
	'INGESTION_ITEM_FAILED', 'OBJECT_CREATED', 'ARTIFACT_CREATED'
]);

const toEventCode = (value: string): DashboardActivityEventCode | null => {
	const normalized = value.replace(/[.]/g, '_').toUpperCase();
	return activityEventCodes.has(normalized as DashboardActivityEventCode)
		? (normalized as DashboardActivityEventCode)
		: null;
};

const toRoleCopyCode = (role: Role): DashboardRoleCopyCode =>
	role === 'admin' || role === 'archiver' ? role : 'viewer';

const readPayloadMessage = (payload: unknown): string | null => {
	if (!payload || typeof payload !== 'object') {
		return null;
	}

	const candidate = (payload as Record<string, unknown>).message;
	if (typeof candidate === 'string' && candidate.trim().length > 0) {
		return candidate;
	}

	return null;
};

const toActivityDescription = (
	item: DashboardActivityResponse['activity'][number]
): DashboardActivityDescription => {
	const payloadMessage = readPayloadMessage(item.payload);
	if (payloadMessage) {
		return { code: 'raw', text: payloadMessage };
	}

	if (item.ingestion_id) {
		return { code: 'ingestionUpdated', id: item.ingestion_id };
	}

	if (item.object_id) {
		return { code: 'objectUpdated', id: item.object_id };
	}

	return { code: 'recorded' };
};

export const mapActivity = (
	activityResponse: DashboardActivityResponse
): DashboardActivity[] =>
	activityResponse.activity.slice(0, 12).map((item) => {
		return {
			id: item.id,
			eventCode: toEventCode(item.type),
			typeFallback: item.type,
			description: toActivityDescription(item),
			timestamp: item.created_at,
			type: item.type,
			ingestionId: item.ingestion_id ?? null,
			objectId: item.object_id ?? null,
			actorUserId: item.actor_user_id ?? null,
			payload: item.payload ?? null
		};
	});

export const mapDashboardSummary = (params: {
	role: Role;
	summaryResponse: DashboardSummaryResponse;
	activityResponse: DashboardActivityResponse;
}): DashboardSummary => {
	const summary = params.summaryResponse.summary;

	return {
		metrics: {
			activeBatches: summary.total_ingestions,
			needsReview: summary.failed_count,
			pendingUploads: summary.processed_today
		},
		roleCopyCode: toRoleCopyCode(params.role),
		recentActivity: mapActivity(params.activityResponse)
	};
};
