import React from "react"
import { ResetPasswordForm } from "@/components/features/authentication/ResetPasswordForm"

/**
 * Route `/[locale]/authentication/reset-password` — FE MOCK set-new-password.
 * Thin route file: only mounts the feature component.
 */
const Page = () => {
    return (
        <div className="flex min-h-[60vh] items-center justify-center p-6">
            <ResetPasswordForm />
        </div>
    )
}

export default Page
