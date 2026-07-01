import { publicEnv } from "@/resources/env/public"

export const redirectToGoogleAuth = async () => {
    const url = `${publicEnv().api.http}/keycloak/google/redirect`
    window.location.href = url
}