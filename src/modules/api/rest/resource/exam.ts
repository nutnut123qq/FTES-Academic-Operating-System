/**
 * REST wrappers for the two EXAM flavours of a resource:
 *
 * - **FE** (`type = FE`) — an album of up to 200 images, each with its own one-level
 *   comment thread (`/resources/{id}/images*`).
 * - **PE** (`type = PE`) — an exam paper the student answers by uploading a file that
 *   the AI grader scores (`/resources/{id}/pe-submissions*`).
 *
 * Both live under the resource module, so read access is gated by the same
 * `VisibilityGuard` the rest of `/resources/**` uses.
 */
import { restRequest } from "@/modules/api/rest/client"
import type {
    FeAlbumView,
    FeImageCommentPage,
    FeImageCommentView,
    FeImageOrderRequest,
    FeImageView,
    FeTextImportResult,
    PeResultView,
    PeSubmissionListView,
    PeSubmissionView,
    PostFeImageCommentRequest,
} from "./types"

/**
 * Header that makes axios drop its default `application/json` so the browser can stamp
 * the `multipart/form-data; boundary=…` itself (the boundary is generated per request
 * and MUST NOT be hand-written).
 */
const MULTIPART_HEADERS = { "Content-Type": null as unknown as string }

// ---------------------------------------------------------------- FE album

/**
 * Returns the whole image album of an FE resource, ordered by `sortOrder`.
 *
 * `GET /api/v1/resources/{id}/images`
 *
 * @param resourceId - the FE resource UUID.
 * @returns the album view (images + `total` + the BE's `maxImages` cap).
 */
export const getFeAlbum = async (resourceId: string): Promise<FeAlbumView> => {
    return restRequest<FeAlbumView>({
        method: "GET",
        url: `/resources/${resourceId}/images`,
    })
}

/**
 * Appends ONE image to an FE album (multipart `file`, optional `caption`).
 *
 * `POST /api/v1/resources/{id}/images`
 *
 * @param resourceId - the FE resource UUID.
 * @param file - the picked image.
 * @param caption - optional caption stored with the image.
 * @returns the stored image row (with its server id + `sortOrder`).
 */
export const uploadFeAlbumImage = async (
    resourceId: string,
    file: File,
    caption?: string,
): Promise<FeImageView> => {
    const form = new FormData()
    form.append("file", file)
    if (caption) {
        form.append("caption", caption)
    }
    return restRequest<FeImageView>({
        method: "POST",
        url: `/resources/${resourceId}/images`,
        data: form,
        headers: MULTIPART_HEADERS,
    })
}

/**
 * Imports exam files typed as TEXT (`.txt` / `.md`) into an FE album.
 *
 * Each accepted file becomes ONE album page after the backend has had the AI normalise its
 * formatting. The endpoint takes a list, but the caller sends **one file per request**: every file
 * is a sequential AI call with a 90s server-side budget, so batching them into a single request
 * only invites the gateway to cut the connection after some pages have already landed.
 *
 * `POST /api/v1/resources/{id}/text-items`
 */
export const importFeAlbumTextFile = async (
    resourceId: string,
    file: File,
): Promise<FeTextImportResult> => {
    const form = new FormData()
    form.append("files", file)
    return restRequest<FeTextImportResult>({
        method: "POST",
        url: `/resources/${resourceId}/text-items`,
        data: form,
        headers: MULTIPART_HEADERS,
    })
}

/**
 * Imports PICTURES of exam pages and has the backend turn each into a TEXT page.
 *
 * Different from {@link uploadFeAlbumImage}, which keeps the scan as a picture: this route produces
 * a page that is searchable, selectable, and readable by the exam-solving bot. Graphs and geometric
 * drawings — the parts no text can stand in for — are cut out of the scan and embedded back in.
 *
 * One picture per request, sequentially, for the same reason the text import is: each picture is a
 * separate vision call the server runs under a 90-second budget.
 *
 * `POST /api/v1/resources/{id}/image-text-items`
 */
export const importFeAlbumImageAsText = async (
    resourceId: string,
    file: File,
): Promise<FeTextImportResult> => {
    const form = new FormData()
    form.append("files", file)
    return restRequest<FeTextImportResult>({
        method: "POST",
        url: `/resources/${resourceId}/image-text-items`,
        data: form,
        headers: MULTIPART_HEADERS,
    })
}

/**
 * Rewrites the album order.
 *
 * `PUT /api/v1/resources/{id}/images/order`
 *
 * @param resourceId - the FE resource UUID.
 * @param request - the ids in their new order; MUST be a COMPLETE permutation of the
 * album (the BE rejects a partial list).
 */
export const reorderFeAlbumImages = async (
    resourceId: string,
    request: FeImageOrderRequest,
): Promise<void> => {
    return restRequest<void>({
        method: "PUT",
        url: `/resources/${resourceId}/images/order`,
        data: request,
    })
}

