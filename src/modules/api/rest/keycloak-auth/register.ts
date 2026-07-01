import type { 
    KeycloakRegisterRequest, 
    KeycloakRegisterResponse 
} from "./types"
import axios from "axios"
import { publicEnv } from "@/resources/env/public"

/**
 * Calls the register endpoint to create a new Keycloak user.
 *
 * @param request - Registration payload (username, email, password, etc.).
 * @returns Created user ID on success; throws on failure.
 */
export const keycloakRegister = async (
    request: KeycloakRegisterRequest,
): Promise<KeycloakRegisterResponse> => {
    /** The URL of the register endpoint. */
    const url = `${publicEnv().api.http}/keycloak/auth/register`
    /** The axios instance. */
    const axiosInstance = axios.create(
        {
            baseURL: publicEnv().api.http,
            headers: { "Content-Type": "application/json" },
        }
    )
    /** The response from the register endpoint. */
    const response = await axiosInstance.post<KeycloakRegisterResponse>(url, request)
    /** The data from the response. */
    return response.data
}
