import React from "react"
import { OauthRedirect } from "@/components/layouts/auth/OauthRedirect"
import { OauthAction } from "@/components/layouts/auth/OauthRedirect/enums/oauth-action"

/**
 * Route `/[locale]/authentication/github/login` — OAuth redirect landing after
 * a GitHub sign-in via Keycloak. Thin route file: only mounts the component.
 */
const Page = () => {
    return <OauthRedirect action={OauthAction.Login} />
}

export default Page
