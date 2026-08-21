/**
 * Request/response DTOs for the community REST controllers.
 *
 * Mirrors the backend records in `vn.ftes.aos.community.web.dto.CommunityDtos`.
 */

/** Media attached to a post (input). */
export interface MediaInput {
    mediaType: string
    storageKey: string
    mimeType?: string
    sizeBytes?: number
}

/** Media attached to a post (output). */
export interface MediaOutput {
    id: string
    mediaType: string
    storageKey: string
    mimeType?: string
    sizeBytes?: number
    sortOrder: number
}

/**
 * Result of `POST /api/v1/community/media` (BE `MediaUploadResponse`). `secureUrl` is what the
 * composer puts into {@link MediaInput.storageKey} — the BE only accepts storage keys it issued.
 */
export interface MediaUploadResponse {
    mediaAssetId: string
    provider: string
    url: string
    secureUrl: string
}

/**
 * An admin-managed campus (BE `CampusView`, `GET /api/v1/community/campuses`).
 * The list is reference data: only ACTIVE campuses, ordered by `sortOrder`. A post's
 * `campus` and a profile's campus are the `code` (e.g. "HCM"), not the `id`.
 */
export interface CampusView {
    id: string
    code: string
    name: string
    nameEn: string | null
    region: string | null
    active: boolean
    sortOrder: number
}

/** Body sent to `POST /api/v1/community/posts`. */
export interface CreatePostRequest {
    postType: string
    title?: string
    content: string
    contentFormat?: string
    subjectId?: string
    groupId?: string
    campus?: string
    resourceRef?: string
    pollClosesAt?: string
    media?: Array<MediaInput>
    pollOptions?: Array<string>
}

/** Body sent to `PATCH /api/v1/community/posts/{id}`. */
export interface UpdatePostRequest {
    title?: string
    content?: string
}

/** Author card enriched onto a post (BE `PostAuthor`) — present on bookmarks/trending rows. */
export interface PostAuthor {
    userId: string
    username?: string
    displayName?: string
    avatarUrl?: string
}

/** One community post. */
export interface PostResponse {
    id: string
    authorId: string
    postType: string
    title?: string
    content: string
    contentFormat?: string
    subjectId?: string
    groupId?: string
    campus?: string
    resourceRef?: string
    status: string
    likeCount: number
    commentCount: number
    shareCount: number
    voteScore: number
    acceptedCommentId?: string
    pollClosesAt?: string
    createdAt?: string
    hashtags?: Array<string>
    likedByMe?: boolean
    myVote?: number
    bookmarkedByMe?: boolean
    media?: Array<MediaOutput>
    /** Enriched author card (present on `/bookmarks/posts` + trending); null when unresolved. */
    author?: PostAuthor | null
}

/**
 * Public share card of one community post — the anonymous projection served by
 * `GET /api/v1/community/public/posts/{id}`.
 *
 * Deliberately NOT a subset of {@link PostResponse}: it is what an unauthenticated
 * caller (our own server render, plus every link crawler) is allowed to see, so it
 * carries no body, no counters and no ids beyond the post's own. `excerpt` already
 * has markup and every URL stripped by the BE, and `authorName` is the resolved
 * display name.
 */
export interface PublicPostCard {
    id: string
    title?: string | null
    /** Plain-text summary of the body, markup + links removed, capped by the BE. */
    excerpt?: string | null
    /** First image attached to the post; null when it has none. */
    imageUrl?: string | null
    authorName?: string | null
    createdAt?: string | null
}

/** Body sent to `POST /api/v1/community/posts/{id}/poll-votes`. */
export interface PollVoteRequest {
    optionId: string
}

/** One poll option (BE `PollOptionResponse`) — `voteCount` is the denormalized tally. */
export interface PollOptionResponse {
    id: string
    label: string
    voteCount: number
}

/** Poll of a POLL post (BE `PollResponse`, `GET /api/v1/community/posts/{postId}/poll`). */
export interface PollResponse {
    postId: string
    question: string
    /** ISO close timestamp, or absent when the poll has no deadline. */
    closesAt?: string
    /** Options in `sortOrder`. */
    options: Array<PollOptionResponse>
    /** The caller's voted option id, or absent when the caller has not voted. */
    myOptionId?: string
}

