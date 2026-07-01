import type { GraphQLResponse } from "../../types"
import type { ReactionType, ReactionSummary } from "../../queries/types/discussion"
import type { CommunityChannel, QueryCommunityFeedItemData } from "../../queries/types/community-feed"

/** GraphQL `CreateCommunityPostRequest` body. */
export interface CreateCommunityPostRequest {
    /** Channel the post is published to (defaults to general). */
    channel?: CommunityChannel
    /** Raw markdown/plain body authored by the user. */
    body: string
}

/** Apollo response shape for `createCommunityPost` (the newly created post node). */
export interface MutateCreateCommunityPostResponse {
    /** Top-level `createCommunityPost` field wrapping the standard API response. */
    createCommunityPost: GraphQLResponse<QueryCommunityFeedItemData>
}

/** GraphQL `ReactToCommunityPostRequest` body (set/change/remove a reaction on a post). */
export interface ReactCommunityPostRequest {
    /** Post being reacted to. */
    postId: string
    /** New emotion, or null to remove the existing reaction. */
    type?: ReactionType | null
}

/** Apollo response shape for `reactToCommunityPost` (the post's refreshed reaction summary). */
export interface MutateReactCommunityPostResponse {
    /** Top-level `reactToCommunityPost` field wrapping the standard API response. */
    reactToCommunityPost: GraphQLResponse<ReactionSummary>
}
