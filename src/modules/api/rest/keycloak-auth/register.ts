import type {
    KeycloakRegisterRequest,
    KeycloakRegisterResponse
} from "./types"
import { restRequest } from "@/modules/api/rest/client"

/**
 * Registers a new user against the backend auth API.
 *
 * `POST /api/v1/auth/register` with body `{username, email, password}` (any extra
 * FE-only fields are dropped at this boundary). `restRequest` unwraps the
 * `{code, message, data}` envelope and returns the `MessageResponse` payload
 * (throws on non-200).
 *
 * @param request - Registration payload (username, email, password).
 * @returns Acknowledgement status on success; throws on failure.
 */
export const keycloakRegister = async (
    request: KeycloakRegisterRequest,
): Promise<KeycloakRegisterResponse> => {
    const { username, email, password } = request
    return restRequest<KeycloakRegisterResponse>({
        method: "POST",
        url: "/auth/register",
        data: { username, email, password },
        // Public endpoint — do not attach a (possibly stale) bearer token.
        authenticated: false,
    })
}
