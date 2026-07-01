import type { GraphQLResponse } from "../../types"

/** Request for the `milestoneTaskSuggestions` autocomplete query. */
export interface QueryMilestoneTaskSuggestionsRequest {
    /** Typed prefix to autocomplete (e.g. "pay" → "Payment Integration"). */
    query: string
    /** Max suggestions to return (default 8). */
    limit?: number
}

/** One autocomplete suggestion (a milestone task). */
export interface MilestoneTaskSuggestionItem {
    /** Milestone task id (used to select / deep-link on the client). */
    id: string
    /** Clean display label (the milestone task title). */
    label: string
}

/** Payload returned by the `milestoneTaskSuggestions` query. */
export interface MilestoneTaskSuggestionsPayload {
    /** Matching suggestions, best match first. */
    data: Array<MilestoneTaskSuggestionItem>
}

/** Apollo response shape for the `milestoneTaskSuggestions` query. */
export interface QueryMilestoneTaskSuggestionsResponse {
    /** Top-level field wrapping the suggestions payload. */
    milestoneTaskSuggestions: GraphQLResponse<MilestoneTaskSuggestionsPayload>
}
