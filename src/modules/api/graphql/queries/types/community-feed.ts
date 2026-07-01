import type { GraphQLResponse } from "../../types"
import type { ReactionType } from "./discussion"

/** Top-level channel a community post belongs to (mirrors backend `CommunityChannel`). */
export enum CommunityChannel {
    /** General chatter — the default catch-all channel. */
    General = "general",
    /** Posts describing a problem the author needs help with. */
    Problems = "problems",
    /** Questions addressed to the founder (answered via comments). */
    FounderQa = "founderQa",
}

/** Minimal author shape attached to a community post node. */
export interface CommunityPostAuthor {
    /** Author user id. */
    id: string
    /** Author display username. */
    username: string
    /** Author display name (falls back to username when empty). */
    displayName: string | null
    /** Author avatar url, or null. */
    avatar: string | null
}

/** Reaction summary attached to a community post (subset selected by the feed). */
export interface CommunityPostReactions {
    /** Total reactions across all emotions. */
    total: number
    /** The viewing user's own reaction, or null. */
    myReaction: ReactionType | null
}

/** One community feed post shaped for the client. */
export interface QueryCommunityFeedItemData {
    /** Post primary id. */
    id: string
    /** Post body authored by the user (markdown). */
    body: string
    /** Channel the post belongs to. */
    channel: CommunityChannel
    /** Whether the post is pinned to the top of its channel. */
    isPinned: boolean
    /** ISO timestamp of the last edit, or null. */
    editedAt: string | null
    /** ISO timestamp the post was created. */
    createdAt: string
    /** Author of the post. */
    author: CommunityPostAuthor
    /** Number of comments on this post. */
    commentCount: number
    /** Reaction summary from the viewer's perspective. */
    reactions: CommunityPostReactions
    /** Whether the viewing user authored this post. */
    isMine: boolean
    /** Whether the author is the founder (drives the founder badge). */
    isFounderAuthor: boolean
}

/** Variables for the cursor-paginated `communityFeed` query. */
export interface CommunityFeedRequest {
    /** Channel to scope to; omit to read across all channels. */
    channel?: CommunityChannel | null
    /** Opaque cursor from the previous page; omit for page 1. */
    cursor?: string
    /** Max items per page. */
    limit?: number
}

/** Payload inside `communityFeed.data`. */
export interface QueryCommunityFeedResponseData {
    /** Feed posts for this page (pinned-first, then newest). */
    items: Array<QueryCommunityFeedItemData>
    /** Cursor for the next page; null when no more. */
    nextCursor: string | null
}

/** Apollo response shape for `communityFeed`. */
export interface QueryCommunityFeedResponse {
    /** Top-level `communityFeed` field wrapping the standard API response. */
    communityFeed: GraphQLResponse<QueryCommunityFeedResponseData>
}
