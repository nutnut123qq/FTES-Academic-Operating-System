import React from "react"
import { OauthRedirect } from "@/components/layouts/auth/OauthRedirect"
import { OauthAction } from "@/components/layouts/auth/OauthRedirect/enums/oauth-action"

/**
 * Route `/[locale]/authentication/google/login` — OAuth redirect landing after
 * a Google sign-in via Keycloak. Thin route file: only mounts the component.
 */
const Page = () => {
    return <OauthRedirect action={OauthAction.Login} />
}

export default Page
