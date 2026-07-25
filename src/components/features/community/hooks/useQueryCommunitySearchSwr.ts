"use client"

import useSWRInfinite from "swr/infinite"
import { useLocale } from "next-intl"
import {
    CommunitySearchSort,
    queryCommunitySearch,
} from "@/modules/api/graphql/queries/query-community-search"
import {
    COMMUNITY_FEED_TAG,
    toCommunityPost,
    type CommunityFeedPage,
    type CommunityPost,
} from "./useQueryCommunityFeedSwr"

/** Active search/filter criteria driving {@link useQueryCommunitySearchSwr}. */
export interface CommunitySearchCriteria {
    /** Keyword (LIKE title/content); trimmed before use. */
    q: string
    /** Time sort (newest default / oldest). */
    sort: CommunitySearchSort
    /** Optional post type (BE `postType`) filter; "" = any. */
    postType?: string
    /** Optional author id filter; "" = any. */
    authorId?: string
    /** Optional group id filter; "" = any. */
    groupId?: string
}

/** Items per search page (BE `CursorInput.limit`, capped at 50 server-side). */
const PAGE_LIMIT = 20

/**
 * SWR cache tag for community search. It intentionally STARTS WITH
 * {@link COMMUNITY_FEED_TAG} so the search infinite caches are picked up by
 * `communityFeedCacheKeys` → the optimistic like/comment mutations patch a search result
 * just like a feed row (identical {@link CommunityFeedPage} shape). Keep the prefix.
 */
export const COMMUNITY_SEARCH_TAG = `${COMMUNITY_FEED_TAG}-search`

/**
 * Infinite-scroll page key:
 * `["community-feed-search", q, sort, postType, authorId, groupId, cursor]` (null ⇒ no fetch).
 */
export type SearchPageKey = readonly [
    string,
    string,
    CommunitySearchSort,
    string,
    string,
    string,
    string,
]

/** True when any search/filter dimension is set — search mode replaces the tab feed. */
export const isSearchActive = (criteria: CommunitySearchCriteria): boolean =>
    criteria.q.trim().length > 0 ||
    Boolean(criteria.postType) ||
    Boolean(criteria.authorId) ||
    Boolean(criteria.groupId)

/**
 * `useSWRInfinite` key factory for community search — pure, so both GATES are unit-testable
 * without rendering:
 *
 * 1. idle search bar (no keyword, no filter) ⇒ `null`, so SWR never fetches;
 * 2. previous page came back WITHOUT a `nextCursor` ⇒ `null`, so paging stops at the last
 *    page instead of firing one more empty request.
 *
 * Page 1 carries no cursor; later pages key off the previous page's `nextCursor` (for search
 * the BE cursor is the PAGE NUMBER as a string — see `query-community-search`).
 */
export const communitySearchPageKey = (
    criteria: CommunitySearchCriteria,
    index: number,
    previous: CommunityFeedPage | null,
): SearchPageKey | null => {
    if (!isSearchActive(criteria)) {
        return null
    }
    if (previous && !previous.nextCursor) {
        return null
    }
    const cursor = index === 0 ? "" : previous?.nextCursor ?? ""
    return [
        COMMUNITY_SEARCH_TAG,
        criteria.q.trim(),
        criteria.sort,
        criteria.postType ?? "",
        criteria.authorId ?? "",
        criteria.groupId ?? "",
        cursor,
    ]
}

/**
 * Loads community search results from the real BE GraphQL `communitySearch`, cursor-paginated
 * with `useSWRInfinite` (page N+1 keys off page N's `nextCursor`) so the result list grows on
 * scroll instead of stopping at a hardcoded first page.
 *
 * GATED: the key is `null` (no fetch) until a keyword or filter is set, so an idle search bar
 * costs nothing and the tab feed stays in charge. Keyed on the full criteria so changing any
 * dimension refetches from page 1. Requires auth; PRIVATE-group posts the viewer can't see are
 * excluded server-side.
 *
 * Returns the flattened post list plus `hasMore` / `isLoadingMore` / `size` / `setSize` for the
 * {@link import("@/components/blocks/async/InfiniteScrollSentinel").InfiniteScrollSentinel}.
 */
export const useQueryCommunitySearchSwr = (criteria: CommunitySearchCriteria) => {
    const locale = useLocale()
    const active = isSearchActive(criteria)

    const getKey = (index: number, previous: CommunityFeedPage | null): SearchPageKey | null =>
        communitySearchPageKey(criteria, index, previous)

    const fetchPage = async ([
        ,
        q,
        sort,
        postType,
        authorId,
        groupId,
        cursor,
    ]: SearchPageKey): Promise<CommunityFeedPage> => {
        const result = await queryCommunitySearch({
            q: q || null,
            sort,
            postType: postType || null,
            authorId: authorId || null,
            groupId: groupId || null,
            page: { limit: PAGE_LIMIT, cursor: cursor || undefined },
        })
        const connection = result.data?.communitySearch
        return {
            items: (connection?.items ?? []).map((item) => toCommunityPost(item, locale)),
            nextCursor: connection?.nextCursor ?? null,
        }
    }

    const { data, isLoading, isValidating, error, size, setSize, mutate } =
        useSWRInfinite<CommunityFeedPage>(getKey, fetchPage, { revalidateFirstPage: false })

    const posts: Array<CommunityPost> = (data ?? []).flatMap((page) => page.items)
    const lastPage = data?.[data.length - 1]
    const hasMore = Boolean(lastPage?.nextCursor)
    const isLoadingInitial = active && (isLoading || (isValidating && (data?.length ?? 0) === 0))
    const isLoadingMore = isValidating && (data?.length ?? 0) > 0

    return {
        posts,
        isLoading: isLoadingInitial,
        isLoadingMore,
        error,
        hasMore,
        size,
        setSize,
        mutate,
        active,
    }
}

export { CommunitySearchSort }
