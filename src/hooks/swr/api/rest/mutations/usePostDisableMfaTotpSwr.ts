import useSWRMutation from "swr/mutation"
import {
    disableMfaTotp,
    type MfaDisableRequest,
} from "@/modules/api/rest/identity"

/**
 * SWR mutation wrapper for {@link disableMfaTotp}.
 */
export const usePostDisableMfaTotpSwr = () => {
    const swr = useSWRMutation<void, Error, string, MfaDisableRequest | undefined>(
        "POST_DISABLE_MFA_TOTP_SWR",
        async (_key, { arg }) => {
            return disableMfaTotp(arg)
        },
    )

    return swr
}
