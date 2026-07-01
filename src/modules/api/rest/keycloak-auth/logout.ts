import axios from "axios"
import { publicEnv } from "@/resources/env/public"

/**
 * Calls the logout endpoint to clear the server-side session (refresh cookie).
 *
 * This endpoint is expected to clear HttpOnly cookies; therefore `withCredentials: true`
 * is required.
 */
export const keycloakLogout = async (): Promise<void> => {
    const url = `${publicEnv().api.http}/keycloak/auth/logout`
    const axiosInstance = axios.create({
        baseURL: publicEnv().api.http,
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
    })
    await axiosInstance.post(url)
}

