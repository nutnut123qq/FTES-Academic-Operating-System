import type {
    KeycloakLoginRequest,
    KeycloakLoginResponse
} from "./types"
import { restRequest } from "@/modules/api/rest/client"

/**
 * Logs a user in against the backend auth API.
 *
 * `POST /api/v1/auth/login` with body `{identifier, password, ...}`. The backend
 * wraps the result in the standard `{code, message, data}` envelope; `restRequest`
 * unwraps it and returns the `TokenResponse` payload (throws on non-200).
 *
 * @param request - Identifier (email or username) + password credentials.
 * @returns Access / refresh tokens on success; throws on failure.
 */
export const keycloakLogin = async (
    request: KeycloakLoginRequest,
): Promise<KeycloakLoginResponse> => {
    return restRequest<KeycloakLoginResponse>({
        method: "POST",
        url: "/auth/login",
        data: request,
        // Public endpoint — do not attach a (possibly stale) bearer token.
        authenticated: false,
    })
}