/**
 * Removes one image from an FE album.
 *
 * `DELETE /api/v1/resources/{id}/images/{imageId}`
 *
 * @param resourceId - the FE resource UUID.
 * @param imageId - the image to drop.
 */
export const deleteFeAlbumImage = async (
    resourceId: string,
    imageId: string,
): Promise<void> => {
    return restRequest<void>({
        method: "DELETE",
        url: `/resources/${resourceId}/images/${imageId}`,
    })
}

/**
 * Lists one page of an FE image's comments (top-level rows carry one level of
 * `replies`).
 *
 * `GET /api/v1/resources/{id}/images/{imageId}/comments?page=&size=`
 *
 * The `page` is **1-based** and passed through verbatim — the BE shifts it onto a
 * 0-based `PageRequest` itself, exactly like the resource Q&A comments.
 *
 * @param resourceId - the FE resource UUID.
 * @param imageId - the album image whose thread to read.
 * @param params - 1-based `page` (default 1) and `size` (default 20).
 */
export const getFeImageComments = async (
    resourceId: string,
    imageId: string,
    params?: { page?: number; size?: number },
): Promise<FeImageCommentPage> => {
    return restRequest<FeImageCommentPage>({
        method: "GET",
        url: `/resources/${resourceId}/images/${imageId}/comments`,
        params: {
            page: params?.page ?? 1,
            size: params?.size ?? 20,
        },
    })
}

/**
 * Posts a comment (or a one-level reply via `parentId`) on ONE album image. A
 * reply-of-reply is re-parented onto the root by the BE.
 *
 * `POST /api/v1/resources/{id}/images/{imageId}/comments`
 *
 * @param resourceId - the FE resource UUID.
 * @param imageId - the album image being commented on.
 * @param request - the body (`content` ≤ 5000 chars).
 */
export const postFeImageComment = async (
    resourceId: string,
    imageId: string,
    request: PostFeImageCommentRequest,
): Promise<FeImageCommentView> => {
    return restRequest<FeImageCommentView>({
        method: "POST",
        url: `/resources/${resourceId}/images/${imageId}/comments`,
        data: request,
    })
}

/**
 * Soft-deletes one FE image comment (owner or moderator). The row survives with
 * `status = "DELETED"` and a tombstone body so its replies stay readable.
 *
 * `DELETE /api/v1/resources/comments/images/{commentId}`
 *
 * @param commentId - the comment to delete.
 */
export const deleteFeImageComment = async (commentId: string): Promise<void> => {
    return restRequest<void>({
        method: "DELETE",
        url: `/resources/comments/images/${commentId}`,
    })
}

// ---------------------------------------------------------------- PE submissions

/**
 * Uploads the student's answer to a PE paper for AI grading (multipart `file`, optional
 * `model`). Answers immediately with `status = "GRADING"` — the caller polls
 * {@link getMyPeSubmissions} for the outcome.
 *
 * `POST /api/v1/resources/{id}/pe-submissions`
 *
 * @param resourceId - the PE resource UUID.
 * @param file - the answer file (Office / PDF / image / text / zip, ≤ 25 MB).
 * @param model - optional catalog model id; omit for the BE default grader.
 * @throws RestError with `RESOURCE_PE_ATTEMPT_LIMIT` (429) once the cap is reached,
 * `RESOURCE_PE_GRADER_UNAVAILABLE` (503), `RESOURCE_PE_GRADING_FAILED` (502) or
 * `RESOURCE_RATE_LIMITED` (429).
 */
export const submitPeAnswer = async (
    resourceId: string,
    file: File,
    model?: string,
): Promise<PeSubmissionView> => {
    const form = new FormData()
    form.append("file", file)
    if (model) {
        form.append("model", model)
    }
    return restRequest<PeSubmissionView>({
        method: "POST",
        url: `/resources/${resourceId}/pe-submissions`,
        data: form,
        headers: MULTIPART_HEADERS,
    })
}

/**
 * Returns the viewer's own attempts on a PE paper plus the server-computed attempt
 * budget (`attemptsUsed` / `maxAttempts`).
 *
 * `GET /api/v1/resources/{id}/pe-submissions/me`
 *
 * @param resourceId - the PE resource UUID.
 */
export const getMyPeSubmissions = async (
    resourceId: string,
): Promise<PeSubmissionListView> => {
    return restRequest<PeSubmissionListView>({
        method: "GET",
        url: `/resources/${resourceId}/pe-submissions/me`,
    })
}

/**
 * Returns the AI grade of ONE attempt.
 *
 * `GET /api/v1/resources/{id}/pe-submissions/{submissionId}/results`
 *
 * @param resourceId - the PE resource UUID.
 * @param submissionId - the attempt whose result to read.
 */
export const getPeSubmissionResult = async (
    resourceId: string,
    submissionId: string,
): Promise<PeResultView> => {
    return restRequest<PeResultView>({
        method: "GET",
        url: `/resources/${resourceId}/pe-submissions/${submissionId}/results`,
    })
}
