import type { GraphQLResponse } from "../../types"

/** Request for the `contentSuggestions` autocomplete query. */
export interface QueryContentSuggestionsRequest {
    /** Typed prefix to autocomplete (e.g. "req" → "Request Lifecycle"). */
    query: string
    /** Max suggestions to return (default 8). */
    limit?: number
}

/** One autocomplete suggestion (a content / lesson). */
export interface ContentSuggestionItem {
    /** Content id (used to select / deep-link on the client). */
    id: string
    /** Clean display label (the lesson title). */
    label: string
}

/** Payload returned by the `contentSuggestions` query. */
export interface ContentSuggestionsPayload {
    /** Matching suggestions, best match first. */
    data: Array<ContentSuggestionItem>
}

/** Apollo response shape for the `contentSuggestions` query. */
export interface QueryContentSuggestionsResponse {
    /** Top-level field wrapping the suggestions payload. */
    contentSuggestions: GraphQLResponse<ContentSuggestionsPayload>
}
