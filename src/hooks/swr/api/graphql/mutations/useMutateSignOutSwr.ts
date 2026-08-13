
import useSWRMutation from "swr/mutation"
import { useSWRConfig } from "swr"
import { keycloakLogout } from "@/modules/api/rest/keycloak-auth/logout"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { setAccessToken, setAuthenticated } from "@/redux/slices/keycloak"
import { setUser } from "@/redux/slices/user"
import { LocalStorage } from "@/modules/storage/local/storage"
import { LocalStorageId } from "@/modules/storage/local/enums/id"

/**
 * SWR mutation that signs the current user out.
 *
 * Rewired from the (non-existent) GraphQL `signOut` mutation to the REST endpoint
 * {@link keycloakLogout} (`POST /api/v1/auth/logout`, authenticated). The server-side
 * session is revoked, then the local session is ALWAYS cleared (BOTH stored tokens +
 * redux `user`/`authenticated`/`accessToken`) — even if the server call fails — so the UI
 * reflects a signed-out state regardless. Consumers still just call `.trigger()`.
 *
 * The whole SWR cache is ALSO flushed on the way out. Sign-out is a soft transition
 * (clear token + redux, no full page reload), so without a flush every static key —
 * `GET_MY_QUESTS_SWR` / `GET_MY_PROGRESSION_SWR` / `GET_MY_ACTIVITY_DAYS_SWR` and every
 * other `/me/*` key — keeps user A's data in the provider `Map`. Signing a different
 * user B into the same tab re-keys the identical keys with `authenticated=true`, so B
 * would see A's coins/XP/streak flash (stale-while-revalidate) — a cross-user leak —
 * and the diff-based toast host would diff A's snapshot against B's first fetch and fire
 * phantom quest/level-up toasts. Flushing to `undefined` (no revalidate) forces every
 * `/me/*` hook back to a clean loading state for the next user.
 */
export const useMutateSignOutSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const dispatch = useAppDispatch()
    const { mutate } = useSWRConfig()
    const swr = useSWRMutation(
        "MUTATE_SIGN_OUT_SWR",
        async () => {
            if (!authenticated) {
                throw new Error("Not authenticated")
            }
            try {
                await keycloakLogout()
            } catch {
                // Ignore server-side logout failures (e.g. already-expired token) —
                // the local session is cleared below either way.
            } finally {
                // BOTH tokens go. Clearing only the access token left the REFRESH token
                // behind, and the REST client silently mints a fresh access token from it
                // (`refreshAccessToken`) on the next authenticated call — so a logout whose
                // server leg failed (offline, expired bearer) resurrected the session.
                LocalStorage.removeItem(LocalStorageId.KeycloakAccessToken)
                LocalStorage.removeItem(LocalStorageId.KeycloakRefreshToken)
                dispatch(setUser(null))
                dispatch(setAuthenticated(false))
                // The in-memory copy of the token was never cleared, so anything reading
                // `state.keycloak.accessToken` still saw the signed-out user's bearer.
                dispatch(setAccessToken(undefined))
                // Drop every cached entry (match-all filter) so no prior user's data
                // survives into the next session in the same tab. No revalidate: the
                // keys are re-fetched lazily when their hooks next mount.
                void mutate(() => true, undefined, { revalidate: false })
            }
        },
    )
    return swr
}
