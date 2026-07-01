import { useLocale } from "next-intl"
import { usePathname } from "next/navigation"
import useSWR from "swr"
import { GraphQLHeadersKey } from "@/modules/api/graphql/types"
import { queryFoundationCategories } from "@/modules/api/graphql/queries/query-foundation-categories"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { setFoundationCategories, setFoundationCategory } from "@/redux/slices/foundation"

/** Params for {@link useQueryFoundationCategoriesSwr}. */
export interface UseQueryFoundationCategoriesParams {
    /** Server-side search string (already debounced by the caller). */
    search?: string
    /** 1-based page number; defaults to 1. */
    page?: number
    /**
     * Items per page. The grid passes its page size; callers that only need the
     * categories hydrated (e.g. resolving the active category on a hard refresh)
     * omit it and get a large page so resolution still works.
     */
    limit?: number
}

/** Page size used when a caller does not request pagination explicitly. */
const RESOLUTION_LIMIT = 100

/**
 * Lists foundation categories via the paginated, searchable `foundationCategories`
 * query. Server-side search + pagination (no client filtering); the SWR key
 * includes the search + page so each page/query is cached independently.
 *
 * Returns the SWR result whose `data` is the `{ totalCount, data }` payload.
 */
export const useQueryFoundationCategoriesSwr = (
    params?: UseQueryFoundationCategoriesParams,
) => {
    const locale = useLocale()
    const pathname = usePathname()
    const onFoundationsPage = pathname.includes("/foundations")
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const enrolled = useAppSelector((state) => state.user.enrolled)
    const categoryId = useAppSelector((state) => state.foundation.categoryId)
    const dispatch = useAppDispatch()

    // resolved request values; default to page 1 + a large page for plain resolution callers
    const page = params?.page ?? 1
    const limit = params?.limit ?? RESOLUTION_LIMIT
    const search = params?.search?.trim() ?? ""

    return useSWR(
        authenticated && enrolled && onFoundationsPage
            ? [
                "QUERY_FOUNDATION_CATEGORIES_SWR",
                locale,
                search,
                page,
                limit,
            ]
            : null,
        async () => {
            const response = await queryFoundationCategories({
                request: {
                    pageNumber: page,
                    limit,
                    search: search.length > 0 ? search : undefined,
                },
                headers: {
                    [GraphQLHeadersKey.XLocale]: locale,
                },
            })

            const wrapped = response.data?.foundationCategories
            if (!wrapped) {
                throw new Error("Foundation categories not found")
            }
            if (!wrapped.success) {
                throw new Error(wrapped.error || wrapped.message || "Foundation categories not found")
            }

            // payload is { totalCount, data }; hydrate redux for category resolution + compat
            const payload = wrapped.data ?? {
                totalCount: 0,
                data: [],
            }
            dispatch(setFoundationCategories(payload.data))

            if (categoryId) {
                const selected = payload.data.find((item) => item.id === categoryId)
                // only overwrite when resolved — avoid wiping the entity set on click/navigate
                if (selected) {
                    dispatch(setFoundationCategory(selected))
                }
            }

            return payload
        },
        {
            // keep the current page visible while the next page/search loads (no skeleton flash)
            keepPreviousData: true,
        },
    )
}
