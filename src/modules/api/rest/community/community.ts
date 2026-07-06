import { restRequest } from "@/modules/api/rest/client"
import type {
    AcceptedAnswerRequest,
    ContributorScoreResponse,
    CreateReportRequest,
    FeedPage,
    MediaInput,
    MediaOutput,
    ModerationDecisionRequest,
    ModerationQueueResponse,
    PollVoteRequest,
    PostResponse,
    ShareRequest,
    UpdatePostRequest,
    VoteRequest,
} from "./types"

// ---------------------------------------------------------------- PostController (non-GraphQL)

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
