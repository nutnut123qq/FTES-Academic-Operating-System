import useSWRMutation from "swr/mutation"
import type { AbortableRequest } from "@/modules/api/graphql/types"
import { mutateSignInResendOtp } from "@/modules/api/graphql/mutations/mutation-sign-in-resend-otp"
import { type SignInResendOtpRequest } from "@/modules/api/graphql/mutations/types/sign-in-resend-otp"

type MutateSignInResendOtpResult = Awaited<ReturnType<typeof mutateSignInResendOtp>>

/**
 * SWR mutation for `signInResendOtp` (resend OTP using existing `challengeId`).
 */
export const useMutateSignInResendOtpSwr = () => {
    return useSWRMutation<
        MutateSignInResendOtpResult,
        Error,
        string,
        AbortableRequest<SignInResendOtpRequest>
    >(
        "MUTATE_SIGN_IN_RESEND_OTP_SWR",
        async (_, { arg }) => {
            if (!arg.request) {
                throw new Error("request is required")
            }
            return await mutateSignInResendOtp({
                request: arg.request,
                signal: arg.signal,
            })
        },
    )
}
