import { useLocale } from "next-intl"
import useSWR, { type SWRConfiguration, type SWRResponse } from "swr"

/** Default number of suggestions requested for an autocomplete dropdown. */
const DEFAULT_SUGGESTIONS_LIMIT = 8

/** One generic autocomplete suggestion ({ id, label }), shared across entities. */
export interface EntitySuggestionItem {
    /** Stable entity id (used as the list key + select payload). */
    id: string
    /** Human-readable label shown in the dropdown row. */
    label: string
}

/** Params the factory hands to a per-entity suggestion fetcher. */
export interface EntitySuggestionsFetchParams {
    /** The normalized (trimmed) prefix to autocomplete. */
    query: string
    /** Active locale, so the fetcher can target the per-locale index. */
    locale: string
    /** Max suggestions to request. */
    limit: number
}

/**
 * Per-entity suggestion fetcher: runs the entity's `*Suggestions` GraphQL query
 * and resolves to clean `{ id, label }` items (already unwrapped from the
 * response envelope). Implemented once per entity hook.
 */
export type EntitySuggestionsQueryFn = (
    params: EntitySuggestionsFetchParams,
) => Promise<Array<EntitySuggestionItem>>

/** Options for {@link useEntitySuggestionsSwr}. */
export interface UseEntitySuggestionsSwrOptions {
    /**
     * Extra gate on top of the non-empty-query check — the SWR key stays `null`
     * (no fetch) unless this is `true`. Use it to scope fetching to the relevant
     * page / auth / enrollment state. Defaults to `true`.
     */
    enabled?: boolean
    /** Max suggestions to request; defaults to 8. */
    limit?: number
    /**
     * Stable cache-key prefix that namespaces this entity's suggestions in the
     * SWR cache (e.g. `"QUERY_FOUNDATION_CATEGORY_SUGGESTIONS_SWR"`).
     */
    swrKey: string
    /** Extra SWR config merged over the defaults (e.g. `dedupingInterval`). */
    swrConfig?: SWRConfiguration<Array<EntitySuggestionItem>>
}

/**
 * Generic autocomplete (typeahead) SWR hook factory.
 *
 * Owns the cross-cutting concerns every entity suggestions hook shares:
 * - the SWR key includes the active locale + the normalized query,
 * - it only fires when the (trimmed) query is non-empty AND `opts.enabled`,
 * - `keepPreviousData` keeps the dropdown stable while the next prefix loads.
 *
 * Each entity hook just supplies a `queryFn` that runs its own GraphQL query and
 * returns `{ id, label }[]`, then delegates here.
 *
 * @param queryFn - Per-entity fetcher returning clean `{ id, label }` items.
 * @param query - The (already debounced) typed prefix.
 * @param opts - {@link UseEntitySuggestionsSwrOptions} (gate, limit, cache key).
 * @returns The SWR response of `{ id, label }` suggestions.
 */
export const useEntitySuggestionsSwr = (
    queryFn: EntitySuggestionsQueryFn,
    query: string,
    opts: UseEntitySuggestionsSwrOptions,
): SWRResponse<Array<EntitySuggestionItem>> => {
    const locale = useLocale()
    // normalize once so the key + the request use the exact same prefix
    const normalized = query.trim()
    // caller gate (page/auth/enrollment); default on when omitted
    const enabled = opts.enabled ?? true
    // clamp the request size to the caller's limit or the shared default
    const limit = opts.limit ?? DEFAULT_SUGGESTIONS_LIMIT
    const {
        swrKey,
        swrConfig,
    } = opts

    return useSWR(
        // only fetch while enabled and the user is actually typing something
        enabled && normalized.length > 0
            ? [
                swrKey,
                locale,
                normalized,
            ]
            : null,
        // delegate the real fetch to the per-entity query fn
        async () => queryFn({
            query: normalized,
            locale,
            limit,
        }),
        {
            // keep the previous suggestions visible while the next prefix loads
            keepPreviousData: true,
            // let callers override / extend (dedupingInterval, revalidate flags, …)
            ...swrConfig,
        },
    )
}
