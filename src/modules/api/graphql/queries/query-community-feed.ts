import { createAuthApolloClient } from "../clients"
import { type GraphQLOperationContext, type GraphQLHeaders } from "../types"
import { DocumentNode, gql } from "@apollo/client"

/**
 * Real BE community feed — GraphQL `feed(tab: FeedTab!, page: CursorInput): PostConnection!`
 * (schema.graphqls). Returns the `PostConnection` directly (NO `{success,message,error,data}`
 * envelope). `Post` is intentionally minimal (id/kind/title/createdAt + batched `author`);
 * the BE feed carries NO body/likes/comment counts — those are degraded/hidden by the consumer.
 *
 * ⚠️ Gateway quirk (verified against apitest): the pre-GraphQL security filter rejects ANY
 * operation that declares a NON-NULL variable (`$x: T!`) with a top-level 401
 * `PLATFORM_UNAUTHORIZED`. So `tab` (which the schema types `FeedTab!`) is INLINED as an enum
 * literal per tab, and only the nullable `$page: CursorInput` is passed as a variable.
 */

/** Feed scope (mirrors BE `enum FeedTab`). CAMPUS needs a campus arg the resolver does not pass. */
export enum FeedTab {
    ForYou = "FOR_YOU",
    Following = "FOLLOWING",
    Campus = "CAMPUS",
    Trending = "TRENDING",
}

/** Author attached to a feed post (BE `PublicUser`; non-PII by policy). */
export interface FeedPostAuthor {
    id: string
    username: string | null
    displayName: string | null
    avatarUrl: string | null
}

/**
 * One feed post (BE `Post`). Carries the READ-only engagement enrichment the gateway
 * now denormalizes onto every feed row: `snippet` (short excerpt derived from body),
 * `likeCount`/`commentCount` (denorm counters) and `likedByMe` (viewer reacted?).
 */
export interface FeedPost {
    id: string
    /** Post type / kind (BE `kind`, e.g. DISCUSSION/QUESTION). */
    kind: string
    title: string | null
    /** ISO timestamp (BE `DateTime`), or null. */
    createdAt: string | null
    author: FeedPostAuthor
    /** Short excerpt for the feed card (BE `snippet`, derived from body); null when empty. */
    snippet: string | null
    /** Denormalized like counter (BE `likeCount`). */
    likeCount: number
    /** Whether the current viewer has reacted to this post (BE `likedByMe`). */
    likedByMe: boolean
    /** Denormalized comment counter (BE `commentCount`). */
    commentCount: number
}

/** Cursor-paginated page of posts (BE `PostConnection`). */
export interface FeedConnection {
    items: Array<FeedPost>
    nextCursor: string | null
}

/** Apollo response shape for `feed` (returned directly — no envelope). */
export interface QueryCommunityFeedResponse {
    feed: FeedConnection
}

/** Post/author selection shared by every per-tab document. */
const FEED_SELECTION = `
  items {
    id
    kind
    title
    createdAt
    snippet
    likeCount
    likedByMe
    commentCount
    author {
      id
      username
      displayName
      avatarUrl
    }
  }
  nextCursor
`

/** Build a feed document with the `tab` enum INLINED (see the non-null-variable quirk above). */
const feedDocument = (tab: FeedTab): DocumentNode =>
    gql(
        `query CommunityFeed($page: CursorInput) {\n` +
            `  feed(tab: ${tab}, page: $page) {${FEED_SELECTION}}\n` +
            `}`,
    )

/** Pre-built documents per tab (enum inlined; only FOR_YOU/FOLLOWING/TRENDING are usable). */
const queryMap: Record<FeedTab, DocumentNode> = {
    [FeedTab.ForYou]: feedDocument(FeedTab.ForYou),
    [FeedTab.Following]: feedDocument(FeedTab.Following),
    [FeedTab.Campus]: feedDocument(FeedTab.Campus),
    [FeedTab.Trending]: feedDocument(FeedTab.Trending),
}

/** Optional cursor page (BE `CursorInput`); nullable so the filter never 401s. */
export interface FeedCursorInput {
    cursor?: string | null
    limit?: number | null
}

/** Params for {@link queryCommunityFeed}. */
export interface QueryCommunityFeedParams extends GraphQLOperationContext {
    /** Feed scope; defaults to FOR_YOU. */
    tab?: FeedTab
    /** Cursor page; `{ limit }` for page 1, `{ cursor }` for the next page. */
    page?: FeedCursorInput
    headers?: GraphQLHeaders
    debug?: boolean
}

/**
 * Fetches one page of the community feed for a tab. The BE `feed` requires auth
 * (viewer-scoped visibility); guests get a 401 which surfaces as an Apollo error.
 *
 * @returns Apollo query result; the page is at `data.feed` (returned directly, no envelope).
 */
export const queryCommunityFeed = async ({
    tab = FeedTab.ForYou,
    page,
    headers,
    debug,
    signal,
}: QueryCommunityFeedParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })
    return apollo.query<QueryCommunityFeedResponse>({
        query: queryMap[tab],
        variables: { page: page ?? null },
    })
}
