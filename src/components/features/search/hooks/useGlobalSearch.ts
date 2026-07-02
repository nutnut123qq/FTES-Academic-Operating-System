"use client"

import { useMemo } from "react"
import { useLocale } from "next-intl"
import { useAppSelector } from "@/redux/hooks"
import {
    useAutocompleteGlobalSearchSwr,
    SEARCH_MIN_CHARS,
} from "@/hooks/swr/api/graphql/queries/useAutocompleteGlobalSearchSwr"
import { useDebouncedValue } from "@/hooks/reuseables/useDebouncedValue"
import type { SearchEntityKind, SearchRow } from "../types"
import { mapEntityRows } from "../utils/map-entity-rows"
import { SEARCH_ENTITY_KINDS } from "../utils/build-search-href"

/** One non-empty group of real entity rows, in canonical order. */
export interface SearchRowGroup {
    /** The entity kind. */
    kind: SearchEntityKind
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
 * Shared real-entity search state for both the overlay and `/search`. Reads the
 * Redux query, debounces + gates via {@link useAutocompleteGlobalSearchSwr}, and
 * maps the payload into grouped + flattened {@link SearchRow}s (with resolved deep
 * links). `enabled` should be `true` on the `/search` page (the overlay relies on
 * its own open state).
 * @param enabled - extra gate ORed with the overlay-open state inside the SWR hook.
 * @param size - results per group (overlay 8, page 24).
 * @returns grouped rows, flat rows, and async state.
 */
export const useGlobalSearch = (enabled: boolean, size?: number): UseGlobalSearchResult => {
    const locale = useLocale()
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const rawQuery = useAppSelector((state) => state.search.query)
    const query = useDebouncedValue(rawQuery, 300).trim()
    const hasMinChars = query.length >= SEARCH_MIN_CHARS

    const swr = useAutocompleteGlobalSearchSwr({ enabled, size })

    const grouped = useMemo(() => mapEntityRows(swr.data, locale), [swr.data, locale])

    const groups = useMemo(
        () =>
            SEARCH_ENTITY_KINDS.map((kind) => ({ kind, rows: grouped[kind] })).filter(
                (group) => group.rows.length > 0,
            ),
        [grouped],
    )

    const flatRows = useMemo(
        () => groups.flatMap((group) => group.rows).filter((row) => Boolean(row.href)),
        [groups],
    )

    const isLoading = Boolean(hasMinChars && authenticated && enabled) && !swr.data && !swr.error

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
