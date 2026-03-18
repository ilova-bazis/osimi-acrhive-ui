import { archiveRequestsService, objectsService } from "$lib/services";
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

export const load = async ({
    params,
    locals,
    cookies,
    fetch,
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
        const detail = await objectsService.getObjectDetail({
            context,
            objectId,
        });

        let artifacts: ObjectArtifact[] = [];
        let artifactsError: string | null = null;
        let availableFiles: ObjectAvailableFile[] = [];
        let availableFilesError: string | null = null;
        let pendingRequests: ArchiveRequest[] = [];
        let pendingRequestsError: string | null = null;

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

            if (isApiClientError(artifactsCause)) {
                artifactsError = artifactsCause.requestId
                    ? `Failed to load object artifacts (request: ${artifactsCause.requestId}).`
                    : "Failed to load object artifacts.";
            } else {
                artifactsError = "Failed to load object artifacts.";
            }
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

            if (isApiClientError(availableFilesCause)) {
                availableFilesError = availableFilesCause.requestId
                    ? `Failed to load available archive files (request: ${availableFilesCause.requestId}).`
                    : "Failed to load available archive files.";
            } else {
                availableFilesError = "Failed to load available archive files.";
            }
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

            if (isApiClientError(pendingRequestsCause)) {
                pendingRequestsError = pendingRequestsCause.requestId
                    ? `Failed to load pending requests (request: ${pendingRequestsCause.requestId}).`
                    : "Failed to load pending requests.";
            } else {
                pendingRequestsError = "Failed to load pending requests.";
            }
        }

        return {
            detail,
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
            return fail(404, { error: "Object not found." });
        }

        const formData = await request.formData();
        const availableFileId = String(
            formData.get("availableFileId") ?? "",
        ).trim();
        if (!availableFileId) {
            return fail(400, { error: "Missing available file id." });
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
                message: downloadRequestMessage(result),
            };
        } catch (cause) {
            if (isUnauthorizedError(cause)) {
                clearSessionCookie(cookies);
                throw redirect(303, "/login");
            }

            if (isApiClientError(cause)) {
                return fail(cause.status || 502, {
                    error: cause.requestId
                        ? `Failed to request download (request: ${cause.requestId}).`
                        : "Failed to request download.",
                });
            }

            return fail(502, { error: "Failed to request download." });
        }
    },
};

const downloadRequestMessage = (
    result: CreateObjectDownloadRequestResult,
): string => {
    if (result.status === "available") {
        return "File is already available and ready to download.";
    }

    if (result.request?.status === "COMPLETED") {
        return "Download request is completed and file is ready.";
    }

    return "Download request queued. The file will be available after archive sync completes.";
};
