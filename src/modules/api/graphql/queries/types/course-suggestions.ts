import type { GraphQLResponse } from "../../types"

/** Request for the `courseSuggestions` autocomplete query. */
export interface QueryCourseSuggestionsRequest {
    /** Typed prefix to autocomplete (e.g. "sys" → "System Design"). */
    query: string
    /** Max suggestions to return (default 8). */
    limit?: number
}

/** One autocomplete suggestion (a course). */
export interface CourseSuggestionItem {
    /** Course id (used to select / deep-link on the client). */
    id: string
    /** Clean display label (the course title). */
    label: string
}

/** Payload returned by the `courseSuggestions` query. */
export interface CourseSuggestionsPayload {
    /** Matching suggestions, best match first. */
    data: Array<CourseSuggestionItem>
}

/** Apollo response shape for the `courseSuggestions` query. */
export interface QueryCourseSuggestionsResponse {
    /** Top-level field wrapping the suggestions payload. */
    courseSuggestions: GraphQLResponse<CourseSuggestionsPayload>
}
