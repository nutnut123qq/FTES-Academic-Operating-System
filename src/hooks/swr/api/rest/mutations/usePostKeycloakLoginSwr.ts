import useSWRMutation from "swr/mutation"
import { keycloakLogin } from "@/modules/api/rest/keycloak-auth/login"
import { type KeycloakLoginRequest, type KeycloakLoginResponse } from "@/modules/api/rest/keycloak-auth/types"
import { LocalStorage } from "@/modules/storage/local/storage"
import { LocalStorageId } from "@/modules/storage/local/enums/id"
import { setAccessToken, setAuthenticated } from "@/redux/slices/keycloak"
import { useAppDispatch } from "@/redux/hooks"
import { useRevalidateViewerSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserSwr"

/**
 * SWR mutation wrapper for {@link keycloakLogin}.
 *
 * On a non-MFA success it persists the access token to LocalStorage (under
 * {@link LocalStorageId.KeycloakAccessToken} — the key every authenticated request
 * reads) and to redux, so downstream requests attach `Authorization: Bearer <token>`.
 * When the backend returns an MFA challenge (`mfaRequired`, no `accessToken`) nothing
 * is stored and the caller must complete `/auth/mfa/verify`.
 *
 * The token is only HALF the session. The signed-in UI (account menu, avatar, gated
 * controls) renders from `state.user.user`, which nothing here writes — the `me` query
 * does, from inside its own fetcher. Storing the token used to be the whole login step
 * and the viewer was expected to re-fetch on its own because flipping `authenticated`
 * changes that query's SWR key; it does not when the tab has already resolved the
 * signed-in key once (sign out → sign in again, or signing in after a revoked session),
 * because SWR then serves the settled entry without running the fetcher. The result was
 * a "success" toast over a navbar still showing the signed-out avatar until the user
 * pressed F5. {@link useRevalidateViewerSwr} makes that hydration an explicit part of
 * signing in instead of a side effect we hope for.
 */
export const usePostKeycloakLoginSwr = () => {
    const dispatch = useAppDispatch()
    const revalidateViewer = useRevalidateViewerSwr()
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
                // Pull the viewer for the session that just started, so the shell has an
                // identity to render without a reload. Awaited: `trigger()` resolves only
                // once the signed-in UI can actually paint.
                await revalidateViewer()
            }
            return response
        }
    )
    return swr
}
