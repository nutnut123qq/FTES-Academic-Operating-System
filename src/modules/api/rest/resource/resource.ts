import { restRequest } from "@/modules/api/rest/client"
import type {
    AddItemRequest,
    CollectionDetailResponse,
    CollectionItemResponse,
    CollectionResponse,
    CompleteUploadRequest,
    CreateCollectionRequest,
    CreateResourceRequest,
    DownloadUrlResponse,
    ResourcePageResponse,
    RateRequest,
    RatingResponse,
    RatingSummary,
    RejectRequest,
    ResourceReorderRequest,
    ResourceResponse,
    ResourceSummary,
    ToggleResponse,
    UpdateCollectionRequest,
    UpdateResourceRequest,
    ResourceUploadUrlRequest,
    ResourceUploadUrlResponse,
    VersionResponse,
} from "./types"

// ---------------------------------------------------------------- ResourceController

/**
 * Lists resources with optional filters.
 *
 * `GET /api/v1/resources?subjectId=&type=&minRating=&license=&q=&sort=&page=&size=`
 */
export const listResources = async (params?: {
    subjectId?: string | null
    type?: string | null
    minRating?: number | null
    license?: string | null
    q?: string | null
    sort?: string | null
    page?: number
    size?: number
}): Promise<ResourcePageResponse<ResourceSummary>> => {
    return restRequest<ResourcePageResponse<ResourceSummary>>({
        method: "GET",
        url: "/resources",
        params: {
            subjectId: params?.subjectId ?? undefined,
            type: params?.type ?? undefined,
            minRating: params?.minRating ?? undefined,
            license: params?.license ?? undefined,
            q: params?.q ?? undefined,
            sort: params?.sort ?? undefined,
            page: params?.page ?? 0,
            size: params?.size ?? 20,
        },
        authenticated: false,
    })
}

/**
 * Returns the detail of a single resource.
 *
 * `GET /api/v1/resources/{id}`
 */
export const getResourceDetail = async (id: string): Promise<ResourceResponse> => {
    return restRequest<ResourceResponse>({
        method: "GET",
        url: `/resources/${id}`,
        authenticated: false,
    })
}

/**
 * Creates a new resource.
 *
 * `POST /api/v1/resources`
 */
export const createResource = async (
    request: CreateResourceRequest,
): Promise<ResourceResponse> => {
    return restRequest<ResourceResponse>({
        method: "POST",
        url: "/resources",
        data: request,
    })
}

/**
 * Updates a resource.
 *
 * `PATCH /api/v1/resources/{id}`
 */
export const updateResource = async (
    id: string,
    request: UpdateResourceRequest,
): Promise<ResourceResponse> => {
    return restRequest<ResourceResponse>({
        method: "PATCH",
        url: `/resources/${id}`,
        data: request,
    })
}

/**
 * Requests a presigned upload URL for a new resource version.
 *
 * `POST /api/v1/resources/{id}/versions/upload-url`
 */
export const createResourceUploadUrl = async (
    id: string,
    request: ResourceUploadUrlRequest,
): Promise<ResourceUploadUrlResponse> => {
    return restRequest<ResourceUploadUrlResponse>({
        method: "POST",
        url: `/resources/${id}/versions/upload-url`,
        data: request,
    })
}

/**
 * Completes an uploaded resource version.
 *
 * `POST /api/v1/resources/versions/{versionId}/complete`
 */
export const completeResourceUpload = async (
    versionId: string,
    request: CompleteUploadRequest,
): Promise<VersionResponse> => {
    return restRequest<VersionResponse>({
        method: "POST",
        url: `/resources/versions/${versionId}/complete`,
        data: request,
    })
}

/**
 * Returns the version history of a resource.
 *
 * `GET /api/v1/resources/{id}/versions`
 */
export const getResourceVersions = async (
    id: string,
): Promise<Array<VersionResponse>> => {
    return restRequest<Array<VersionResponse>>({
        method: "GET",
        url: `/resources/${id}/versions`,
        authenticated: false,
    })
}

