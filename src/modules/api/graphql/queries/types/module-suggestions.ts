import type { GraphQLResponse } from "../../types"

/** Request for the `moduleSuggestions` autocomplete query. */
export interface QueryModuleSuggestionsRequest {
    /** Typed prefix to autocomplete (e.g. "doc" → "Docker Fundamentals"). */
    query: string
    /** Max suggestions to return (default 8). */
    limit?: number
}

/** One autocomplete suggestion (a module). */
export interface ModuleSuggestionItem {
    /** Module id (used to select / deep-link on the client). */
    id: string
    /** Clean display label (the module title). */
    label: string
}

/** Payload returned by the `moduleSuggestions` query. */
export interface ModuleSuggestionsPayload {
    /** Matching suggestions, best match first. */
    data: Array<ModuleSuggestionItem>
}

/** Apollo response shape for the `moduleSuggestions` query. */
export interface QueryModuleSuggestionsResponse {
    /** Top-level field wrapping the suggestions payload. */
    moduleSuggestions: GraphQLResponse<ModuleSuggestionsPayload>
}
