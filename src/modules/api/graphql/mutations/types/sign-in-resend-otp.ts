import type { GraphQLResponse, MutateVariables } from "../../types"
import type { SignInInitData } from "./sign-in-init"

/**
 * Input for `signInResendOtp` (matches server `SignInResendOtpRequest`).
 */
export interface SignInResendOtpRequest {
    /** Active challenge ID from the prior `signInInit` response. */
    challengeId: string
}

/** Apollo variables bag for the `signInResendOtp` mutation. */
export type MutateSignInResendOtpVariables = MutateVariables<SignInResendOtpRequest>

/** Apollo response shape for `signInResendOtp`. */
export interface MutateSignInResendOtpResponse {
    /** Top-level `signInResendOtp` field (reuses {@link SignInInitData} shape). */
    signInResendOtp: GraphQLResponse<SignInInitData>
}
