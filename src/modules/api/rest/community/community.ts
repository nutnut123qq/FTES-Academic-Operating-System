import { restRequest } from "@/modules/api/rest/client"
import type {
    AcceptedAnswerRequest,
    CommentResponse,
    ContributorScoreResponse,
    CreatePostRequest,
    CreateReportRequest,
    FeedPage,
    LeaderboardResponse,
    MediaUploadResponse,
    ModerationDecisionRequest,
    ModerationQueueResponse,
    PollResponse,
    PollVoteRequest,
    PostResponse,
    ShareRequest,
    UpdatePostRequest,
    VoteRequest,
} from "./types"

// ---------------------------------------------------------------- PostController (non-GraphQL)

/**
 * Creates a new community post.
 *
 * `POST /api/v1/community/posts`
 */
export const createPost = async (
    request: CreatePostRequest,
): Promise<PostResponse> => {
    return restRequest<PostResponse>({
        method: "POST",
        url: "/community/posts",
        data: request,
    })
}

/**
 * Uploads one image for a community post. The BE stores it on the platform image provider
 * (Cloudinary) under its own folder and returns the delivery URLs; only a `secureUrl` issued here
 * is accepted as a post's `media[].storageKey`.
 *
 * Requires `community.post.create` — the same permission that gates posting. Limits mirrored by the
 * server: 10MB and png/jpeg/webp/gif.
 *
 * `Content-Type: null` lets the browser set the multipart boundary (same trick as `uploadAvatar`).
 *
 * `POST /api/v1/community/media`
 */
export const uploadCommunityMedia = async (file: File): Promise<MediaUploadResponse> => {
    const formData = new FormData()
    formData.append("file", file)
    return restRequest<MediaUploadResponse>({
        method: "POST",
        url: "/community/media",
        data: formData,
        headers: { "Content-Type": null as unknown as string },
    })
}

/**
 * Adds a comment (top-level, or a one-level reply when `parentId` is set) to a post.
 * The BE `CreateCommentRequest` names the text field `content`, so the FE-friendly
 * `body` is mapped onto it here.
 *
 * `POST /api/v1/community/posts/{postId}/comments`
 */
export const addComment = async (
    postId: string,
    request: { body: string; parentId?: string },
): Promise<CommentResponse> => {
    return restRequest<CommentResponse>({
        method: "POST",
        url: `/community/posts/${postId}/comments`,
        data: { content: request.body, parentId: request.parentId },
    })
}

/**
 * Lists a post's comments as a flat, cursor-paginated thread (top-level comments
 * plus their one-level replies carry `parentId`/`rootId`/`depth`). Group posts are
 * community posts, so the group discussion UI reuses this endpoint.
 *
 * `GET /api/v1/community/posts/{postId}/comments`
 */
export const getPostComments = async (
    postId: string,
    params?: { cursor?: string; limit?: number },
): Promise<FeedPage<CommentResponse>> => {
    return restRequest<FeedPage<CommentResponse>>({
        method: "GET",
        url: `/community/posts/${postId}/comments`,
        params: { cursor: params?.cursor || undefined, limit: params?.limit ?? 20 },
        authenticated: true,
    })
}

/**
 * Returns the detail of a single community post.
 *
 * `GET /api/v1/community/posts/{id}`
 */
export const getPost = async (id: string): Promise<PostResponse> => {
    return restRequest<PostResponse>({
        method: "GET",
        url: `/community/posts/${id}`,
        authenticated: true,
    })
}

/**
 * Updates a community post.
 *
 * `PATCH /api/v1/community/posts/{id}`
 */
export const updatePost = async (
    id: string,
    request: UpdatePostRequest,
): Promise<PostResponse> => {
    return restRequest<PostResponse>({
        method: "PATCH",
        url: `/community/posts/${id}`,
        data: request,
    })
}

/**
 * Deletes a community post.
 *
 * `DELETE /api/v1/community/posts/{id}`
 */
export const deletePost = async (id: string): Promise<void> => {
    return restRequest<void>({
        method: "DELETE",
        url: `/community/posts/${id}`,
    })
}

/**
 * Returns the poll of a POLL post: options with `voteCount` plus the caller's
 * `myOptionId`. Visibility is enforced by the BE (a private-group poll the caller
 * cannot read 404s, indistinguishable from not-found).
 *
 * `GET /api/v1/community/posts/{postId}/poll`
 */
export const getPoll = async (postId: string): Promise<PollResponse> => {
    return restRequest<PollResponse>({
        method: "GET",
        url: `/community/posts/${postId}/poll`,
        authenticated: true,
    })
}

/**
 * Casts a vote on a poll option.
 *
 * `POST /api/v1/community/posts/{id}/poll-votes`
 */
export const votePoll = async (
    id: string,
    request: PollVoteRequest,
): Promise<void> => {
    return restRequest<void>({
        method: "POST",
        url: `/community/posts/${id}/poll-votes`,
        data: request,
    })
}

/**
 * Marks a comment as the accepted answer for a post.
 *
 * `POST /api/v1/community/posts/{postId}/accepted-answer`
 */
export const acceptAnswer = async (
    postId: string,
    request: AcceptedAnswerRequest,
): Promise<void> => {
    return restRequest<void>({
        method: "POST",
        url: `/community/posts/${postId}/accepted-answer`,
        data: request,
    })
}

/**
 * Returns trending community posts.
 *
 * `GET /api/v1/community/trending?scope=&limit=`
 */
export const getTrending = async (params?: {
    scope?: string
    limit?: number
}): Promise<Array<PostResponse>> => {
    return restRequest<Array<PostResponse>>({
        method: "GET",
        url: "/community/trending",
        params: {
            scope: params?.scope ?? "GLOBAL",
            limit: params?.limit ?? 20,
        },
        authenticated: true,
    })
}

