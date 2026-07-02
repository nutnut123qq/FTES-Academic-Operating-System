import React from "react"
import { ForgotPasswordForm } from "@/components/features/authentication/ForgotPasswordForm"

/**
 * Route `/[locale]/authentication/forgot-password` — FE MOCK password recovery
 * request. Thin route file: only mounts the feature component.
 */
const Page = () => {
    return (
        <div className="flex min-h-[60vh] items-center justify-center p-6">
            <ForgotPasswordForm />
        </div>
    )
}

export default Page