/**
 * Submits a resource for moderation.
 *
 * `POST /api/v1/resources/{id}/submit`
 */
export const submitResource = async (id: string): Promise<ResourceResponse> => {
    return restRequest<ResourceResponse>({
        method: "POST",
        url: `/resources/${id}/submit`,
    })
}

/**
 * Approves a resource (moderator/admin).
 *
 * `POST /api/v1/resources/{id}/approve`
 */
export const approveResource = async (id: string): Promise<ResourceResponse> => {
    return restRequest<ResourceResponse>({
        method: "POST",
        url: `/resources/${id}/approve`,
    })
}

/**
 * Rejects a resource (moderator/admin).
 *
 * `POST /api/v1/resources/{id}/reject`
 */
export const rejectResource = async (
    id: string,
    request: RejectRequest,
): Promise<ResourceResponse> => {
    return restRequest<ResourceResponse>({
        method: "POST",
        url: `/resources/${id}/reject`,
        data: request,
    })
}

/**
 * Archives a resource.
 *
 * `POST /api/v1/resources/{id}/archive`
 */
export const archiveResource = async (id: string): Promise<ResourceResponse> => {
    return restRequest<ResourceResponse>({
        method: "POST",
        url: `/resources/${id}/archive`,
    })
}

/**
 * Requests a presigned download URL for a resource.
 *
 * `GET /api/v1/resources/{id}/download-url`
 */
export const getResourceDownloadUrl = async (
    id: string,
): Promise<DownloadUrlResponse> => {
    return restRequest<DownloadUrlResponse>({
        method: "GET",
        url: `/resources/${id}/download-url`,
        authenticated: false,
    })
}

/**
 * Returns related resources.
 *
 * `GET /api/v1/resources/{id}/related`
 */
export const getRelatedResources = async (
    id: string,
): Promise<Array<ResourceSummary>> => {
    return restRequest<Array<ResourceSummary>>({
        method: "GET",
        url: `/resources/${id}/related`,
        authenticated: false,
    })
}

/**
 * Lists resources pending moderation.
 *
 * `GET /api/v1/resources/moderation/pending?page=&size=`
 */
export const getResourceModerationQueue = async (params?: {
    page?: number
    size?: number
}): Promise<ResourcePageResponse<ResourceSummary>> => {
    return restRequest<ResourcePageResponse<ResourceSummary>>({
        method: "GET",
        url: "/resources/moderation/pending",
        params: {
            page: params?.page ?? 0,
            size: params?.size ?? 20,
        },
        authenticated: true,
    })
}

// ---------------------------------------------------------------- CollectionController

/**
 * Creates a new collection.
 *
 * `POST /api/v1/resources/collections`
 */
export const createCollection = async (
    request: CreateCollectionRequest,
): Promise<CollectionResponse> => {
    return restRequest<CollectionResponse>({
        method: "POST",
        url: "/resources/collections",
        data: request,
    })
}

/**
 * Lists the current user's collections.
 *
 * `GET /api/v1/resources/collections/me?page=&size=`
 */
export const getMyCollections = async (params?: {
    page?: number
    size?: number
}): Promise<Array<CollectionResponse>> => {
    return restRequest<Array<CollectionResponse>>({
        method: "GET",
        url: "/resources/collections/me",
        params: {
            page: params?.page ?? 0,
            size: params?.size ?? 20,
        },
        authenticated: true,
    })
}

/**
 * Returns a collection detail aggregate.
 *
 * `GET /api/v1/resources/collections/{id}`
 */
export const getCollectionDetail = async (
    id: string,
): Promise<CollectionDetailResponse> => {
    return restRequest<CollectionDetailResponse>({
        method: "GET",
        url: `/resources/collections/${id}`,
        authenticated: true,
    })
}

/**
 * Updates a collection.
 *
 * `PATCH /api/v1/resources/collections/{id}`
 */