// ---------------------------------------------------------------- InteractionController (non-GraphQL)

/**
 * Adds/replaces the current user's reaction on a post. The BE reaction API is target-typed;
 * for a post the target is `{ targetType: "POST", targetId: postId }` and the reaction defaults
 * to `LIKE` when omitted.
 *
 * `PUT /api/v1/community/reactions`
 */
export const reactToPost = async (
    postId: string,
    request?: { reactionType?: string },
): Promise<void> => {
    return restRequest<void>({
        method: "PUT",
        url: "/community/reactions",
        data: {
            targetType: "POST",
            targetId: postId,
            reaction: request?.reactionType ?? "LIKE",
        },
    })
}

/**
 * Removes the current user's reaction from a post.
 *
 * `DELETE /api/v1/community/reactions`
 */
export const unreactPost = async (postId: string): Promise<void> => {
    return restRequest<void>({
        method: "DELETE",
        url: "/community/reactions",
        data: { targetType: "POST", targetId: postId },
    })
}

/**
 * Casts an upvote/downvote on a target.
 *
 * `PUT /api/v1/community/votes`
 */
export const vote = async (request: VoteRequest): Promise<void> => {
    return restRequest<void>({
        method: "PUT",
        url: "/community/votes",
        data: request,
    })
}

/**
 * Shares a community post.
 *
 * `POST /api/v1/community/posts/{id}/shares`
 */
export const sharePost = async (
    id: string,
    request: ShareRequest,
): Promise<PostResponse> => {
    return restRequest<PostResponse>({
        method: "POST",
        url: `/community/posts/${id}/shares`,
        data: request,
    })
}

/**
 * Bookmarks a post for the current user.
 *
 * `PUT /api/v1/community/bookmarks/{postId}`
 */
export const bookmarkPost = async (postId: string): Promise<void> => {
    return restRequest<void>({
        method: "PUT",
        url: `/community/bookmarks/${postId}`,
    })
}

/**
 * Removes a post bookmark.
 *
 * `DELETE /api/v1/community/bookmarks/{postId}`
 */
export const unbookmarkPost = async (postId: string): Promise<void> => {
    return restRequest<void>({
        method: "DELETE",
        url: `/community/bookmarks/${postId}`,
    })
}

/**
 * Lists the current user's bookmarked post ids.
 *
 * `GET /api/v1/community/bookmarks?limit=`
 */
export const getBookmarks = async (limit = 50): Promise<Array<string>> => {
    return restRequest<Array<string>>({
        method: "GET",
        url: "/community/bookmarks",
        params: { limit },
        authenticated: true,
    })
}

/**
 * Lists the caller's bookmarked posts as full, author-enriched cards (newest-saved
 * first), cursor-paginated. Backs the `/community/saved` page.
 *
 * `GET /api/v1/community/bookmarks/posts?cursor=&limit=`
 */
export const getBookmarkedPosts = async (
    cursor?: string,
    limit = 20,
): Promise<FeedPage<PostResponse>> => {
    return restRequest<FeedPage<PostResponse>>({
        method: "GET",
        url: "/community/bookmarks/posts",
        params: { cursor: cursor || undefined, limit },
        authenticated: true,
    })
}

/**
 * Returns the contributor score for a user.
 *
 * `GET /api/v1/community/users/{id}/contributor-score`
 */
export const getContributorScore = async (
    userId: string,
): Promise<ContributorScoreResponse> => {
    return restRequest<ContributorScoreResponse>({
        method: "GET",
        url: `/community/users/${userId}/contributor-score`,
        authenticated: true,
    })
}

/**
 * Returns one page of the global contributor leaderboard (sorted score desc,
 * `userId` asc tie-break; non-PII — rows carry `userId` + public tallies only).
 *
 * `GET /api/v1/community/leaderboard?page=&size=`
 */
export const getLeaderboard = async (params?: {
    page?: number
    size?: number
}): Promise<LeaderboardResponse> => {
    return restRequest<LeaderboardResponse>({
        method: "GET",
        url: "/community/leaderboard",
        params: {
            page: params?.page ?? 0,
            size: params?.size ?? 20,
        },
        authenticated: true,
    })
}

/**
 * Reports a post or comment for moderation.
 *
 * `POST /api/v1/community/reports`
 */
export const report = async (
    request: CreateReportRequest,
): Promise<string> => {
    return restRequest<string>({
        method: "POST",
        url: "/community/reports",
        data: request,
    })
}

/**
 * Escalates a report to a workflow appeal (moderator only).
 *
 * `POST /api/v1/community/reports/{id}/escalate`
 */
export const escalateReport = async (id: string): Promise<string> => {
    return restRequest<string>({
        method: "POST",
        url: `/community/reports/${id}/escalate`,
    })
}

/**
 * Lists moderation queue items (moderator only).
 *
 * `GET /api/v1/community/moderation/queue?status=&limit=`
 */
export const getModerationQueue = async (params?: {
    status?: string | null
    limit?: number
}): Promise<Array<ModerationQueueResponse>> => {
    return restRequest<Array<ModerationQueueResponse>>({
        method: "GET",
        url: "/community/moderation/queue",
        params: {
            status: params?.status ?? undefined,
            limit: params?.limit ?? 50,
        },
        authenticated: true,
    })
}

/**
 * Makes a moderation decision on a queue item (moderator only).
 *
 * `POST /api/v1/community/moderation/queue/{id}/decision`
 */
export const decideModeration = async (
    id: string,
    request: ModerationDecisionRequest,
): Promise<void> => {
    return restRequest<void>({
        method: "POST",
        url: `/community/moderation/queue/${id}/decision`,
        data: request,
    })
}
