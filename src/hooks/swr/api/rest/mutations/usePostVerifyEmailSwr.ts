import useSWRMutation from "swr/mutation"
import { verifyEmail, type VerifyEmailRequest } from "@/modules/api/rest/identity"

/**
 * SWR mutation wrapper for {@link verifyEmail}.
 */
export const usePostVerifyEmailSwr = () => {
    const swr = useSWRMutation<void, Error, string, VerifyEmailRequest>(
        "POST_VERIFY_EMAIL_SWR",
        async (_key, { arg }) => {
            return verifyEmail(arg)
        },
    )

    return swr
}
