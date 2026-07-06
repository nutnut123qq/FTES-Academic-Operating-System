import useSWRMutation from "swr/mutation"
import {
    resendVerificationEmail,
    type ResendVerificationRequest,
} from "@/modules/api/rest/identity"

/**
 * SWR mutation wrapper for {@link resendVerificationEmail}.
 */
export const usePostResendVerificationEmailSwr = () => {
    const swr = useSWRMutation<void, Error, string, ResendVerificationRequest>(
        "POST_RESEND_VERIFICATION_EMAIL_SWR",
        async (_key, { arg }) => {
            return resendVerificationEmail(arg)
        },
    )

    return swr
}
