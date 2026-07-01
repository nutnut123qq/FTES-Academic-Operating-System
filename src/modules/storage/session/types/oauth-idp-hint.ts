// `import type` + import the enum definition file directly (NOT via the `@/modules/api` barrel):
// breaks the api↔storage cycle in both the module graph and at runtime (the type is erased by TS).
import type { KeycloakIdentityProvider } from "@/modules/api/graphql/mutations/types/exchange-code-for-token"

/**
 * Session storage oauth idp hint provider.
 */
export interface SessionStorageOauthIdpHint {
    provider: KeycloakIdentityProvider
}