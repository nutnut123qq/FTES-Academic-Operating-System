import type { GraphQLResponse } from "../../types"
import type { ReactionType, ReactionSummary } from "../../queries/types/discussion"
import type { QueryCommunityCommentNode } from "../../queries/types/community-comments"

/** GraphQL `CreateCommunityPostCommentRequest` body. */
export interface CreateCommunityPostCommentRequest {
    /** Post the comment is attached to. */
    postId: string
    /** Parent comment id when replying; null/omitted for a top-level comment. */
    parentCommentId?: string | null
    /** Raw comment body authored by the user. */
    body: string
}

/** Apollo response shape for `createCommunityPostComment` (the new comment node). */
export interface MutateCreateCommunityPostCommentResponse {
    /** Top-level `createCommunityPostComment` field wrapping the standard API response. */
    createCommunityPostComment: GraphQLResponse<QueryCommunityCommentNode>
}

/** GraphQL `ReactToCommunityPostCommentRequest` body. */
export interface ReactCommunityPostCommentRequest {
    /** Comment being reacted to. */
    commentId: string
    /** New emotion, or null to remove the existing reaction. */
    type?: ReactionType | null
}

/** Apollo response shape for `reactToCommunityPostComment` (refreshed reaction summary). */
export interface MutateReactCommunityPostCommentResponse {
    /** Top-level `reactToCommunityPostComment` field wrapping the standard API response. */
    reactToCommunityPostComment: GraphQLResponse<ReactionSummary>
}
