import type { 
    KeycloakLoginRequest, 
    KeycloakLoginResponse 
} from "./types"
import axios from "axios"
import { publicEnv } from "@/resources/env/public"

/**
 * Calls the login endpoint and returns token data.
 *
 * @param request - Email + password credentials.
 * @returns Access / refresh tokens on success; throws on failure.
 */
export const keycloakLogin = async (
    request: KeycloakLoginRequest,
): Promise<KeycloakLoginResponse> => {
    /** The URL of the login endpoint. */
    const url = `${publicEnv().api.http}/keycloak/auth/login`
    /** The axios instance. */
    const axiosInstance = axios.create(
        {
            baseURL: publicEnv().api.http,
            headers: { "Content-Type": "application/json" },
        }
    )
    /** The response from the login endpoint. */
    const response = await axiosInstance.post<KeycloakLoginResponse>(url, request)
    /** The data from the response. */
    return response.data
}
