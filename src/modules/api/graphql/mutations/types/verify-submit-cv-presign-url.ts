import type { GraphQLResponse, QueryVariables } from "../../types"

/** Payload inside `verifySubmitCvPresignUrl.data` after the standard API wrapper. */
export interface VerifySubmitCvPresignUrlData {
    /** `true` if the file was successfully uploaded to S3. */
    uploaded: boolean
}

/** GraphQL `VerifySubmitCvPresignUrlRequest` body. */
export interface VerifySubmitCvPresignUrlRequest {
    /** CV submission row ID whose upload status to verify. */
    cvSubmissionId: string
}

/** Apollo variables bag for the `verifySubmitCvPresignUrl` mutation. */
export type MutateVerifySubmitCvPresignUrlVariables = QueryVariables<VerifySubmitCvPresignUrlRequest>

/** Apollo response shape for `verifySubmitCvPresignUrl`. */
export interface MutateVerifySubmitCvPresignUrlResponse {
    /** Top-level `verifySubmitCvPresignUrl` field wrapping the standard API response. */
    verifySubmitCvPresignUrl: GraphQLResponse<VerifySubmitCvPresignUrlData>
}
