import useSWRInfinite from "swr/infinite"
import { queryMyFeed } from "@/modules/api/graphql/queries/query-my-feed"
import { MyFeedTab, MyFeedCategory } from "@/modules/api/graphql/queries/types/my-feed"
import type { QueryMyFeedResponseData } from "@/modules/api/graphql/queries/types/my-feed"
import { useAppSelector } from "@/redux/hooks"

/** Items per feed page. */
const PAGE_LIMIT = 5

/**
 * Cursor-paginated SWR hook for the home feed (infinite scroll). Each page keys
 * off the previous page's `nextCursor`; returns `null` key to stop when the feed
 * is exhausted or the viewer is unauthenticated. Re-keys on `tab` + `category` so
 * switching feed or filter chip refetches from page 1.
 *
 * @param tab - which feed (forYou | following)
 * @param category - filter chip (defaults to All)
 * @returns the SWRInfinite handle (data = array of pages, size, setSize, ...)
 */
export const useQueryMyFeedSwr = (
    tab: MyFeedTab,
    category: MyFeedCategory = MyFeedCategory.All,
) => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)

    const getKey = (
        index: number,
        previous: QueryMyFeedResponseData | null,
    ): readonly [string, MyFeedTab, MyFeedCategory, string] | null => {
        // don't fetch when signed out
        if (!authenticated) {
            return null
        }
        // previous page had no next cursor → end of feed, stop
        if (previous && previous.nextCursor === null) {
            return null
        }
        // page 1 has no cursor; later pages use the previous page's nextCursor
        const cursor = index === 0 ? "" : previous?.nextCursor ?? ""
        return ["QUERY_MY_FEED_SWR", tab, category, cursor]
    }

    return useSWRInfinite(
        getKey,
        async ([, currentTab, currentCategory, cursor]) => {
            const data = await queryMyFeed({
                request: {
                    tab: currentTab,
                    category: currentCategory,
                    cursor: cursor || undefined,
                    limit: PAGE_LIMIT,
                },
            })
            if (!data || !data.data) {
                throw new Error("Failed to fetch feed")
            }
            return data.data.myFeed?.data ?? { items: [], nextCursor: null }
        },
    )
}
