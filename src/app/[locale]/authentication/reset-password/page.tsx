import React, { Suspense } from "react"
import { ResetPasswordForm } from "@/components/features/authentication/ResetPasswordForm"

/**
 * Route `/[locale]/authentication/reset-password` — FE MOCK set-new-password.
 * Thin route file: only mounts the feature component (Suspense: it reads
 * `?token=` via `useSearchParams`).
 */
const Page = () => {
    return (
        <div className="flex min-h-[60vh] items-center justify-center p-6">
            <Suspense>
                <ResetPasswordForm />
            </Suspense>
        </div>
    )
}

export default Page
