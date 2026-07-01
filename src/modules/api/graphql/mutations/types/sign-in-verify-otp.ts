import type { GraphQLResponse, MutateVariables } from "../../types"

/** GraphQL `SignInVerifyOtpRequest` body. */
export interface SignInVerifyOtpRequest {
    /** Active challenge ID from `signInInit`. */
    challengeId: string
    /** One-time password sent to the user's email. */
    otp: string
}

/** Payload inside `signInVerifyOtp.data` after the standard API wrapper. */
export interface SignInVerifyOtpData {
    /** Short-lived JWT access token. Refresh token is set as HttpOnly cookie. */
    accessToken: string
}

/** Apollo variables bag for the `signInVerifyOtp` mutation. */
export type MutateSignInVerifyOtpVariables = MutateVariables<SignInVerifyOtpRequest>

/** Apollo response shape for `signInVerifyOtp`. */
export interface MutateSignInVerifyOtpResponse {
    /** Top-level `signInVerifyOtp` field wrapping the standard API response. */
    signInVerifyOtp: GraphQLResponse<SignInVerifyOtpData>
}
