import useSWRMutation from "swr/mutation"
import {
    activateMfaTotp,
    type MfaActivateRequest,
    type MfaActivateResponse,
} from "@/modules/api/rest/identity"

/**
 * SWR mutation wrapper for {@link activateMfaTotp}.
 */
export const usePostActivateMfaTotpSwr = () => {
    const swr = useSWRMutation<
        MfaActivateResponse,
        Error,
        string,
        MfaActivateRequest
    >(
        "POST_ACTIVATE_MFA_TOTP_SWR",
        async (_key, { arg }) => {
            return activateMfaTotp(arg)
        },
    )

    return swr
}
