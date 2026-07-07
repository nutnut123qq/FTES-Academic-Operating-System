import { restRequest } from "@/modules/api/rest/client"
import { LocalStorage } from "@/modules/storage/local/storage"
import { LocalStorageId } from "@/modules/storage/local/enums/id"

/**
 * Logs the current user out.
 *
 * `POST /api/v1/auth/logout` — the backend revokes the server-side session using
 * the `sid` claim of the bearer access token, so this call MUST be authenticated.
 * On success the locally-stored access token is cleared so subsequent requests are
 * anonymous.
 */
export const keycloakLogout = async (): Promise<void> => {
    await restRequest<void>({
        method: "POST",
        url: "/auth/logout",
        authenticated: true,
    })
    LocalStorage.removeItem(LocalStorageId.KeycloakAccessToken)
}
