import {
    useEntitySuggestionsSwr,
    type EntitySuggestionsFetchParams,
    type EntitySuggestionItem,
} from "./useEntitySuggestionsSwr"
import type { SWRConfiguration } from "swr"
import { GraphQLHeadersKey } from "@/modules/api/graphql/types"
import { queryHeadhuntingCompanySuggestions } from "@/modules/api/graphql/queries/query-headhunting-company-suggestions"

/** Cache-key prefix namespacing headhunting company suggestions in the SWR cache. */
const SWR_KEY = "QUERY_HEADHUNTING_COMPANY_SUGGESTIONS_SWR"

/** Options forwarded to the generic suggestions factory by this hook. */
export interface UseQueryHeadhuntingCompanySuggestionsSwrOptions {
    /** Gate on top of the non-empty-query check; defaults to `true`. */
    enabled?: boolean
    /** Max suggestions to request; defaults to 8. */
    limit?: number
    /** Extra SWR config merged over the defaults. */
    swrConfig?: SWRConfiguration<Array<EntitySuggestionItem>>
}

/**
 * Run the `headhuntingCompanySuggestions` GraphQL query for a prefix and return
 * clean `{ id, label }` items (unwrapped from the response envelope).
 *
 * @param params - Normalized query + locale + limit from the generic factory.
 */
const fetchHeadhuntingCompanySuggestions = async ({
    query,
    locale,
    limit,
}: EntitySuggestionsFetchParams): Promise<Array<EntitySuggestionItem>> => {
    // call the ES Completion Suggester backed query for this locale's index
    const response = await queryHeadhuntingCompanySuggestions({
        request: {
            query,
            limit,
        },
        headers: {
            [GraphQLHeadersKey.XLocale]: locale,
        },
    })

    // unwrap the standard success/message/error envelope
    const wrapped = response.data?.headhuntingCompanySuggestions
    if (!wrapped || !wrapped.success) {
        throw new Error(
            wrapped?.error || wrapped?.message || "Headhunting company suggestions not found",
        )
    }

    // the payload is already clean { id, label } items — no client-side munging
    return wrapped.data?.data ?? []
}

/**
 * Headhunting company autocomplete: fetches typeahead suggestions for a (debounced)
 * prefix via the ES Completion Suggester backed `headhuntingCompanySuggestions`
 * query. Returns clean `{ id, label }` items ready to render; delegates SWR
 * plumbing (locale-aware key, query gating, keepPreviousData) to
 * {@link useEntitySuggestionsSwr}.
 *
 * @param query - The (debounced) typed prefix.
 * @param options - Optional gate / limit / SWR overrides.
 */
export const useQueryHeadhuntingCompanySuggestionsSwr = (
    query: string,
    options?: UseQueryHeadhuntingCompanySuggestionsSwrOptions,
) => {
    // forward the caller's gate/limit/config to the shared factory
    return useEntitySuggestionsSwr(
        fetchHeadhuntingCompanySuggestions,
        query,
        {
            enabled: options?.enabled,
            limit: options?.limit,
            swrKey: SWR_KEY,
            swrConfig: options?.swrConfig,
        },
    )
}
