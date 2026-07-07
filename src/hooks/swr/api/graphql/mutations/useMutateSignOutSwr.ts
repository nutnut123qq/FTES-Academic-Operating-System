
import useSWRMutation from "swr/mutation"
import { keycloakLogout } from "@/modules/api/rest/keycloak-auth/logout"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { setAuthenticated } from "@/redux/slices/keycloak"
import { setUser } from "@/redux/slices/user"
import { LocalStorage } from "@/modules/storage/local/storage"
import { LocalStorageId } from "@/modules/storage/local/enums/id"

/**
 * SWR mutation that signs the current user out.
 *
 * Rewired from the (non-existent) GraphQL `signOut` mutation to the REST endpoint
 * {@link keycloakLogout} (`POST /api/v1/auth/logout`, authenticated). The server-side
 * session is revoked, then the local session is ALWAYS cleared (stored access token +
 * redux `user`/`authenticated`) — even if the server call fails — so the UI reflects a
 * signed-out state regardless. Consumers still just call `.trigger()`.
 */
export const useMutateSignOutSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const dispatch = useAppDispatch()
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
                LocalStorage.removeItem(LocalStorageId.KeycloakAccessToken)
                dispatch(setUser(null))
                dispatch(setAuthenticated(false))
            }
        },
    )
    return swr
}
