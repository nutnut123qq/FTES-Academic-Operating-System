import type { GraphQLResponse } from "../../types"

/** Request for the `challengeSuggestions` autocomplete query. */
export interface QueryChallengeSuggestionsRequest {
    /** Typed prefix to autocomplete (e.g. "rate" → "Rate Limiter"). */
    query: string
    /** Max suggestions to return (default 8). */
    limit?: number
}

/** One autocomplete suggestion (a challenge). */
export interface ChallengeSuggestionItem {
    /** Challenge id (used to select / deep-link on the client). */
    id: string
    /** Clean display label (the challenge title). */
    label: string
}

/** Payload returned by the `challengeSuggestions` query. */
export interface ChallengeSuggestionsPayload {
    /** Matching suggestions, best match first. */
    data: Array<ChallengeSuggestionItem>
}

/** Apollo response shape for the `challengeSuggestions` query. */
export interface QueryChallengeSuggestionsResponse {
    /** Top-level field wrapping the suggestions payload. */
    challengeSuggestions: GraphQLResponse<ChallengeSuggestionsPayload>
}
