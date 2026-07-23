"use client"

import useSWR from "swr"
import { useLocale } from "next-intl"
import {
    CommunitySearchSort,
    queryCommunitySearch,
} from "@/modules/api/graphql/queries/query-community-search"
import { toCommunityPost, type CommunityPost } from "./useQueryCommunityFeedSwr"

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

/** Items per search page (BE search is page-based; v1 shows the first page). */
const PAGE_LIMIT = 20

/** True when any search/filter dimension is set — search mode replaces the tab feed. */
export const isSearchActive = (criteria: CommunitySearchCriteria): boolean =>
    criteria.q.trim().length > 0 ||
    Boolean(criteria.postType) ||
    Boolean(criteria.authorId) ||
    Boolean(criteria.groupId)

/**
 * Loads community search results from the real BE GraphQL `communitySearch`. GATED: the SWR key is
 * `null` (no fetch) until a keyword or filter is set, so an idle search bar costs nothing and the tab
 * feed stays in charge. Keyed on the full criteria so changing any dimension refetches. Requires auth;
 * PRIVATE-group posts the viewer can't see are excluded server-side.
 */
export const useQueryCommunitySearchSwr = (criteria: CommunitySearchCriteria) => {
    const locale = useLocale()
    const active = isSearchActive(criteria)
    const trimmed = criteria.q.trim()

    const { data, isLoading, error, mutate } = useSWR<Array<CommunityPost>>(
        active
            ? [
                "community-search",
                trimmed,
                criteria.sort,
                criteria.postType ?? "",
                criteria.authorId ?? "",
                criteria.groupId ?? "",
            ]
            : null,
        async () => {
            const result = await queryCommunitySearch({
                q: trimmed || null,
                sort: criteria.sort,
                postType: criteria.postType || null,
                authorId: criteria.authorId || null,
                groupId: criteria.groupId || null,
                page: { limit: PAGE_LIMIT },
            })
            const connection = result.data?.communitySearch
            return (connection?.items ?? []).map((item) => toCommunityPost(item, locale))
        },
    )

    return { posts: data ?? [], isLoading, error, mutate, active }
}

export { CommunitySearchSort }
