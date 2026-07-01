import {
    GoogleIcon,
    GithubIcon,
} from "../../../../svg"
import type {
    OauthButtonItem,
} from "./types"
import { KeycloakIdentityProvider } from "@/modules/api/graphql/mutations/types/exchange-code-for-token"

/**
 * Ordered catalog of OAuth shortcut buttons shown on the sign-in step.
 *
 * Static lookup: provider → icon + label key. Order drives render order
 * (Google first, GitHub second).
 */
export const OAUTH_BUTTON_ITEMS: Array<OauthButtonItem> = [
    {
        provider: KeycloakIdentityProvider.Google,
        icon: GoogleIcon,
        labelKey: "auth.signIn.google",
    },
    {
        provider: KeycloakIdentityProvider.Github,
        icon: GithubIcon,
        labelKey: "auth.signIn.github",
    },
]
