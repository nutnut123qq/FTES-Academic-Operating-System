import React from "react"
import { TwoFactorSetup } from "@/components/features/authentication/TwoFactorSetup"

/**
 * Route `/[locale]/authentication/two-factor` — FE MOCK two-factor (TOTP) setup.
 * Thin route file: only mounts the feature component.
 */
const Page = () => {
    return (
        <div className="flex min-h-[60vh] items-center justify-center p-6">
            <TwoFactorSetup />
        </div>
    )
}

export default Page
