import React from "react"
import { OtpVerifyForm } from "@/components/features/authentication/OtpVerifyForm"

/**
 * Route `/[locale]/authentication/verify-otp` — FE MOCK OTP verification.
 * Thin route file: only mounts the feature component.
 */
const Page = () => {
    return (
        <div className="flex min-h-[60vh] items-center justify-center p-6">
            <OtpVerifyForm />
        </div>
    )
}

export default Page
