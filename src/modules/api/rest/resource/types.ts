/**
 * Request/response DTOs for the resource REST controllers.
 *
 * Mirrors the backend records in `vn.ftes.aos.resource.web.dto.ResourceDtos`
 * and `vn.ftes.aos.resource.web.dto.InteractionDtos`.
 */

// ---------------------------------------------------------------- ResourceDtos

/** Body sent to `POST /api/v1/resources`. */
export interface CreateResourceRequest {
    title: string
    description?: string
    type: string
    subjectId: string
    visibility?: string
    license?: string
    metadata?: Record<string, unknown>
}

/** Body sent to `PATCH /api/v1/resources/{id}`. */
export interface UpdateResourceRequest {
    title?: string
    description?: string
    visibility?: string
    license?: string
    metadata?: Record<string, unknown>
}

/** Body sent to `POST /api/v1/resources/{id}/versions/upload-url`. */
export interface ResourceUploadUrlRequest {
    filename: string
    mimeType: string
    sizeBytes: number
    checksumSha256: string
    changelog?: string
}

/** Response from requesting an upload URL. */
export interface ResourceUploadUrlResponse {
    versionId: string
    versionNo: number
    presignedPutUrl: string
    storageKey: string
}

/** Body sent to `POST /api/v1/resources/versions/{versionId}/complete`. */
export interface CompleteUploadRequest {
    checksumSha256: string
    sizeBytes: number
}

/** Body sent to `POST /api/v1/resources/{id}/reject`. */
export interface RejectRequest {
    reason: string
}

/** Presigned download URL. */
export interface DownloadUrlResponse {
    url: string
    ttlSeconds: number
    versionId: string
}

/** One resource version. */
export interface VersionResponse {
    id: string
    versionNo: number
    originalFilename: string
    mimeType: string
    sizeBytes: number
    uploadStatus: string
    changelog?: string
    createdAt?: string
}

/** Full resource detail. */
export interface ResourceResponse {
    id: string
    title: string
    description?: string
    type: string
    subjectId: string
    uploaderId: string
    status: string
    visibility: string
    license: string
    metadata?: Record<string, unknown>
    currentVersionId?: string
    avgRating?: number
    ratingCount: number
    downloadCount: number
    rejectedReason?: string
    createdAt?: string
    updatedAt?: string
}

/** Resource summary for lists. */
export interface ResourceSummary {
    id: string
    title: string
    type: string
    subjectId: string
    visibility: string
    license: string
    avgRating?: number
    ratingCount: number
    downloadCount: number
    createdAt?: string
}

/** Paginated response. */
export interface ResourcePageResponse<T> {
    items: Array<T>
    total: number
    page: number
    size: number
}

// ---------------------------------------------------------------- InteractionDtos

/** Body sent to `POST /api/v1/resources/{id}/ratings`. */
export interface RateRequest {
    stars: number
    review?: string
}

/** One rating/review. */
export interface RatingResponse {
    id: string
    userId: string
    stars: number
    review?: string
    createdAt?: string
}

/** Rating summary for a resource. */
export interface RatingSummary {
    avg?: number
    count: number
    distribution?: Record<string, number>
    reviews: Array<RatingResponse>
    total: number
    page: number
    size: number
}

/** Toggle response for bookmark/favorite. */
export interface ToggleResponse {
    active: boolean
}

/** Body sent to `POST /api/v1/resources/collections`. */
export interface CreateCollectionRequest {
    kind: string
    title: string
    description?: string
    subjectId?: string
    visibility?: string
}

/** Body sent to `PATCH /api/v1/resources/collections/{id}`. */
export interface UpdateCollectionRequest {
    title?: string
    description?: string
    visibility?: string
}

/** Body sent to `POST /api/v1/resources/collections/{id}/items`. */
export interface AddItemRequest {
    resourceId: string
    note?: string
}

/** Body sent to `PATCH /api/v1/resources/collections/{id}/items/reorder`. */
export interface ResourceReorderRequest {
    orderedResourceIds: Array<string>
}

/** Collection summary. */
export interface CollectionResponse {
    id: string
    kind: string
    title: string
    description?: string
    subjectId?: string
    ownerId: string
    visibility: string
    itemCount: number
    status: string
    createdAt?: string
}

/** One item in a collection. */
export interface CollectionItemResponse {
    id: string
    resourceId: string
    title: string
    type: string
    sortOrder: number
    note?: string
}

/** Collection detail aggregate. */
export interface CollectionDetailResponse {
    collection: CollectionResponse
    items: Array<CollectionItemResponse>
}
