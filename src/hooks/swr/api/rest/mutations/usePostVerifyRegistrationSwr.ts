import useSWRMutation from "swr/mutation"
import {
    verifyRegistration,
    type RegisterVerifyRequest,
    type TokenResponse,
} from "@/modules/api/rest/identity"
import { LocalStorage } from "@/modules/storage/local/storage"
import { LocalStorageId } from "@/modules/storage/local/enums/id"
import { setAccessToken, setAuthenticated } from "@/redux/slices/keycloak"
import { useAppDispatch } from "@/redux/hooks"

/**
 * SWR mutation wrapper for {@link verifyRegistration} (`POST /auth/register/verify`).
 *
 * The backend returns a token pair IDENTICAL to `POST /auth/login`, so on success
 * this persists it exactly like {@link usePostKeycloakLoginSwr} (LocalStorage under
 * {@link LocalStorageId.KeycloakAccessToken} + redux) — the freshly registered user
 * is signed in immediately, no separate login step.
 */
export const usePostVerifyRegistrationSwr = () => {
    const dispatch = useAppDispatch()
    const swr = useSWRMutation<
        TokenResponse,
        Error,
        string,
        RegisterVerifyRequest
    >(
        "POST_VERIFY_REGISTRATION_SWR",
        async (_key, { arg }) => {
            const response = await verifyRegistration(arg)
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
