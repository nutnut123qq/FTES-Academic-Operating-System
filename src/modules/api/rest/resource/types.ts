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
    /**
     * Server-computed lock flag (CONTRACT B): `true` when the material is
     * purchasers-only (`visibility` = enrolled/purchasers-only) AND the viewer has
     * NOT purchased the linked course. The BE never leaks the body/URL of a locked
     * row. Additive — absent (→ unlocked) on deployments that predate the contract.
     */
    lockedForViewer?: boolean
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

/**
 * One rating/review.
 *
 * `updatedAt` is stamped by the BE on every upsert (`POST /resources/{id}/ratings` is an
 * upsert), so `GET /resources/{id}/ratings/me` can prefill the composer and the reviews list
 * can show an "edited at" hint. It is absent on rows the BE never re-saved.
 */
export interface RatingResponse {
    id: string
    userId: string
    stars: number
    review?: string
    createdAt?: string
    updatedAt?: string
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

/**
 * Body sent to `PATCH /api/v1/resources/collections/{id}/items/{resourceId}`.
 *
 * Only the note moves — `sortOrder` is left untouched by the BE. An omitted/`null` note
 * CLEARS the stored note.
 */
export interface UpdateItemNoteRequest {
    note?: string | null
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

// ---------------------------------------------------------------- resource comments (C-4)

/**
 * A threaded resource Q&A comment (C-4). Mirrors the course `LessonCommentView`:
 * top-level comments carry one level of nested `replies`; a reply row carries an
 * empty `replies` array. A deleted comment comes back as a tombstone
 * (`status: "DELETED"`, `userId: null`) with its replies preserved.
 */
export interface ResourceCommentView {
    id: string
    userId: string | null
    parentId: string | null
    content: string
    /** `VISIBLE` | `DELETED`. */
    status: string
    createdAt: string
    /**
     * Comment-level likes (hearts), filled in batch for the whole page by the BE list.
     * An anonymous viewer always reads `likedByMe: false`. Distinct from the course-shaped
     * `reactionCount`/`myReactions`, which resource-hub never populates.
     */
    likeCount: number
    likedByMe: boolean
    replies: Array<ResourceCommentView>
}

/**
 * Result of toggling a comment like
 * (`PUT`/`DELETE /api/v1/resources/comments/{commentId}/like`).
 *
 * A superset of {@link ToggleResponse}: `active` keeps the bookmark/favorite meaning and
 * `likeCount` is the fresh server-side total, so the heart never needs a client-side recount
 * nor a refetch of the comment page.
 */
export interface ResourceCommentLikeResponse {
    active: boolean
    likeCount: number
}

/** Body sent to `POST /api/v1/resources/{id}/comments`. */
export interface PostResourceCommentRequest {
    /** Parent comment id when replying; omit/null for a top-level comment. */
    parentId?: string | null
    content: string
}

/** Paged resource comments (`GET /api/v1/resources/{id}/comments?page=&size=`). */
export interface ResourceCommentsPage {
    items: Array<ResourceCommentView>
    page: number
    size: number
    total: number
}

// ---------------------------------------------------------------- FE album (type=FE)

/**
 * One image of an FE (Final Exam) album — a resource of `type = FE` holds an ordered
 * album of up to `maxImages` (200) pictures, each of which carries its OWN comment
 * thread (`commentCount` is the server-side total, roots + replies).
 */
export interface FeImageView {
    id: string
    resourceId: string
    /** Absolute, already-signed image URL served by the storage provider. */
    imageUrl: string
    /** Position in the album (0-based, ascending). */
    sortOrder: number
    caption?: string
    /** Id of the uploader; absent on rows the BE could not attribute. */
    uploadedBy?: string
    commentCount: number
    createdAt?: string
}

/** The whole album of an FE resource (`GET /api/v1/resources/{id}/images`). */
export interface FeAlbumView {
    resourceId: string
    images: Array<FeImageView>
    total: number
    /** Hard cap the BE enforces on `POST /resources/{id}/images` (200 — a full FE paper). */
    maxImages: number
    /**
     * Server-computed: may THIS viewer add / delete / reorder images here. Mirrors the exact
     * predicate the BE guards the write endpoints with (`isOwnerOrApprover` = resource owner OR
     * subject approver), so the button never disagrees with what the server permits.
     *
     * Gate the manage entry point on this and NOTHING else — a client-side permission check reads
     * only GLOBAL leaves, while a CTV's approval right is granted per SUBJECT, so guessing here
     * hides the controls from exactly the people who should have them. Optional: absent (older BE)
     * is treated as "cannot manage", which fails closed.
     */
    canManage?: boolean
}

/**
 * One per-image comment. Same one-level threading as {@link ResourceCommentView}:
 * roots carry `replies`, a reply-of-reply is re-parented onto the root by the BE, and
 * a soft-deleted row keeps its id/replies with `status: "DELETED"` and its `content`
 * replaced by the BE tombstone text.
 */
export interface FeImageCommentView {
    id: string
    imageId: string
    userId: string | null
    parentId: string | null
    content: string
    /** `VISIBLE` | `DELETED`. */
    status: string
    createdAt: string
    replies: Array<FeImageCommentView>
}

/**
 * Paged per-image comments
 * (`GET /api/v1/resources/{id}/images/{imageId}/comments?page=&size=`).
 *
 * `page` is **1-based** — the BE shifts it onto a 0-based `PageRequest` itself, so the
 * number is passed through verbatim (same contract as {@link ResourceCommentsPage}).
 */
export interface FeImageCommentPage {
    items: Array<FeImageCommentView>
    page: number
    size: number
    total: number
}

/** Body sent to `POST /api/v1/resources/{id}/images/{imageId}/comments`. */
export interface PostFeImageCommentRequest {
    /** Parent comment id when replying; omit/null for a top-level comment. */
    parentId?: string | null
    /** Comment body — the BE caps it at 5000 characters. */
    content: string
}

/**
 * Body sent to `PUT /api/v1/resources/{id}/images/order`. The list MUST be a complete
 * permutation of the album's image ids — the BE rejects a partial order.
 */
export interface FeImageOrderRequest {
    imageIds: Array<string>
}

// ---------------------------------------------------------------- PE submissions (type=PE)

/** Lifecycle of a PE answer submission. */
export type PeSubmissionStatus = "PENDING" | "GRADING" | "SCORED" | "FAILED"

/** One PE answer the viewer submitted for AI grading. */
export interface PeSubmissionView {
    id: string
    resourceId: string
    userId: string
    /** 1-based attempt number within the per-student cap. */
    attemptNo: number
    payloadType?: string
    fileUrl?: string
    originalFilename?: string
    mimeType?: string
    sizeBytes?: number
    status: PeSubmissionStatus
    autoScore?: number
    finalScore?: number
    gradingModel?: string
    failureReason?: string
    submittedAt?: string
    gradedAt?: string
}

/**
 * The viewer's attempts on one PE paper
 * (`GET /api/v1/resources/{id}/pe-submissions/me`), plus the server-computed attempt
 * budget — the cap is read from `maxAttempts`, never hardcoded on the client.
 */
export interface PeSubmissionListView {
    items: Array<PeSubmissionView>
    attemptsUsed: number
    maxAttempts: number
}

/** One rubric line of a PE grade. */
export interface PeResultCriterion {
    name?: string
    score?: number
    max?: number
    comment?: string
}

/**
 * The AI grade of one PE attempt
 * (`GET /api/v1/resources/{id}/pe-submissions/{submissionId}/results`).
 *
 * `relevance` / `relevanceReason` are the grader's judgement of whether the uploaded
 * answer actually addresses the paper (an off-topic upload still gets a result).
 */
export interface PeResultView {
    submission: PeSubmissionView
    score?: number
    maxScore?: number
    verdict?: string
    feedback?: string
    improvements?: Array<string>
    criteria?: Array<PeResultCriterion>
    relevance?: string
    relevanceReason?: string
    /** Raw grader payload, kept for debugging — never rendered verbatim. */
    raw?: unknown
}
