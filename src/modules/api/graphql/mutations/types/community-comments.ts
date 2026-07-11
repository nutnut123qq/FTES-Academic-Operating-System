import type { GraphQLResponse } from "../../types"
import type { ReactionType, ReactionSummary } from "../../queries/types/discussion"

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
