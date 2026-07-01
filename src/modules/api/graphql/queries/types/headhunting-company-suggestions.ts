import type { GraphQLResponse } from "../../types"

/** Request for the `headhuntingCompanySuggestions` autocomplete query. */
export interface QueryHeadhuntingCompanySuggestionsRequest {
    /** Typed prefix to autocomplete (e.g. "sta" → "StarCi"). */
    query: string
    /** Max suggestions to return (default 8). */
    limit?: number
}

/** One autocomplete suggestion (a headhunting company). */
export interface HeadhuntingCompanySuggestionItem {
    /** Company id (used to select / deep-link on the client). */
    id: string
    /** Clean display label (the company title / display name). */
    label: string
}

/** Payload returned by the `headhuntingCompanySuggestions` query. */
export interface HeadhuntingCompanySuggestionsPayload {
    /** Matching suggestions, best match first. */
    data: Array<HeadhuntingCompanySuggestionItem>
}

/** Apollo response shape for the `headhuntingCompanySuggestions` query. */
export interface QueryHeadhuntingCompanySuggestionsResponse {
    /** Top-level field wrapping the suggestions payload. */
    headhuntingCompanySuggestions: GraphQLResponse<HeadhuntingCompanySuggestionsPayload>
}
