import useSWRMutation from "swr/mutation"
import {
    verifyMfaChallenge,
    type MfaVerifyRequest,
    type TokenResponse,
} from "@/modules/api/rest/identity"
import { LocalStorage } from "@/modules/storage/local/storage"
import { LocalStorageId } from "@/modules/storage/local/enums/id"
import { setAccessToken, setAuthenticated } from "@/redux/slices/keycloak"
import { useAppDispatch } from "@/redux/hooks"

/**
 * SWR mutation wrapper for {@link verifyMfaChallenge}.
 *
 * Completes an MFA-gated login: on success it persists the token pair exactly
 * like {@link usePostKeycloakLoginSwr} (LocalStorage under
 * {@link LocalStorageId.KeycloakAccessToken} + redux), so downstream requests
 * attach `Authorization: Bearer <token>`.
 */
export const usePostVerifyMfaChallengeSwr = () => {
    const dispatch = useAppDispatch()
    const swr = useSWRMutation<
        TokenResponse,
        Error,
        string,
        MfaVerifyRequest
    >(
        "POST_VERIFY_MFA_CHALLENGE_SWR",
        async (_key, { arg }) => {
            const response = await verifyMfaChallenge(arg)
            if (response.accessToken) {
                LocalStorage.setItem(LocalStorageId.KeycloakAccessToken, response.accessToken)
                if (response.refreshToken) {
                    LocalStorage.setItem(LocalStorageId.KeycloakRefreshToken, response.refreshToken)
                }
                dispatch(setAccessToken(response.accessToken))
                dispatch(setAuthenticated(true))
            }
            return response
        },
    )

    return swr
}
