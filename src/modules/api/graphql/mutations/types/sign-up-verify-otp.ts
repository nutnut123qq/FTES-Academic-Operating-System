import type { GraphQLResponse, MutateVariables } from "../../types"

/** GraphQL `SignUpVerifyOtpInput` body. */
export interface SignUpVerifyOtpRequest {
    /** Active challenge ID from `signUpInit`. */
    challengeId: string
    /** One-time password sent to the user's email. */
    otp: string
}

/** Payload inside `signUpVerifyOtp.data` after the standard API wrapper. */
export interface SignUpVerifyOtpData {
    /** Short-lived JWT access token. Refresh token is set as HttpOnly cookie. */
    accessToken: string
}

/** Apollo variables bag for the `signUpVerifyOtp` mutation. */
export type MutateSignUpVerifyOtpVariables = MutateVariables<SignUpVerifyOtpRequest>

/** Apollo response shape for `signUpVerifyOtp`. */
export interface MutateSignUpVerifyOtpResponse {
    /** Top-level `signUpVerifyOtp` field wrapping the standard API response. */
    signUpVerifyOtp: GraphQLResponse<SignUpVerifyOtpData>
}
