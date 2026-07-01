import {
    useEntitySuggestionsSwr,
    type EntitySuggestionsFetchParams,
    type EntitySuggestionItem,
} from "./useEntitySuggestionsSwr"
import type { SWRConfiguration } from "swr"
import { GraphQLHeadersKey } from "@/modules/api/graphql/types"
import { queryModuleSuggestions } from "@/modules/api/graphql/queries/query-module-suggestions"

/** Cache-key prefix namespacing module suggestions in the SWR cache. */
const SWR_KEY = "QUERY_MODULE_SUGGESTIONS_SWR"

/** Options forwarded to the generic suggestions factory by this hook. */
export interface UseQueryModuleSuggestionsSwrOptions {
    /** Gate on top of the non-empty-query check; defaults to `true`. */
    enabled?: boolean
    /** Max suggestions to request; defaults to 8. */
    limit?: number
    /** Extra SWR config merged over the defaults. */
    swrConfig?: SWRConfiguration<Array<EntitySuggestionItem>>
}

/**
 * Run the `moduleSuggestions` GraphQL query for a prefix and return clean
 * `{ id, label }` items (unwrapped from the response envelope).
 *
 * @param params - Normalized query + locale + limit from the generic factory.
 */
const fetchModuleSuggestions = async ({
    query,
    locale,
    limit,
}: EntitySuggestionsFetchParams): Promise<Array<EntitySuggestionItem>> => {
    // call the ES Completion Suggester backed query for this locale's index
    const response = await queryModuleSuggestions({
        request: {
            query,
            limit,
        },
        headers: {
            [GraphQLHeadersKey.XLocale]: locale,
        },
    })

    // unwrap the standard success/message/error envelope
    const wrapped = response.data?.moduleSuggestions
    if (!wrapped || !wrapped.success) {
        throw new Error(wrapped?.error || wrapped?.message || "Module suggestions not found")
    }

    // the payload is already clean { id, label } items — no client-side munging
    return wrapped.data?.data ?? []
}

/**
 * Module autocomplete: fetches typeahead suggestions for a (debounced) prefix via
 * the ES Completion Suggester backed `moduleSuggestions` query. Returns clean
 * `{ id, label }` items ready to render; delegates SWR plumbing (locale-aware key,
 * query gating, keepPreviousData) to {@link useEntitySuggestionsSwr}.
 *
 * @param query - The (debounced) typed prefix.
 * @param options - Optional gate / limit / SWR overrides.
 */
export const useQueryModuleSuggestionsSwr = (
    query: string,
    options?: UseQueryModuleSuggestionsSwrOptions,
) => {
    // forward the caller's gate/limit/config to the shared factory
    return useEntitySuggestionsSwr(
        fetchModuleSuggestions,
        query,
        {
            enabled: options?.enabled,
            limit: options?.limit,
            swrKey: SWR_KEY,
            swrConfig: options?.swrConfig,
        },
    )
}
