import type { GraphQLResponse, MutateVariables } from "../../types"

/**
 * Input for `signUpInit` (matches server `SignUpInitRequest`).
 */
export interface SignUpInitRequest {
    /** User email address; also used as the login identifier. */
    email: string
    /** Plain-text password (transmitted over HTTPS). */
    password: string
    /** Optional display username. */
    username?: string
    /** Optional given name. */
    firstName?: string
    /** Optional family name. */
    lastName?: string
}

/** Payload inside `signUpInit.data` after the standard API wrapper. */
export interface SignUpInitData {
    /** Challenge ID to include in the OTP verification step. */
    challengeId: string
    /** Seconds until the OTP challenge expires. */
    expiresInSeconds: number
}

/** Apollo variables bag for the `signUpInit` mutation. */
export type MutateSignUpInitVariables = MutateVariables<SignUpInitRequest>

/** Apollo response shape for `signUpInit`. */
export interface MutateSignUpInitResponse {
    /** Top-level `signUpInit` field wrapping the standard API response. */
    signUpInit: GraphQLResponse<SignUpInitData>
}
