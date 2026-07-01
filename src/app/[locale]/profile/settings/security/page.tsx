import React from "react"
import { Security } from "@/components/features/profile/Security"

/**
 * Route `/[locale]/profile/security` — renders the security (2FA) feature.
 * Thin route file: only mounts the component, no logic/UI here.
 */
const Page = () => {
    return <Security />
}

export default Page
