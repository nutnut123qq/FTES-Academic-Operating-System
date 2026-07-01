import type { GraphQLResponse, MutateVariables } from "../../types"
import type { SignUpInitData } from "./sign-up-init"

/**
 * Input for `signUpResendOtp` (matches server `SignUpResendOtpRequest`).
 */
export interface SignUpResendOtpRequest {
    /** Active challenge ID from the prior `signUpInit` response. */
    challengeId: string
}

/** Apollo variables bag for the `signUpResendOtp` mutation. */
export type MutateSignUpResendOtpVariables = MutateVariables<SignUpResendOtpRequest>

/** Apollo response shape for `signUpResendOtp`. */
export interface MutateSignUpResendOtpResponse {
    /** Top-level `signUpResendOtp` field (reuses {@link SignUpInitData} shape). */
    signUpResendOtp: GraphQLResponse<SignUpInitData>
}
