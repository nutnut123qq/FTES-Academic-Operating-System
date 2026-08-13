import useSWRMutation from "swr/mutation"
import { enableMfaEmail, type MfaEmailRequest } from "@/modules/api/rest/identity"

/**
 * SWR mutation wrapper for {@link enableMfaEmail}.
 */
export const usePostEnableMfaEmailSwr = () => {
    const swr = useSWRMutation<void, Error, string, MfaEmailRequest>(
        "POST_ENABLE_MFA_EMAIL_SWR",
        async (_key, { arg }) => {
            return enableMfaEmail(arg)
        },
    )

    return swr
}
