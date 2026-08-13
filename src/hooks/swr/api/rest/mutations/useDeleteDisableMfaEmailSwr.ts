import useSWRMutation from "swr/mutation"
import { disableMfaEmail, type MfaEmailRequest } from "@/modules/api/rest/identity"

/**
 * SWR mutation wrapper for {@link disableMfaEmail}.
 */
export const useDeleteDisableMfaEmailSwr = () => {
    const swr = useSWRMutation<void, Error, string, MfaEmailRequest>(
        "DELETE_DISABLE_MFA_EMAIL_SWR",
        async (_key, { arg }) => {
            return disableMfaEmail(arg)
        },
    )

    return swr
}