export const updateCollection = async (
    id: string,
    request: UpdateCollectionRequest,
): Promise<CollectionResponse> => {
    return restRequest<CollectionResponse>({
        method: "PATCH",
        url: `/resources/collections/${id}`,
        data: request,
    })
}

/**
 * Deletes a collection.
 *
 * `DELETE /api/v1/resources/collections/{id}`
 */
export const deleteCollection = async (id: string): Promise<void> => {
    return restRequest<void>({
        method: "DELETE",
        url: `/resources/collections/${id}`,
    })
}

/**
 * Hides a collection.
 *
 * `POST /api/v1/resources/collections/{id}/hide`
 */
export const hideCollection = async (id: string): Promise<void> => {
    return restRequest<void>({
        method: "POST",
        url: `/resources/collections/${id}/hide`,
    })
}

/**
 * Adds a resource to a collection.
 *
 * `POST /api/v1/resources/collections/{id}/items`
 */
export const addCollectionItem = async (
    id: string,
    request: AddItemRequest,
): Promise<CollectionItemResponse> => {
    return restRequest<CollectionItemResponse>({
        method: "POST",
        url: `/resources/collections/${id}/items`,
        data: request,
    })
}

/**
 * Removes a resource from a collection.
 *
 * `DELETE /api/v1/resources/collections/{id}/items/{resourceId}`
 */
export const removeCollectionItem = async (
    id: string,
    resourceId: string,
): Promise<void> => {
    return restRequest<void>({
        method: "DELETE",
        url: `/resources/collections/${id}/items/${resourceId}`,
    })
}

/**
 * Reorders items in a collection.
 *
 * `PATCH /api/v1/resources/collections/{id}/items/reorder`
 */
export const reorderCollectionItems = async (
    id: string,
    request: ResourceReorderRequest,
): Promise<void> => {
    return restRequest<void>({
        method: "PATCH",
        url: `/resources/collections/${id}/items/reorder`,
        data: request,
    })
}

// ---------------------------------------------------------------- InteractionController

/**
 * Rates a resource.
 *
 * `POST /api/v1/resources/{id}/ratings`
 */
export const rateResource = async (
    id: string,
    request: RateRequest,
): Promise<RatingResponse> => {
    return restRequest<RatingResponse>({
        method: "POST",
        url: `/resources/${id}/ratings`,
        data: request,
    })
}

/**
 * Returns the rating summary and reviews for a resource.
 *
 * `GET /api/v1/resources/{id}/ratings?page=&size=`
 */
export const getResourceRatings = async (
    id: string,
    params?: { page?: number; size?: number },
): Promise<RatingSummary> => {
    return restRequest<RatingSummary>({
        method: "GET",
        url: `/resources/${id}/ratings`,
        params: {
            page: params?.page ?? 0,
            size: params?.size ?? 20,
        },
        authenticated: true,
    })
}

/**
 * Bookmarks a resource.
 *
 * `PUT /api/v1/resources/{id}/bookmark`
 */
export const bookmarkResource = async (id: string): Promise<ToggleResponse> => {
    return restRequest<ToggleResponse>({
        method: "PUT",
        url: `/resources/${id}/bookmark`,
    })
}

/**
 * Removes a resource bookmark.
 *
 * `DELETE /api/v1/resources/{id}/bookmark`
 */
export const unbookmarkResource = async (
    id: string,
): Promise<ToggleResponse> => {
    return restRequest<ToggleResponse>({
        method: "DELETE",
        url: `/resources/${id}/bookmark`,
    })
}

/**
 * Lists the current user's bookmarked resource ids.
 *
 * `GET /api/v1/resources/me/bookmarks?page=&size=`
 */
export const getMyBookmarks = async (params?: {
    page?: number
    size?: number
}): Promise<Array<string>> => {
    return restRequest<Array<string>>({
        method: "GET",
        url: "/resources/me/bookmarks",
        params: {
            page: params?.page ?? 0,
            size: params?.size ?? 20,
        },
        authenticated: true,
    })
}
