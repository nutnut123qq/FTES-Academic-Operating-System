import useSWRMutation from "swr/mutation"
import {
    loginWithGoogle,
    type GoogleLoginRequest,
    type TokenResponse,
} from "@/modules/api/rest/identity"
import { LocalStorage } from "@/modules/storage/local/storage"
import { LocalStorageId } from "@/modules/storage/local/enums/id"
import { setAccessToken, setAuthenticated } from "@/redux/slices/keycloak"
import { useAppDispatch } from "@/redux/hooks"
import { useRevalidateViewerSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserSwr"

/**
 * SWR mutation wrapper for {@link loginWithGoogle} (`POST /api/v1/auth/google`).
 *
 * On success it persists BOTH the access token and the refresh token to LocalStorage
 * (the keys every authenticated request + the token-refresh flow read) and mirrors them
 * into redux — exactly like `usePostKeycloakLoginSwr` does for password login — so a
 * Google-signed-in user gets the same silent-refresh behaviour (no 401 after 15 min /
 * the next day). Without persisting the refresh token, the Google session would die on
 * the first access-token expiry with no way to renew it.
 */
export const usePostLoginWithGoogleSwr = () => {
    const dispatch = useAppDispatch()
    const revalidateViewer = useRevalidateViewerSwr()
    const swr = useSWRMutation<
        TokenResponse,
        Error,
        string,
        GoogleLoginRequest
    >(
        "POST_LOGIN_WITH_GOOGLE_SWR",
        async (_key, { arg }) => {
            const response = await loginWithGoogle(arg)
            if (response.accessToken) {
                LocalStorage.setItem(LocalStorageId.KeycloakAccessToken, response.accessToken)
                // Persist the refresh token so the silent-refresh flow can mint new access
                // tokens via `POST /auth/refresh` — same as password login.
                if (response.refreshToken) {
                    LocalStorage.setItem(LocalStorageId.KeycloakRefreshToken, response.refreshToken)
                }
                dispatch(setAccessToken(response.accessToken))
                dispatch(setAuthenticated(true))
                // Same reason as password login: flipping `authenticated` does not re-run the
                // `me` fetcher once this tab has settled the signed-in SWR key, so the navbar
                // would keep the signed-out avatar until F5. Hydrate the viewer explicitly.
                await revalidateViewer()
            }
            return response
        },
    )

    return swr
}
