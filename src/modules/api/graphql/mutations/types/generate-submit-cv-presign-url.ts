import type { GraphQLResponse, QueryVariables } from "../../types"

/** Payload inside `generateSubmitCvPresignUrl.data` after the standard API wrapper. */
export interface GenerateSubmitCvPresignUrlData {
    /** Pre-signed S3 upload URL. */
    url: string
    /** CV submission row ID created by the backend. */
    cvSubmissionId: string
}

/** GraphQL `GenerateSubmitCvPresignUrlRequest` body. */
export interface GenerateSubmitCvPresignUrlRequest {
    /** Original file name (used to derive the S3 key). */
    fileName: string
    /** Set when a template is chosen; omit during upload-only flow. */
    templateCvId?: string
}

/** Apollo variables bag for the `generateSubmitCvPresignUrl` mutation. */
export type MutateGenerateSubmitCvPresignUrlVariables = QueryVariables<GenerateSubmitCvPresignUrlRequest>

/** Apollo response shape for `generateSubmitCvPresignUrl`. */
export interface MutateGenerateSubmitCvPresignUrlResponse {
    /** Top-level `generateSubmitCvPresignUrl` field wrapping the standard API response. */
    generateSubmitCvPresignUrl: GraphQLResponse<GenerateSubmitCvPresignUrlData>
}
