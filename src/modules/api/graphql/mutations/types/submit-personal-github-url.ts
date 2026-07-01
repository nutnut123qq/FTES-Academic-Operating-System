import type { GraphQLResponse, QueryVariables } from "../../types"

/** GraphQL `SubmitPersonalGithubUrlRequest` body. */
export interface SubmitPersonalGithubUrlRequest {
    /** Course ID the enrollment belongs to. */
    courseId: string
    /** GitHub repository URL to persist on the enrollment. */
    githubUrl: string
}

/** Minimal payload needed on FE after successful GitHub URL submission. */
export interface SubmitPersonalGithubUrlData {
    /** Enrollment row ID. */
    id: string
    /** Persisted GitHub URL (may be `null` if cleared). */
    personalProjectGithubUrl: string | null
}

/** Apollo variables bag for the `submitPersonalGithubUrl` mutation. */
export type MutateSubmitPersonalGithubUrlVariables =
    QueryVariables<SubmitPersonalGithubUrlRequest>

/** Apollo response shape for `submitPersonalGithubUrl`. */
export interface MutateSubmitPersonalGithubUrlResponse {
    /** Top-level `submitPersonalGithubUrl` field wrapping the standard API response. */
    submitPersonalGithubUrl: GraphQLResponse<SubmitPersonalGithubUrlData>
}
