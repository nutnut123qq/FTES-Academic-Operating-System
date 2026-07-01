import type { GraphQLResponse, QueryVariables } from "../../types"

/** GraphQL `SubmitPersonalProjectIdealRequest` body. */
export interface SubmitPersonalProjectIdealRequest {
    /** Course ID the enrollment belongs to. */
    courseId: string
    /** Free-text project idea submitted by the user. */
    ideaText: string
}

/** Minimal payload needed on FE after successful idea submission. */
export interface SubmitPersonalProjectIdealData {
    /** Enrollment row ID. */
    id: string
}

/** Apollo variables bag for the `submitPersonalProjectIdeal` mutation. */
export type MutateSubmitPersonalProjectIdealVariables =
    QueryVariables<SubmitPersonalProjectIdealRequest>

/** Apollo response shape for `submitPersonalProjectIdeal`. */
export interface MutateSubmitPersonalProjectIdealResponse {
    /** Top-level `submitPersonalProjectIdeal` field wrapping the standard API response. */
    submitPersonalProjectIdeal: GraphQLResponse<SubmitPersonalProjectIdealData>
}
