import useSWR from "swr"
import { querySavedContents } from "@/modules/api/graphql/queries/query-saved-contents"
import { useAppSelector } from "@/redux/hooks"

/** Saved-content rows per page (server-side offset pagination). */
export const SAVED_CONTENTS_PAGE_SIZE = 12

/**
 * Page-based SWR hook for the viewer's saved / favorited contents (the Bookmark
 * page). Fetches one page of `savedContents(skip, take, search)` —
 * `skip = (page - 1) × {@link SAVED_CONTENTS_PAGE_SIZE}` — so the pager and the
 * title `search` are resolved server-side (the returned `count` is the total
 * MATCHING rows, driving both the result count and total pages). User-scoped:
 * keyed `null` (no fetch) until authenticated; keeps previous data so paging /
 * searching doesn't flash a skeleton.
 *
 * @param page - 1-based page index.
 * @param search - Title search term (already trimmed); empty = no filter.
 * @returns the SWR query handle (`data` = one `SavedContentsData` page).
 */
export const useQuerySavedContentsSwr = (page: number, search: string) => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const term = search.trim()

    return useSWR(
        authenticated ? ["QUERY_SAVED_CONTENTS_SWR", page, term] : null,
        async () => {
            const data = await querySavedContents({
                request: {
                    skip: (page - 1) * SAVED_CONTENTS_PAGE_SIZE,
                    take: SAVED_CONTENTS_PAGE_SIZE,
                    search: term || undefined,
                },
            })
            if (!data?.data?.savedContents?.data) {
                throw new Error("Failed to fetch saved contents")
            }
            return data.data.savedContents.data
        },
        { keepPreviousData: true },
    )
}
