import type { GraphQLResponse } from "../../types"

/** Variables for the `myChallengeSubmissions(limit, offset)` query. */
export interface QueryMyChallengeSubmissionsRequest {
    /** Page size (defaults to 20 server-side). */
    limit?: number
    /** Row offset for pagination (defaults to 0 server-side). */
    offset?: number
}

/** One of the viewer's challenge submissions. */
export interface QueryMyChallengeSubmissionItemData {
    /** Submission id. */
    id: string
    /** Challenge / submission-requirement title. */
    challengeTitle: string
    /** Title of the course the challenge belongs to. */
    courseTitle: string
    /** Opaque global id of the course — pass to resolveRoute on click. */
    courseGlobalId: string
    /** Submission status: "passed" | "failed" | "pending". */
    status: string
    /** Score awarded for the submission. */
    score: number
    /** Language the user chose, or null. */
    selectedLang: string | null
    /** The submitted link (repo / doc URL), or null. */
    submissionUrl: string | null
    /** Submitted time (ISO). */
    submittedAt: string
}

/** Inner payload: a page of challenge submissions plus the total count. */
export interface QueryMyChallengeSubmissionsPayload {
    /** The page of submission rows. */
    items: Array<QueryMyChallengeSubmissionItemData>
    /** Total number of submissions across all pages. */
    total: number
}

/** Apollo response shape for the `myChallengeSubmissions` query. */
export interface QueryMyChallengeSubmissionsResponse {
    /** Top-level `myChallengeSubmissions` field wrapping the standard API response. */
    myChallengeSubmissions: GraphQLResponse<QueryMyChallengeSubmissionsPayload>
}
