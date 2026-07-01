import type { GraphQLResponse, MutateVariables } from "../../types"

/** GraphQL `SignInInitRequest` body. */
export interface SignInInitRequest {
    /** User email address. */
    email: string
    /** Plain-text password (transmitted over HTTPS). */
    password: string
}

/** Payload inside `signInInit.data` after the standard API wrapper. */
export interface SignInInitData {
    /** Challenge ID to include in the OTP verification step. */
    challengeId: string
    /** Seconds until the OTP challenge expires. */
    expiresInSeconds: number
}

/** Apollo variables bag for the `signInInit` mutation. */
export type MutateSignInInitVariables = MutateVariables<SignInInitRequest>

/** Apollo response shape for `signInInit`. */
export interface MutateSignInInitResponse {
    /** Top-level `signInInit` field wrapping the standard API response. */
    signInInit: GraphQLResponse<SignInInitData>
}
