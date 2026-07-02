import type { GraphQLResponse } from "../../types"

/** Request for the `consultantSuggestions` autocomplete query. */
export interface QueryConsultantSuggestionsRequest {
    /** Typed prefix to autocomplete (e.g. "ng" → "Le Minh Quan"). */
    query: string
    /** Max suggestions to return (default 8). */
    limit?: number
}

/** One autocomplete suggestion (a consultant). */
export interface ConsultantSuggestionItem {
    /** Consultant id (used to select / deep-link on the client). */
    id: string
    /** Clean display label (the consultant full name). */
    label: string
}

/** Payload returned by the `consultantSuggestions` query. */
export interface ConsultantSuggestionsPayload {
    /** Matching suggestions, best match first. */
    data: Array<ConsultantSuggestionItem>
}

/** Apollo response shape for the `consultantSuggestions` query. */
export interface QueryConsultantSuggestionsResponse {
    /** Top-level field wrapping the suggestions payload. */
    consultantSuggestions: GraphQLResponse<ConsultantSuggestionsPayload>
}
