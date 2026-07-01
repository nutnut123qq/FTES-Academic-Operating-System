import type { GraphQLResponse } from "../../types"
import type {
    CommentNode,
    ReactionSummary,
    ReactionType,
} from "../../queries/types/discussion"

/** GraphQL `CreateCommentRequest` body. */
export interface CreateCommentRequest {
    /** Content the comment is attached to. */
    contentId: string
    /** Parent comment id when replying; null/omitted for a top-level comment. */
    parentCommentId?: string | null
    /** Raw comment body authored by the user. */
    body: string
}

/** Apollo response shape for `createComment`. */
export interface MutateCreateCommentResponse {
    /** Top-level `createComment` field wrapping the standard API response. */
    createComment: GraphQLResponse<CommentNode>
}

/** GraphQL `UpdateCommentRequest` body. */
export interface UpdateCommentRequest {
    /** Comment being edited. */
    commentId: string
    /** New body to persist. */
    body: string
}

/** Apollo response shape for `updateComment`. */
export interface MutateUpdateCommentResponse {
    /** Top-level `updateComment` field wrapping the standard API response. */
    updateComment: GraphQLResponse<CommentNode>
}

/** GraphQL `DeleteCommentRequest` body. */
export interface DeleteCommentRequest {
    /** Comment being deleted. */
    commentId: string
}

/** Payload inside `deleteComment.data`. */
export interface DeletedComment {
    /** Id of the soft-deleted comment. */
    id: string
}

/** Apollo response shape for `deleteComment`. */
export interface MutateDeleteCommentResponse {
    /** Top-level `deleteComment` field wrapping the standard API response. */
    deleteComment: GraphQLResponse<DeletedComment>
}

/** GraphQL `ReactToContentRequest` body. */
export interface ReactToContentRequest {
    /** Content being reacted to. */
    contentId: string
    /** New emotion, or null to remove the existing reaction. */
    type?: ReactionType | null
}

/** Apollo response shape for `reactToContent`. */
export interface MutateReactToContentResponse {
    /** Top-level `reactToContent` field wrapping the standard API response. */
    reactToContent: GraphQLResponse<ReactionSummary>
}

/** GraphQL `ReactToCommentRequest` body. */
export interface ReactToCommentRequest {
    /** Comment being reacted to. */
    commentId: string
    /** New emotion, or null to remove the existing reaction. */
    type?: ReactionType | null
}

/** Apollo response shape for `reactToComment`. */
export interface MutateReactToCommentResponse {
    /** Top-level `reactToComment` field wrapping the standard API response. */
    reactToComment: GraphQLResponse<ReactionSummary>
}
