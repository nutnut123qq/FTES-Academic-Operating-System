import useSWRMutation from "swr/mutation"
import {
    verifyMfaChallenge,
    type MfaVerifyRequest,
    type TokenResponse,
} from "@/modules/api/rest/identity"

/**
 * SWR mutation wrapper for {@link verifyMfaChallenge}.
 */
export const usePostVerifyMfaChallengeSwr = () => {
    const swr = useSWRMutation<
        TokenResponse,
        Error,
        string,
        MfaVerifyRequest
    >(
        "POST_VERIFY_MFA_CHALLENGE_SWR",
        async (_key, { arg }) => {
            return verifyMfaChallenge(arg)
        },
    )

    return swr
}
