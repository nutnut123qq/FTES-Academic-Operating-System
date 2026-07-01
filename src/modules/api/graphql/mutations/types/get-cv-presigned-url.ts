import type { GraphQLResponse, QueryVariables } from "../../types"

/** Payload inside `getCVPresignedUrl.data` after the standard API wrapper. */
export interface GetCVPresignedUrlData {
    /** Pre-signed S3 upload URL. */
    url: string
    /** S3 object key for subsequent references. */
    key: string
}

/** GraphQL `GetCVPresignedUrlRequest` body. */
export interface GetCVPresignedUrlRequest {
    /** Original file name (used to derive the S3 key). */
    fileName: string
    /** MIME type of the CV file (e.g. `application/pdf`). */
    fileType: string
}

/** Apollo variables bag for the `getCVPresignedUrl` mutation. */
export type MutateGetCVPresignedUrlVariables = QueryVariables<GetCVPresignedUrlRequest>

/** Apollo response shape for `getCVPresignedUrl`. */
export interface MutateGetCVPresignedUrlResponse {
    /** Top-level `getCVPresignedUrl` field wrapping the standard API response. */
    getCVPresignedUrl: GraphQLResponse<GetCVPresignedUrlData>
}
