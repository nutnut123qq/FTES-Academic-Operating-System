import { publicEnv } from "@/resources/env/public"

/**
 * The redirect URLs for the Keycloak authentication.
 */
export const keycloakRedirect = {
    google: new URL(`${publicEnv().api.http}/keycloak/google/redirect`),
    github: new URL(`${publicEnv().api.http}/keycloak/github/redirect`)
}