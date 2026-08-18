import React, { Suspense } from "react"
import { GithubCallback } from "@/components/features/authentication/GithubCallback"

/**
 * Route `/[locale]/authentication/github/callback` — GitHub OAuth redirect landing.
 * Thin route file: mounts the feature component under Suspense (it reads `?code&state`
 * via `useSearchParams`). Replaces the dead Keycloak `github/{login,logout}` landings —
 * the Java backend exchanges the `code` directly, no Keycloak hand-off.
 */
const Page = () => {
    return (
        <div className="flex min-h-[60vh] items-center justify-center p-6">
            <Suspense>
                <GithubCallback />
            </Suspense>
        </div>
    )
}

export default Page
