import type { GraphQLResponse } from "../../types"
import type { CommunityPostAuthor, CommunityPostReactions } from "./community-feed"

/** A threaded community post comment shaped for the client. */
export interface QueryCommunityCommentNode {
    /** Comment primary id. */
    id: string
    /** Comment body (empty when `isDeleted`). */
    body: string
    /** Whether the comment was soft-deleted by its author. */
    isDeleted: boolean
    /** ISO timestamp of the last edit, or null. */
    editedAt: string | null
    /** ISO timestamp the comment was created. */
    createdAt: string
    /** Parent comment id (null for top-level comments). */
    parentCommentId: string | null
    /** Author of the comment. */
    author: CommunityPostAuthor
    /** Number of direct replies to this comment. */
    replyCount: number
    /** Reaction summary from the viewer's perspective. */
    reactions: CommunityPostReactions
    /** Whether the author is the founder (drives the founder badge). */
    isFounderAuthor: boolean
}

/** Variables for the `communityPostComments` query. */
export interface CommunityPostCommentsRequest {
    /** Post whose comments are listed. */
    postId: string
    /** Parent comment id to list its replies; omit for top-level comments. */
    parentCommentId?: string | null
    /** 1-based page number. */
    page?: number
    /** Page size. */
    limit?: number
}

/** Payload inside `communityPostComments.data`. */
export interface QueryCommunityPostCommentsData {
    /** The page of comment nodes. */
    comments: Array<QueryCommunityCommentNode>
    /** Total comments matching the scope (for pagination). */
    total: number
}

/** Apollo response shape for `communityPostComments`. */
export interface QueryCommunityPostCommentsResponse {
    /** Top-level `communityPostComments` field wrapping the standard API response. */
    communityPostComments: GraphQLResponse<QueryCommunityPostCommentsData>
}
