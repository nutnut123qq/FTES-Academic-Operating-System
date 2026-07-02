"use client"

import { useCallback, useState } from "react"

/** Simulated network latency for the mock auth services (ms). */
const MOCK_LATENCY_MS = 600

/**
 * Standalone OTP verification service (email/phone channels).
 *
 * Used by the full-page `OtpVerifyForm`; the in-modal sign-in/sign-up OTP steps
 * verify through their real GraphQL mutations instead.
 * @returns `verify`/`resend` actions plus their pending flags.
 */
// ponytail: mock BE — accepts any 6-digit code; wire real endpoint when contract exists
export const useOtpVerify = () => {
    const [isVerifying, setIsVerifying] = useState(false)
    const [isResending, setIsResending] = useState(false)

    const verify = useCallback(async (code: string): Promise<boolean> => {
        setIsVerifying(true)
        try {
            await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS))
            return /^\d{6}$/.test(code)
        } finally {
            setIsVerifying(false)
        }
    }, [])

    const resend = useCallback(async (): Promise<void> => {
        setIsResending(true)
        try {
            await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS))
        } finally {
            setIsResending(false)
        }
    }, [])

    return { verify, resend, isVerifying, isResending }
}
