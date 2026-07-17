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

/** One moderation queue item. */
export interface ModerationQueueResponse {
    id: string
    targetType: string
    targetId: string
    source: string
    priority?: number
    status: string
    createdAt?: string
}
