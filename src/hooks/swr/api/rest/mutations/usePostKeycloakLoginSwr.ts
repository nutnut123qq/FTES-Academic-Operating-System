import useSWRMutation from "swr/mutation"
import { keycloakLogin } from "@/modules/api/rest/keycloak-auth/login"
import { type KeycloakLoginRequest, type KeycloakLoginResponse } from "@/modules/api/rest/keycloak-auth/types"
import { LocalStorage } from "@/modules/storage/local/storage"
import { LocalStorageId } from "@/modules/storage/local/enums/id"
import { setAccessToken, setAuthenticated } from "@/redux/slices/keycloak"
import { useAppDispatch } from "@/redux/hooks"

/**
 * SWR mutation wrapper for {@link keycloakLogin}.
 *
 * On a non-MFA success it persists the access token to LocalStorage (under
 * {@link LocalStorageId.KeycloakAccessToken} — the key every authenticated request
 * reads) and to redux, so downstream requests attach `Authorization: Bearer <token>`.
 * When the backend returns an MFA challenge (`mfaRequired`, no `accessToken`) nothing
 * is stored and the caller must complete `/auth/mfa/verify`.
 */
export const usePostKeycloakLoginSwr = () => {
    const dispatch = useAppDispatch()
    const swr = useSWRMutation<
        KeycloakLoginResponse,
        Error,
        string,
        KeycloakLoginRequest
    >(
        "POST_KEYCLOAK_LOGIN_SWR",
        async (_key, { arg }) => {
            const response = await keycloakLogin(arg)
            if (response.accessToken) {
                LocalStorage.setItem(LocalStorageId.KeycloakAccessToken, response.accessToken)
                // Persist the refresh token so the proactive refresh link can mint a new
                // access token via REST `/auth/refresh` (BE GraphQL gateway is query-only).
                if (response.refreshToken) {
                    LocalStorage.setItem(LocalStorageId.KeycloakRefreshToken, response.refreshToken)
                }
                dispatch(setAccessToken(response.accessToken))
                dispatch(setAuthenticated(true))
            }
            return response
        }
    )
    return swr
}
