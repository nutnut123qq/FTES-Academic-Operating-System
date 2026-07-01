import type { GraphQLResponse, QueryVariables } from "../../types"

/** Payload inside `generateAvatarPresignUrl.data` after the standard API wrapper. */
export interface GenerateAvatarPresignUrlData {
    /** Pre-signed S3 (MinIO) PUT URL the client uploads the image directly to. */
    url: string
    /** S3 object key the upload lands on; passed back to verifyAvatarPresignUrl. */
    key: string
}

/** GraphQL `GenerateAvatarPresignUrlRequest` body. */
export interface GenerateAvatarPresignUrlRequest {
    /** Image MIME type to upload (e.g. "image/png"); drives the key extension. */
    contentType: string
}

/** Apollo variables bag for the `generateAvatarPresignUrl` mutation. */
export type MutateGenerateAvatarPresignUrlVariables = QueryVariables<GenerateAvatarPresignUrlRequest>

/** Apollo response shape for `generateAvatarPresignUrl`. */
export interface MutateGenerateAvatarPresignUrlResponse {
    /** Top-level `generateAvatarPresignUrl` field wrapping the standard API response. */
    generateAvatarPresignUrl: GraphQLResponse<GenerateAvatarPresignUrlData>
}
