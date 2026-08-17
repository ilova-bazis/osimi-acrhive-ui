import { archiveRequestsService, objectsService } from "$lib/services";
import { normalizeObjectsReturnTo } from '$lib/objects/navigation';
import type {
    CreateObjectDownloadRequestResult,
    ObjectArtifact,
    ObjectAvailableFile,
} from "$lib/services/objects";
import type { ArchiveRequest } from "$lib/services/archiveRequests";
import { AUTH_COOKIE_NAME, clearSessionCookie } from "$lib/server/auth";
import { isApiClientError, isUnauthorizedError } from "$lib/server/apiClient";
import {
    error,
    fail,
    redirect,
    type Actions,
    type RequestEvent,
} from "@sveltejs/kit";
import { z } from "zod";

const availableFileIdSchema = z.uuid();

type LoadError = { code: 'loadFailed'; requestId: string | null };
type DownloadMessageCode = 'available' | 'completed' | 'queued';

export const load = async ({
    params,
    locals,
    cookies,
    fetch,
    url,
}: RequestEvent) => {
    const token = cookies.get(AUTH_COOKIE_NAME);
    if (!locals.session || !token) {
        throw redirect(303, "/login");
    }

    const context = { fetchFn: fetch, token };
    const objectId = params.objectId;
    if (!objectId) {
        throw error(404, {
            message: "Object not found.",
        });
    }

    try {
        const { detail, viewer } = await objectsService.getObjectDetail({
            context,
            objectId,
        });

        let artifacts: ObjectArtifact[] = [];
        let artifactsError: LoadError | null = null;
        let availableFiles: ObjectAvailableFile[] = [];
        let availableFilesError: LoadError | null = null;
        let pendingRequests: ArchiveRequest[] = [];
        let pendingRequestsError: LoadError | null = null;

        try {
            artifacts = await objectsService.listObjectArtifacts({
                context,
                objectId: detail.objectId,
            });
        } catch (artifactsCause) {
            if (isUnauthorizedError(artifactsCause)) {
                clearSessionCookie(cookies);
                throw redirect(303, "/login");
            }

            artifactsError = {
                code: 'loadFailed',
                requestId: isApiClientError(artifactsCause)
                    ? artifactsCause.requestId
                    : null,
            };
        }

        try {
            availableFiles = await objectsService.listObjectAvailableFiles({
                context,
                objectId: detail.objectId,
            });
        } catch (availableFilesCause) {
            if (isUnauthorizedError(availableFilesCause)) {
                clearSessionCookie(cookies);
                throw redirect(303, "/login");
            }

            availableFilesError = {
                code: 'loadFailed',
                requestId: isApiClientError(availableFilesCause)
                    ? availableFilesCause.requestId
                    : null,
            };
        }

        try {
            const result = await archiveRequestsService.listArchiveRequests({
                context,
                filters: {
                    targetType: 'object',
                    targetId: detail.objectId,
                    activeOnly: true,
                },
            });
            pendingRequests = result.requests;
        } catch (pendingRequestsCause) {
            if (isUnauthorizedError(pendingRequestsCause)) {
                clearSessionCookie(cookies);
                throw redirect(303, "/login");
            }

            pendingRequestsError = {
                code: 'loadFailed',
                requestId: isApiClientError(pendingRequestsCause)
                    ? pendingRequestsCause.requestId
                    : null,
            };
        }

        return {
            detail,
			backHref: normalizeObjectsReturnTo(url?.searchParams.get('returnTo')),
			viewer,
            artifacts,
            artifactsError,
            availableFiles,
            availableFilesError,
            pendingRequests,
            pendingRequestsError,
        };
    } catch (cause) {
        if (isUnauthorizedError(cause)) {
            clearSessionCookie(cookies);
            throw redirect(303, "/login");
        }

        if (isApiClientError(cause)) {
            if (cause.status === 404) {
                throw error(404, {
                    message: "Object not found.",
                });
            }

            throw error(502, {
                message: cause.requestId
                    ? `Failed to load object details (request: ${cause.requestId}).`
                    : "Failed to load object details.",
            });
        }

        throw cause;
    }
};

export const actions: Actions = {
    requestDownload: async ({ params, locals, cookies, fetch, request }) => {
        const token = cookies.get(AUTH_COOKIE_NAME);
        if (!locals.session || !token) {
            throw redirect(303, "/login");
        }

        const objectId = params.objectId;
        if (!objectId) {
            return fail(404, { errorCode: 'missingFileId' });
        }

        const formData = await request.formData();
        const availableFileId = String(
            formData.get("availableFileId") ?? "",
        ).trim();
        if (!availableFileId) {
            return fail(400, { errorCode: 'missingFileId' });
        }
        if (!availableFileIdSchema.safeParse(availableFileId).success) {
            return fail(400, { errorCode: 'invalidFileId' });
        }

        try {
            const result = await objectsService.createObjectDownloadRequest({
                context: { fetchFn: fetch, token },
                objectId,
                availableFileId,
            });

            return {
                success: true,
                result,
                messageCode: downloadRequestMessageCode(result),
            };
        } catch (cause) {
            if (isUnauthorizedError(cause)) {
                clearSessionCookie(cookies);
                throw redirect(303, "/login");
            }

            if (isApiClientError(cause)) {
                return fail(cause.status || 502, {
                    errorCode: 'requestDownloadFailed',
                    requestId: cause.requestId ?? null,
                });
            }

            return fail(502, {
                errorCode: 'requestDownloadFailed',
                requestId: null,
            });
        }
    },
};

const downloadRequestMessageCode = (
    result: CreateObjectDownloadRequestResult,
): DownloadMessageCode => {
    if (result.status === "available") {
        return "available";
    }

    if (result.request?.status === "COMPLETED") {
        return "completed";
    }

    return "queued";
};
