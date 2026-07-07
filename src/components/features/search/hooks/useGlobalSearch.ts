"use client"

import { useMemo } from "react"
import useSWR from "swr"
import { useLocale } from "next-intl"
import { useAppSelector } from "@/redux/hooks"
import { useSearchOverlayState } from "@/hooks/zustand/overlay/hooks"
import { useDebouncedValue } from "@/hooks/reuseables/useDebouncedValue"
import { querySearch } from "@/modules/api/graphql/queries/query-search"
import type { SearchCategoryKind, SearchRow } from "../types"
import { mapSearchGroups, SEARCH_RESULT_KINDS } from "../utils/map-search-result"

/** Minimum trimmed characters before a fetch is issued (shared with the /search page + overlay). */
export const SEARCH_MIN_CHARS = 2

/** Overlay quick-jump size; the `/search` page overrides with a larger page. */
const DEFAULT_SIZE = 8

/** One non-empty group of real entity rows, in canonical order. */
export interface SearchRowGroup {
    /** The entity kind. */
    kind: SearchCategoryKind
    /** Its rows. */
    rows: Array<SearchRow>
}

/** Return shape of {@link useGlobalSearch}. */
export interface UseGlobalSearchResult {
    /** The trimmed, debounced query actually used for fetching. */
    query: string
    /** True once the trimmed query meets the minimum length. */
    hasMinChars: boolean
    /** Whether the user is authenticated (real fetch requires it). */
    authenticated: boolean
    /** Non-empty real entity groups (canonical order). */
    groups: Array<SearchRowGroup>
    /** All routable rows flattened (canonical order) for keyboard navigation. */
    flatRows: Array<SearchRow>
    /** First-load spinner state (no data yet, no error). */
    isLoading: boolean
    /** Whether any data is present. */
    hasResults: boolean
    /** SWR error (only when no cached data). */
    error: unknown
    /** Retry the real fetch. */
    retry: () => void
}

/**
 * Shared real-entity search state for both the overlay and `/search`. Reads the Redux
 * query, debounces + gates on auth/overlay-open/min-chars, then runs the real BE
 * `search(q, types, page)` query and maps its buckets into grouped + flattened
 * {@link SearchRow}s (with resolved deep links). SWR dedupes the overlay and the page by
 * key. `enabled` is ORed with the overlay-open state so the page always fetches.
 * @param enabled - extra gate ORed with the overlay-open state (pass `true` on `/search`).
 * @param size - results per bucket (overlay 8, page 24).
 * @returns grouped rows, flat rows, and async state.
 */
export const useGlobalSearch = (enabled: boolean, size: number = DEFAULT_SIZE): UseGlobalSearchResult => {
    const locale = useLocale()
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const { isOpen } = useSearchOverlayState()
    const rawQuery = useAppSelector((state) => state.search.query)
    const query = useDebouncedValue(rawQuery, 300).trim()
    const hasMinChars = query.length >= SEARCH_MIN_CHARS

    // The BE `search` requires auth; the overlay only fetches while open, the page always.
    const canFetch = authenticated && (isOpen || enabled) && hasMinChars

    const swr = useSWR(
        canFetch ? ["QUERY_GLOBAL_SEARCH_SWR", query, size, authenticated] : null,
        async () => {
            const response = await querySearch({ q: query, page: { page: 0, size } })
            return response.data?.search?.groups ?? []
        },
        { keepPreviousData: true },
    )

    const grouped = useMemo(() => mapSearchGroups(swr.data, locale), [swr.data, locale])

    const groups = useMemo(
        () =>
            SEARCH_RESULT_KINDS.map((kind) => ({ kind, rows: grouped[kind] })).filter(
                (group) => group.rows.length > 0,
            ),
        [grouped],
    )

    const flatRows = useMemo(
        () => groups.flatMap((group) => group.rows).filter((row) => Boolean(row.href)),
        [groups],
    )

    const isLoading = canFetch && !swr.data && !swr.error

    return {
        query,
        hasMinChars,
        authenticated,
        groups,
        flatRows,
        isLoading,
        hasResults: groups.length > 0,
        error: !swr.data ? swr.error : undefined,
        retry: () => {
            void swr.mutate()
        },
    }
}
