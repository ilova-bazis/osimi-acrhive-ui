import {
    mapCreateObjectDownloadRequestResponse,
    mapCreateObjectResyncResponse,
    mapObjectArtifacts,
    mapObjectAvailableFiles,
    mapObjectDetail,
    mapObjectsList,
} from "$lib/api/mappers/objectsMapper";
import {
    objectArtifactsResponseSchema,
    objectAvailableFilesResponseSchema,
    objectDetailResponseSchema,
    objectsListResponseSchema,
    createObjectDownloadRequestResponseSchema,
    createObjectResyncResponseSchema,
} from "$lib/api/schemas/objects";
import { backendRequest } from "$lib/server/apiClient";
import type {
    ObjectsFilters,
    ObjectsListResponse,
    ObjectsService,
} from "./objects";

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 200;

const clampLimit = (value: number | undefined): number => {
    if (!value || Number.isNaN(value)) return DEFAULT_PAGE_SIZE;
    if (value < 1) return 1;
    if (value > MAX_PAGE_SIZE) return MAX_PAGE_SIZE;
    return value;
};

const toObjectsPath = (filters: ObjectsFilters): string => {
    const params = new URLSearchParams();
    const limit = clampLimit(filters.limit);

    params.set("limit", String(limit));

    if (filters.cursor) {
        params.set("cursor", filters.cursor);
    }

    if (filters.sort) {
        params.set("sort", filters.sort);
    }

    if (filters.q) {
        params.set("q", filters.q);
    }

    if (filters.availabilityState) {
        params.set("availability_state", filters.availabilityState);
    }

    if (filters.accessLevel) {
        params.set("access_level", filters.accessLevel);
    }

    if (filters.language) {
        params.set("language", filters.language);
    }

    if (filters.batchLabel) {
        params.set("batch_label", filters.batchLabel);
    }

    if (filters.type) {
        params.set("type", filters.type);
    }

    if (filters.from) {
        params.set("from", filters.from);
    }

    if (filters.to) {
        params.set("to", filters.to);
    }

    if (filters.tag) {
        params.set("tag", filters.tag);
    }

    return `/api/objects?${params.toString()}`;
};

const toObjectPath = (objectId: string): string =>
    `/api/objects/${encodeURIComponent(objectId)}`;

const toArtifactsPath = (objectId: string): string =>
    `/api/objects/${encodeURIComponent(objectId)}/artifacts`;

const toAvailableFilesPath = (objectId: string): string =>
    `/api/objects/${encodeURIComponent(objectId)}/available-files`;

const toDownloadRequestsPath = (objectId: string): string =>
    `/api/objects/${encodeURIComponent(objectId)}/download-requests`;

const toResyncPath = (objectId: string): string =>
    `/api/objects/${encodeURIComponent(objectId)}/resync`;

const fetchObjectsList = async (params: {
    filters: ObjectsFilters;
    fetchFn: typeof fetch;
    token: string;
    context: string;
}): Promise<ObjectsListResponse> => {
    const limit = clampLimit(params.filters.limit);

    const response = await backendRequest({
        fetchFn: params.fetchFn,
        path: toObjectsPath(params.filters),
        context: params.context,
        method: "GET",
        token: params.token,
        responseSchema: objectsListResponseSchema,
    });

    return mapObjectsList({ response, limit });
};

export const apiObjectsService: ObjectsService = {
    listObjects: async ({ filters, context }) =>
        fetchObjectsList({
            filters,
            fetchFn: context.fetchFn,
            token: context.token,
            context: "objects.list",
        }),
    listRecent: async ({ context, limit = 6 }) => {
        const list = await fetchObjectsList({
            filters: {
                limit,
                sort: "created_at_desc",
            },
            fetchFn: context.fetchFn,
            token: context.token,
            context: "objects.recent",
        });

        return list.rows;
    },
    getObjectDetail: async ({ context, objectId }) => {
        const response = await backendRequest({
            fetchFn: context.fetchFn,
            path: toObjectPath(objectId),
            context: "objects.detail",
            method: "GET",
            token: context.token,
            responseSchema: objectDetailResponseSchema,
        });

        return mapObjectDetail(response);
    },
    listObjectArtifacts: async ({ context, objectId }) => {
        const response = await backendRequest({
            fetchFn: context.fetchFn,
            path: toArtifactsPath(objectId),
            context: "objects.artifacts",
            method: "GET",
            token: context.token,
            responseSchema: objectArtifactsResponseSchema,
        });

        return mapObjectArtifacts(response);
    },
    listObjectAvailableFiles: async ({ context, objectId }) => {
        const response = await backendRequest({
            fetchFn: context.fetchFn,
            path: toAvailableFilesPath(objectId),
            context: "objects.availableFiles",
            method: "GET",
            token: context.token,
            responseSchema: objectAvailableFilesResponseSchema,
        });
        return mapObjectAvailableFiles(response);
    },
    createObjectDownloadRequest: async ({
        context,
        objectId,
        availableFileId,
    }) => {
        const response = await backendRequest({
            fetchFn: context.fetchFn,
            path: toDownloadRequestsPath(objectId),
            context: "objects.createDownloadRequest",
            method: "POST",
            token: context.token,
            body: {
                available_file_id: availableFileId,
            },
            responseSchema: createObjectDownloadRequestResponseSchema,
        });

        return mapCreateObjectDownloadRequestResponse(response);
    },
    requestResync: async ({ context, objectId }) => {
        const response = await backendRequest({
            fetchFn: context.fetchFn,
            path: toResyncPath(objectId),
            context: "objects.requestResync",
            method: "POST",
            token: context.token,
            responseSchema: createObjectResyncResponseSchema,
        });

        return mapCreateObjectResyncResponse(response);
    },
};
