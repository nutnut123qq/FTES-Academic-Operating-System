import useSWR from "swr"
import { queryTrendingContents } from "@/modules/api/graphql/queries/query-trending-contents"
import type { QueryTrendingContentItemData } from "@/modules/api/graphql/queries/types/trending-contents"
import { useAppSelector } from "@/redux/hooks"

/**
 * SWR wrapper for {@link queryTrendingContents}. `data` is the lessons read most
 * across the platform this week (most-read first), or `[]`. User-scoped — only
 * runs once authenticated.
 */
export const useQueryTrendingContentsSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    return useSWR<Array<QueryTrendingContentItemData>>(
        authenticated ? ["QUERY_TRENDING_CONTENTS_SWR"] : null,
        async () => {
            // unwrap the standard API envelope; empty list when absent
            const result = await queryTrendingContents({})
            return result.data?.trendingContents?.data ?? []
        },
    )
}
