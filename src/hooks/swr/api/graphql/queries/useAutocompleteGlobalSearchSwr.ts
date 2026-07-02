import useSWR from "swr"
import { queryAutocompleteGlobalSearch } from "@/modules/api/graphql/queries/query-autocomplete-global-search"
import { type SearchableEntity } from "@/modules/api/graphql/queries/types/autocomplete-global-search"
import { useSearchOverlayState } from "@/hooks/zustand/overlay/hooks"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { setGlobalSearchResults } from "@/redux/slices/socketio"
import { useDebouncedValue } from "@/hooks/reuseables/useDebouncedValue"

const DEFAULT_ENTITIES: Array<SearchableEntity> = [
    "CourseEntity",
    "ModuleEntity",
    "ContentEntity",
    "LessonVideoEntity",
    "ChallengeEntity",
    "MilestoneEntity",
    "MilestoneTaskEntity",
    "FlashcardDeckEntity",
]

/** Overlay quick-jump size (few hits per group). */
const DEFAULT_SIZE = 8

/** Minimum trimmed characters before a fetch is issued (shared with the /search page). */
export const SEARCH_MIN_CHARS = 2

/** Options for {@link useAutocompleteGlobalSearchSwr}. */
export interface UseAutocompleteGlobalSearchOptions {
    /**
     * Extra gate ORed with the overlay-open state. Pass `true` from the `/search`
     * page so the query runs there too; defaults to `false` (side-effect mount only
     * fetches while the overlay is open).
     */
    enabled?: boolean
    /** Results per entity group (overlay uses 8, `/search` uses 24). */
    size?: number
}

/**
 * Queries `autocompleteGlobalSearch` and syncs grouped results into Redux.
 *
 * The query is DEBOUNCED (300 ms) off Redux `search.query`, gated on
 * authentication, on a minimum of {@link SEARCH_MIN_CHARS} trimmed characters,
 * and on `overlayOpen || options.enabled`. Both the command palette overlay and
 * the `/search` page consume this hook; SWR dedupes them by key.
 * @param options - optional `enabled` gate and per-group `size`.
 * @returns the raw SWR handle over {@link import("@/modules/api/graphql/queries/types/autocomplete-global-search").AutocompleteGlobalSearchData}.
 */
export const useAutocompleteGlobalSearchSwr = (
    options: UseAutocompleteGlobalSearchOptions = {},
) => {
    const { enabled = false, size = DEFAULT_SIZE } = options
    const dispatch = useAppDispatch()
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const { isOpen } = useSearchOverlayState()
    const rawQuery = useAppSelector((state) => state.search.query)
    const query = useDebouncedValue(rawQuery, 300).trim()

    const active = authenticated && (isOpen || enabled)
    const canFetch = active && query.length >= SEARCH_MIN_CHARS

    return useSWR(
        canFetch
            ? [
                "QUERY_AUTOCOMPLETE_GLOBAL_SEARCH_SWR",
                query,
                size,
                authenticated,
            ]
            : null,
        async () => {
            const response = await queryAutocompleteGlobalSearch({
                request: {
                    query,
                    entities: DEFAULT_ENTITIES,
                    size,
                },
            })
            const payload = response.data?.autocompleteGlobalSearch?.data
            if (!payload) {
                throw new Error("Autocomplete global search not found")
            }
            dispatch(setGlobalSearchResults({ data: payload }))
            return payload
        },
        {
            keepPreviousData: true,
        },
    )
}
