import { createAuthApolloClient } from "../clients"
import { type GraphQLOperationContext, type GraphQLHeaders } from "../types"
import { gql } from "@apollo/client"
import {
    FEED_SELECTION,
    type FeedConnection,
    type FeedCursorInput,
} from "./query-community-feed"

/**
 * Real BE community search — GraphQL `communitySearch(q, sort, authorId, postType, groupId, page):
 * PostConnection!` (schema.graphqls). Searches ALL PUBLISHED posts by keyword (LIKE on title/content)
 * with optional author/type/group filters and a time sort. Returns the same `PostConnection` shape as
 * `feed`, so the feed card mapping/selection is reused verbatim.
 *
 * ⚠️ Gateway quirk: the pre-GraphQL security filter 401s any NON-NULL declared variable. Every arg of
 * `communitySearch` is NULLABLE in the schema, so they are all safe to pass as variables (no inlining
 * needed, unlike `feed.tab`). `page.cursor` carries the PAGE NUMBER (string) for search pagination.
 */

/** Time sort for search results (mirrors BE `enum SortOrder`). DESC = newest-first (default). */
export enum CommunitySearchSort {
    Newest = "DESC",
    Oldest = "ASC",
}

/** Apollo response shape for `communitySearch` (returned directly — no envelope). */
export interface QueryCommunitySearchResponse {
    communitySearch: FeedConnection
}

const SEARCH_DOCUMENT = gql(
    `query CommunitySearch($q: String, $sort: SortOrder, $authorId: ID, $postType: String, ` +
        `$groupId: ID, $page: CursorInput) {\n` +
        `  communitySearch(q: $q, sort: $sort, authorId: $authorId, postType: $postType, ` +
        `groupId: $groupId, page: $page) {${FEED_SELECTION}}\n` +
        `}`,
)

/** Params for {@link queryCommunitySearch}. */
export interface QueryCommunitySearchParams extends GraphQLOperationContext {
    /** Keyword (LIKE on title/content); null/empty = no keyword filter. */
    q?: string | null
    /** Time sort; defaults to newest-first. */
    sort?: CommunitySearchSort
    /** Optional author (BE `authorId`); null = any author. */
    authorId?: string | null
    /** Optional post type (BE `postType`, e.g. DISCUSSION/QUESTION); null = any type. */
    postType?: string | null
    /** Optional group (BE `groupId`); null = any group. */
    groupId?: string | null
    /** Page cursor; `page.cursor` = page number (string). */
    page?: FeedCursorInput
    headers?: GraphQLHeaders
    debug?: boolean
}

/**
 * Searches PUBLISHED community posts. Requires auth (viewer-scoped visibility — posts in PRIVATE groups
 * the viewer is not a member of are excluded server-side); a guest / error surfaces as an Apollo error.
 *
 * @returns Apollo query result; the page is at `data.communitySearch` (returned directly, no envelope).
 */
export const queryCommunitySearch = async ({
    q,
    sort = CommunitySearchSort.Newest,
    authorId,
    postType,
    groupId,
    page,
    headers,
    debug,
    signal,
}: QueryCommunitySearchParams) => {
    const apollo = createAuthApolloClient({ cache: false, headers, debug, signal })
    return apollo.query<QueryCommunitySearchResponse>({
        query: SEARCH_DOCUMENT,
        variables: {
            q: q ?? null,
            sort,
            authorId: authorId ?? null,
            postType: postType ?? null,
            groupId: groupId ?? null,
            page: page ?? null,
        },
    })
}
