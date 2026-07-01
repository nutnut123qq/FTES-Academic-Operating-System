import React from "react"
import { OauthRedirect } from "@/components/layouts/auth/OauthRedirect"
import { OauthAction } from "@/components/layouts/auth/OauthRedirect/enums/oauth-action"

/**
 * Route `/[locale]/authentication/google` — generic Google OAuth redirect landing
 * (adapter `init` hand-off) via Keycloak. Thin route file: only mounts the component.
 */
const Page = () => {
    return <OauthRedirect action={OauthAction.Authenticate} />
}

export default Page
