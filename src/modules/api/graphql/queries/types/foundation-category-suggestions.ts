import type { GraphQLResponse } from "../../types"

/** Request for the `foundationCategorySuggestions` autocomplete query. */
export interface QueryFoundationCategorySuggestionsRequest {
    /** Typed prefix to autocomplete (e.g. "do" → "Docker"). */
    query: string
    /** Max suggestions to return (default 8). */
    limit?: number
}

/** One autocomplete suggestion (a foundation category). */
export interface FoundationCategorySuggestionItem {
    /** Category id (used to select / deep-link on the client). */
    id: string
    /** Clean display label (bare tech name, e.g. "Docker"). */
    label: string
}

/** Payload returned by the `foundationCategorySuggestions` query. */
export interface FoundationCategorySuggestionsPayload {
    /** Matching suggestions, best match first. */
    data: Array<FoundationCategorySuggestionItem>
}

/** Apollo response shape for the `foundationCategorySuggestions` query. */
export interface QueryFoundationCategorySuggestionsResponse {
    /** Top-level field wrapping the suggestions payload. */
    foundationCategorySuggestions: GraphQLResponse<FoundationCategorySuggestionsPayload>
}
