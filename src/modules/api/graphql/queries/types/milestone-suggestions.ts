import type { GraphQLResponse } from "../../types"

/** Request for the `milestoneSuggestions` autocomplete query. */
export interface QueryMilestoneSuggestionsRequest {
    /** Typed prefix to autocomplete (e.g. "cat" → "Catalog Service"). */
    query: string
    /** Max suggestions to return (default 8). */
    limit?: number
}

/** One autocomplete suggestion (a milestone). */
export interface MilestoneSuggestionItem {
    /** Milestone id (used to select / deep-link on the client). */
    id: string
    /** Clean display label (the milestone title). */
    label: string
}

/** Payload returned by the `milestoneSuggestions` query. */
export interface MilestoneSuggestionsPayload {
    /** Matching suggestions, best match first. */
    data: Array<MilestoneSuggestionItem>
}

/** Apollo response shape for the `milestoneSuggestions` query. */
export interface QueryMilestoneSuggestionsResponse {
    /** Top-level field wrapping the suggestions payload. */
    milestoneSuggestions: GraphQLResponse<MilestoneSuggestionsPayload>
}
