import type { GraphQLResponse } from "../../types"

/** Facebook-style reaction kinds (must match backend `ReactionType` string values). */
export enum ReactionType {
    /** A plain thumbs-up acknowledgement. */
    Like = "like",
    /** Strong positive affection. */
    Love = "love",
    /** Found it funny. */
    Haha = "haha",
    /** Surprised / impressed. */
    Wow = "wow",
    /** Saddened by the content. */
    Sad = "sad",
    /** Angered by the content. */
    Angry = "angry",
}

/** A single emotion bucket with its count. */
export interface ReactionCount {
    /** The emotion kind. */
    type: ReactionType
    /** How many users picked this emotion. */
    count: number
}

/** Aggregate reaction state for a target plus the viewer's own pick. */
export interface ReactionSummary {
    /** Per-emotion counts (only emotions with at least one reaction). */
    counts: Array<ReactionCount>
    /** Total reactions across all emotions. */
    total: number
    /** The viewing user's own reaction, or null if none. */
    myReaction: ReactionType | null
    /**
     * Number of distinct users who have read this content (view count).
     * Only present on content-level summaries; always 0 for comment summaries.
     */
    viewCount: number
}

/** Minimal author shape attached to a comment node. */
export interface CommentAuthor {
    /** Author user id. */
    id: string
    /** Author display username. */
    username: string
    /** Author avatar url, or null. */
    avatar: string | null
}

/** A threaded comment shaped for the client. */
export interface CommentNode {
    /** Comment primary id. */
    id: string
    /** Comment body (empty when `isDeleted`). */
    body: string
    /** Whether the comment was soft-deleted by its author. */
    isDeleted: boolean
    /** ISO timestamp of the last edit, or null. */
    editedAt: string | null
    /** ISO creation timestamp. */
    createdAt: string
    /** Parent comment id (null for top-level comments). */
    parentCommentId: string | null
    /** Author of the comment. */
    author: CommentAuthor
    /** Number of direct replies. */
    replyCount: number
    /** Reaction summary for this comment from the viewer's view. */
    reactions: ReactionSummary
}

/** A page of comments plus total count. */
export interface CommentsPage {
    /** The page of comment nodes. */
    comments: Array<CommentNode>
    /** Total comments matching the scope. */
    total: number
}

/** Request body for the `contentComments` query. */
export interface ContentCommentsRequest {
    /** Content whose comments are listed. */
    contentId: string
    /** Parent comment id to list replies of; null/omitted for top-level. */
    parentCommentId?: string | null
    /** 1-based page number (default 1). */
    page?: number
    /** Page size (default 20). */
    limit?: number
}

/** Apollo response shape for `contentComments`. */
export interface QueryContentCommentsResponse {
    /** Top-level `contentComments` field wrapping the standard API response. */
    contentComments: GraphQLResponse<CommentsPage>
}

/** Request body for the `contentReactions` query. */
export interface ContentReactionsRequest {
    /** Content to summarize reactions for. */
    contentId: string
}

/** Apollo response shape for `contentReactions`. */
export interface QueryContentReactionsResponse {
    /** Top-level `contentReactions` field wrapping the standard API response. */
    contentReactions: GraphQLResponse<ReactionSummary>
}
