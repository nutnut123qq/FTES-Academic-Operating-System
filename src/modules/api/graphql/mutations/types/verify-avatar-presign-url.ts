import type { GraphQLResponse, QueryVariables } from "../../types"

/** Payload inside `verifyAvatarPresignUrl.data` after the standard API wrapper. */
export interface VerifyAvatarPresignUrlData {
    /** True when the object exists in storage and the avatar was persisted. */
    uploaded: boolean
    /** Public URL of the persisted avatar, or null when the upload was not found. */
    url: string | null
}

/** GraphQL `VerifyAvatarPresignUrlRequest` body. */
export interface VerifyAvatarPresignUrlRequest {
    /** S3 object key returned by generateAvatarPresignUrl. */
    key: string
}

/** Apollo variables bag for the `verifyAvatarPresignUrl` mutation. */
export type MutateVerifyAvatarPresignUrlVariables = QueryVariables<VerifyAvatarPresignUrlRequest>

/** Apollo response shape for `verifyAvatarPresignUrl`. */
export interface MutateVerifyAvatarPresignUrlResponse {
    /** Top-level `verifyAvatarPresignUrl` field wrapping the standard API response. */
    verifyAvatarPresignUrl: GraphQLResponse<VerifyAvatarPresignUrlData>
}
