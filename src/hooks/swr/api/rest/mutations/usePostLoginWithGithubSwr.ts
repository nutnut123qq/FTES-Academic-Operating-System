import useSWRMutation from "swr/mutation"
import {
    loginWithGithub,
    type GithubCodeRequest,
    type TokenResponse,
} from "@/modules/api/rest/identity"
import { LocalStorage } from "@/modules/storage/local/storage"
import { LocalStorageId } from "@/modules/storage/local/enums/id"
import { setAccessToken, setAuthenticated } from "@/redux/slices/keycloak"
import { useAppDispatch } from "@/redux/hooks"
import { useRevalidateViewerSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserSwr"

/**
 * SWR mutation wrapper for {@link loginWithGithub} (`POST /api/v1/auth/github`).
 *
 * A carbon copy of {@link usePostLoginWithGoogleSwr}: on success it persists BOTH the
 * access token and the refresh token to LocalStorage (the keys every authenticated
 * request + the token-refresh flow read), mirrors them into redux, then revalidates the
 * viewer so the navbar swaps to the signed-in avatar without an F5. Persisting the refresh
 * token is what gives a GitHub-signed-in user the same silent-refresh behaviour as password
 * login (no 401 after 15 min / the next day).
 */
export const usePostLoginWithGithubSwr = () => {
    const dispatch = useAppDispatch()
    const revalidateViewer = useRevalidateViewerSwr()
    const swr = useSWRMutation<
        TokenResponse,
        Error,
        string,
        GithubCodeRequest
    >(
        "POST_LOGIN_WITH_GITHUB_SWR",
        async (_key, { arg }) => {
            const response = await loginWithGithub(arg)
            if (response.accessToken) {
                LocalStorage.setItem(LocalStorageId.KeycloakAccessToken, response.accessToken)
                // Persist the refresh token so the silent-refresh flow can mint new access
                // tokens via `POST /auth/refresh` — same as password / Google login.
                if (response.refreshToken) {
                    LocalStorage.setItem(LocalStorageId.KeycloakRefreshToken, response.refreshToken)
                }
                dispatch(setAccessToken(response.accessToken))
                dispatch(setAuthenticated(true))
                // Flipping `authenticated` alone does not re-run the `me` fetcher once this tab
                // has settled the signed-in SWR key, so hydrate the viewer explicitly.
                await revalidateViewer()
            }
            return response
        },
    )

    return swr
}
