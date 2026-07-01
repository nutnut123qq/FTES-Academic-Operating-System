import type { GraphQLResponse, QueryVariables } from "../../types"

/**
 * Identity broker passed to the `exchangeCodeForToken` mutation (mirrors Nest `KeycloakIdentityProvider`).
 * Must match GraphQL enum values on the API.
 */
export enum KeycloakIdentityProvider {
    /** Google OAuth2 provider. */
    Google = "google",
    /** GitHub OAuth2 provider. */
    Github = "github",
}

/** Token payload inside `exchangeCodeForToken.data` (mirrors `ExchangeCodeForTokenData`). */
export interface ExchangeCodeForTokenData {
    /** Short-lived JWT issued by Keycloak / backend. */
    accessToken: string
}

/** GraphQL `ExchangeCodeForTokenRequest` body. */
export interface ExchangeCodeForTokenRequest {
    /** OIDC authorization code received from the IdP redirect. */
    code: string
    /** Identity provider that issued the code. */
    provider: KeycloakIdentityProvider
    /** CSRF state token validated server-side. */
    state: string
}

/** Apollo variables bag for the `exchangeCodeForToken` mutation. */
export type MutateExchangeCodeForTokenVariables = QueryVariables<ExchangeCodeForTokenRequest>

/** Apollo response shape for `exchangeCodeForToken`. */
export interface MutateExchangeCodeForTokenResponse {
    /** Top-level `exchangeCodeForToken` field wrapping the standard API response. */
    exchangeCodeForToken: GraphQLResponse<ExchangeCodeForTokenData>
}
