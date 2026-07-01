import type { GraphQLResponse } from "../../types"

/** Variables for the `myLearningFeedbacks(limit, offset)` query. */
export interface QueryMyLearningFeedbacksRequest {
    /** Page size (defaults to 20 server-side). */
    limit?: number
    /** Row offset for pagination (defaults to 0 server-side). */
    offset?: number
}

/** One piece of learning feedback the viewer received. */
export interface QueryMyLearningFeedbackItemData {
    /** Feedback id. */
    id: string
    /** Source of the feedback: "challenge" | "task" | "cv". */
    source: string
    /** Feedback title (challenge / task / cv subject). */
    title: string
    /** Title of the related course, or null. */
    courseTitle: string | null
    /** Short feedback summary. */
    summary: string
    /** Created time (ISO). */
    createdAt: string
}

/** Inner payload: a page of learning feedbacks plus the total count. */
export interface QueryMyLearningFeedbacksPayload {
    /** The page of feedback rows. */
    items: Array<QueryMyLearningFeedbackItemData>
    /** Total number of feedbacks across all pages. */
    total: number
}

/** Apollo response shape for the `myLearningFeedbacks` query. */
export interface QueryMyLearningFeedbacksResponse {
    /** Top-level `myLearningFeedbacks` field wrapping the standard API response. */
    myLearningFeedbacks: GraphQLResponse<QueryMyLearningFeedbacksPayload>
}
