import React, { Suspense } from "react"
import { OtpVerifyForm } from "@/components/features/authentication/OtpVerifyForm"

/**
 * Route `/[locale]/authentication/verify-otp` — FE MOCK OTP verification
 * (email or `?channel=phone`). Thin route file: only mounts the feature
 * component (Suspense: it reads the channel via `useSearchParams`).
 */
const Page = () => {
    return (
        <div className="flex min-h-[60vh] items-center justify-center p-6">
            <Suspense>
                <OtpVerifyForm />
            </Suspense>
        </div>
    )
}

export default Page
