import { usePathname } from "next/navigation"
import {
    useEntitySuggestionsSwr,
    type EntitySuggestionsFetchParams,
    type EntitySuggestionItem,
} from "./useEntitySuggestionsSwr"
import { GraphQLHeadersKey } from "@/modules/api/graphql/types"
import { queryFoundationCategorySuggestions } from "@/modules/api/graphql/queries/query-foundation-category-suggestions"
import { useAppSelector } from "@/redux/hooks"

/** Max suggestions requested for the foundation autocomplete dropdown. */
const SUGGESTIONS_LIMIT = 8
/** Cache-key prefix namespacing foundation category suggestions in the SWR cache. */
const SWR_KEY = "QUERY_FOUNDATION_CATEGORY_SUGGESTIONS_SWR"

/**
 * Run the `foundationCategorySuggestions` GraphQL query for a prefix and return
 * clean `{ id, label }` items (unwrapped from the response envelope).
 *
 * @param params - Normalized query + locale + limit from the generic factory.
 */
const fetchFoundationCategorySuggestions = async ({
    query,
    locale,
    limit,
}: EntitySuggestionsFetchParams): Promise<Array<EntitySuggestionItem>> => {
    // call the ES Completion Suggester backed query for this locale's index
    const response = await queryFoundationCategorySuggestions({
        request: {
            query,
            limit,
        },
        headers: {
            [GraphQLHeadersKey.XLocale]: locale,
        },
    })

    // unwrap the standard success/message/error envelope
    const wrapped = response.data?.foundationCategorySuggestions
    if (!wrapped || !wrapped.success) {
        throw new Error(wrapped?.error || wrapped?.message || "Foundation suggestions not found")
    }

    // the payload is already clean { id, label } items — no client-side munging
    return wrapped.data?.data ?? []
}

/**
 * Foundation category autocomplete: fetches typeahead suggestions for a (already
 * debounced) prefix via the ES Completion Suggester backed `foundationCategorySuggestions`
 * query. Returns clean `{ id, label }` items ready to render. Only fires on the
 * foundations page (when authenticated + enrolled) with a non-empty query;
 * delegates the SWR plumbing to {@link useEntitySuggestionsSwr}.
 *
 * @param query - The (debounced) typed prefix.
 */
export const useQueryFoundationCategorySuggestionsSwr = (query: string) => {
    const pathname = usePathname()
    // foundation suggestions are only relevant on the foundations hub page
    const onFoundationsPage = pathname.includes("/foundations")
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const enrolled = useAppSelector((state) => state.user.enrolled)

    // delegate locale-aware SWR key, query gating + keepPreviousData to the factory
    return useEntitySuggestionsSwr(
        fetchFoundationCategorySuggestions,
        query,
        {
            // only fetch while signed-in, enrolled, and on the foundations page
            enabled: authenticated && enrolled && onFoundationsPage,
            limit: SUGGESTIONS_LIMIT,
            swrKey: SWR_KEY,
        },
    )
}
