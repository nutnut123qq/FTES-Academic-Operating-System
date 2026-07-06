import useSWRMutation from "swr/mutation"
import { enrollMfaTotp, type MfaEnrollResponse } from "@/modules/api/rest/identity"

/**
 * SWR mutation wrapper for {@link enrollMfaTotp}.
 */
export const usePostEnrollMfaTotpSwr = () => {
    const swr = useSWRMutation<MfaEnrollResponse, Error, string>(
        "POST_ENROLL_MFA_TOTP_SWR",
        async () => {
            return enrollMfaTotp()
        },
    )

    return swr
}
