import type { GraphQLResponse } from "../../types"

/** Payload of the `cvUrl` GraphQL query (`CvUrlViewData` on the server). */
export interface CvUrlViewData {
    /** Primary identifier — `cv_submissions.id`. */
    id: string
    /** Aggregate submission status. */
    status: string
    /** Presigned GET or absolute URL to open the CV PDF; null when no file. */
    cvUrl: string
    /** TTL in seconds for the presigned `cvUrl` (e.g. 900 for 15 min); 0 if not presigned. */
    cvUrlExpiresInSeconds: number
    /** Full AI review (markdown) on the latest attempt after analyze; null until ready. */
    detailFeedback?: string | null
    /** Holistic score 0–100 when stored on the latest attempt; null until scored. */
    score?: number | null
    /** ISO timestamp: latest attempt `created_at`, else submission `created_at` (server UTC). */
    submittedAt?: string | null
}

/** Apollo response shape for the `cvUrl` query. */
export interface QueryCvUrlResponse {
    /** Top-level `cvUrl` field wrapping the standard API response; data is null when no CV is found. */
    cvUrl: GraphQLResponse<CvUrlViewData | null>
}
