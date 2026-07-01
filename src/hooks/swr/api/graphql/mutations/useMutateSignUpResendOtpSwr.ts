import useSWRMutation from "swr/mutation"
import type { AbortableRequest } from "@/modules/api/graphql/types"
import { mutateSignUpResendOtp } from "@/modules/api/graphql/mutations/mutation-sign-up-resend-otp"
import { type SignUpResendOtpRequest } from "@/modules/api/graphql/mutations/types/sign-up-resend-otp"

type MutateSignUpResendOtpResult = Awaited<ReturnType<typeof mutateSignUpResendOtp>>

/**
 * SWR mutation for `signUpResendOtp` (resend OTP using existing `challengeId`).
 */
export const useMutateSignUpResendOtpSwr = () => {
    return useSWRMutation<
        MutateSignUpResendOtpResult,
        Error,
        string,
        AbortableRequest<SignUpResendOtpRequest>
    >(
        "MUTATE_SIGN_UP_RESEND_OTP_SWR",
        async (_, { arg }) => {
            if (!arg.request) {
                throw new Error("request is required")
            }
            return await mutateSignUpResendOtp({
                request: arg.request,
                signal: arg.signal,
            })
        },
    )
}
