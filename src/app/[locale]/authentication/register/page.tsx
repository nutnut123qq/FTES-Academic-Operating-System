import React from "react"
import { RegisterForm } from "@/components/features/authentication/RegisterForm"

/**
 * Route `/[locale]/authentication/register` — FE MOCK self-service registration.
 * Thin route file: only mounts the feature component.
 */
const Page = () => {
    return (
        <div className="flex min-h-[60vh] items-center justify-center p-6">
            <RegisterForm />
        </div>
    )
}

export default Page