/** Body sent to `POST /api/v1/community/posts/{postId}/accepted-answer`. */
export interface AcceptedAnswerRequest {
    commentId: string
}

/** Body sent to `POST /api/v1/community/posts/{id}/comments`. */
export interface CreateCommentRequest {
    content: string
    parentId?: string
}

/** Body sent to `PATCH /api/v1/community/comments/{id}`. */
export interface UpdateCommentRequest {
    content: string
}

/** One comment on a post. */
export interface CommentResponse {
    id: string
    postId: string
    authorId: string
    parentId?: string
    rootId?: string
    depth: number
    content: string
    likeCount: number
    status: string
    createdAt?: string
}

/**
 * Một người quen được BE xếp hạng cho popup `@mention`. Follow luôn đứng trước; phần còn lại
 * dựa trên tần suất tương tác hai chiều quanh bài viết/bình luận.
 */
export interface MentionSuggestionResponse {
    userId: string
    username: string
    displayName: string
    avatarUrl?: string | null
    followedByMe: boolean
    interactionScore: number
}

/** Cursor-paginated page. */
export interface FeedPage<T> {
    items: Array<T>
    nextCursor?: string
}

/** Body sent to `PUT /api/v1/community/reactions`. */
export interface ReactionRequest {
    targetType: string
    targetId: string
    reaction?: string
}

/** Body sent to `PUT /api/v1/community/votes`. */
export interface VoteRequest {
    targetType: string
    targetId: string
    value: number
}

/** Body sent to `POST /api/v1/community/posts/{id}/shares`. */
export interface ShareRequest {
    shareType: string
    quoteContent?: string
}

/** Contributor score for a user. */
export interface ContributorScoreResponse {
    userId: string
    score: number
    upvotesReceived: number
    acceptedAnswers: number
    postsCount: number
}

/** One leaderboard row (BE `LeaderboardEntryResponse`) — non-PII: `userId` + public tallies only. */
export interface LeaderboardEntryResponse {
    userId: string
    score: number
    upvotesReceived: number
    acceptedAnswers: number
    postsCount: number
    /** Absolute rank across pages (`page*size + index + 1`). */
    rank: number
}

/** Ranked contributor page (BE `LeaderboardResponse`, `GET /api/v1/community/leaderboard`). */
export interface LeaderboardResponse {
    items: Array<LeaderboardEntryResponse>
    total: number
    page: number
    size: number
}

/** Body sent to `POST /api/v1/community/reports`. */
export interface CreateReportRequest {
    targetType: string
    targetId: string
    reasonCode: string
    detail?: string
}

/** Body sent to `POST /api/v1/community/moderation/queue/{id}/decision`. */
export interface ModerationDecisionRequest {
    action: string
    note?: string
}

/**
 * One moderation queue item.
 *
 * Ids + enum tokens, PLUS the display context the BE resolves per page
 * (`targetExcerpt` / `targetAuthorName` / `reportReason`). All three are nullable: an AI row
 * has no report behind it, and a hard-deleted target has no content left to quote.
 */
export interface ModerationQueueResponse {
    id: string
    /**
     * Id of the REPORT behind this row — what `POST /community/reports/{id}/escalate`
     * takes. NULLABLE and distinct from `id` (the queue-row id used for decisions): a row
     * pushed by AI/the system with no open report on the target has nothing to escalate.
     */
    reportId?: string | null
    /** `POST` | `COMMENT` | `USER` (BE `ModerationService.REPORT_TARGET_TYPES`). */
    targetType: string
    targetId: string
    /** `REPORT` (raised by a member) | `AI` (raised by the classifier). */
    source: string
    /** BE `Short`: 0 = AI saw nothing, 1 = member report, 2 = AI flagged a violation. */
    priority?: number
    status: string
    createdAt?: string
    /**
     * Plain-text quote of the reported content, ALREADY stripped of markup + every url and
     * capped at 200 chars by the BE (`ModerationExcerpt`). Render as text — never re-strip it
     * and never feed it to a markdown/HTML renderer.
     */
    targetExcerpt?: string | null
    /** Poster's name, already resolved through the BE `DisplayNames` (never `legacy_<uuid>`). */
    targetAuthorName?: string | null
    /** Report reason: the `reasonCode` token, plus `": <detail>"` when the reporter typed one. */
    reportReason?: string | null
}
