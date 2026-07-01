import { useLocale } from "next-intl"
import { usePathname } from "next/navigation"
import { useEffect } from "react"
import useSWR from "swr"
import { defaultFoundationsListLimit, defaultFoundationsListSorts, queryFoundations } from "@/modules/api/graphql/queries/query-foundations"
import { GraphQLHeadersKey } from "@/modules/api/graphql/types"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { setFoundations, setFoundationsCount } from "@/redux/slices/foundation"

/**
 * Lists foundations for the selected category via `foundations` and stores rows in Redux.
 * Only fetches on the foundations page (`/foundations`).
 */
export const useQueryFoundationsSwr = () => {
    const locale = useLocale()
    const pathname = usePathname()
    const onFoundationsPage = pathname.includes("/foundations")
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const enrolled = useAppSelector((state) => state.user.enrolled)
    const category = useAppSelector((state) => state.foundation.category)
    const pageNumber = useAppSelector((state) => state.foundation.pageNumber)
    const limit = useAppSelector((state) => state.foundation.limit)
    const search = useAppSelector((state) => state.foundation.search)
    const dispatch = useAppDispatch()

    // normalized search term included in the SWR key so each query caches independently
    const normalizedSearch = search?.trim() ?? ""

    const swr = useSWR(
        authenticated && enrolled && category?.id && onFoundationsPage
            ? [
                "QUERY_FOUNDATIONS_SWR",
                category.id,
                locale,
                enrolled,
                authenticated,
                pageNumber,
                limit,
                normalizedSearch,
            ]
            : null,
        async () => {
            if (!category?.id) {
                throw new Error("Foundation category id not found")
            }

            const response = await queryFoundations({
                request: {
                    categoryId: category.id,
                    filters: {
                        pageNumber: (pageNumber ?? 1) - 1,
                        limit: limit ?? defaultFoundationsListLimit,
                        sorts: defaultFoundationsListSorts,
                        search: normalizedSearch.length > 0 ? normalizedSearch : undefined,
                    },
                },
                headers: {
                    [GraphQLHeadersKey.XLocale]: locale,
                },
            })

            const payload = response.data?.foundations?.data
            if (!payload) {
                throw new Error("Foundations not found")
            }

            dispatch(setFoundations(payload.data))
            dispatch(setFoundationsCount(payload.count))
            return payload
        },
        {
            // keep the current page visible while the next page/search loads (no skeleton flash)
            keepPreviousData: true,
        },
    )

    // cache hits skip the fetcher (so Redux would stay undefined after a stray clear);
    // re-hydrate whenever SWR already has data for the active key
    useEffect(() => {
        if (!swr.data) {
            return
        }
        dispatch(setFoundations(swr.data.data))
        dispatch(setFoundationsCount(swr.data.count))
    }, [swr.data, dispatch])

    return swr
}
