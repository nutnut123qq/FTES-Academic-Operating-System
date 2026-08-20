import React from "react"
import { ForgotPasswordForm } from "@/components/features/authentication/ForgotPasswordForm"
import { GuestOnlyRoute } from "@/components/layouts/auth/GuestOnlyRoute"

/**
 * Route `/[locale]/authentication/forgot-password` — FE MOCK password recovery
 * request. Thin route file: only mounts the feature component.
 *
 * GUEST-ONLY (see {@link GuestOnlyRoute}): recovering a password is meaningless
 * with a live session, and the form's "check your inbox" state is local component
 * state that would otherwise survive a sign-in happening in the same tab.
 */
const Page = () => {
    return (
        <div className="flex min-h-[60vh] items-center justify-center p-6">
            <GuestOnlyRoute>
                <ForgotPasswordForm />
            </GuestOnlyRoute>
        </div>
    )
}

export default Page
