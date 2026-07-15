"use client"

import { useCallback } from "react"
import { usePostRequestOtpSwr } from "@/hooks/swr/api/rest/mutations/usePostRequestOtpSwr"
import { usePostVerifyOtpSwr } from "@/hooks/swr/api/rest/mutations/usePostVerifyOtpSwr"

/** OTP context: which channel/purpose/target the code was issued for. */
export interface UseOtpVerifyParams {
    /** OTP channel — `"EMAIL"` or `"SMS"` (backend `OtpService`). */
    channel: string
    /** OTP purpose — `"LOGIN"` or `"VERIFY_PHONE"` (backend `OtpService`). */
    purpose: string
    /** Target address (email or phone) the code was sent to. */
    target: string
}

/**
 * Standalone OTP verification service backed by the real identity REST
 * endpoints: `POST /api/v1/auth/otp/verify` and `POST /api/v1/auth/otp/request`
 * (resend). A wrong/expired code is rejected by the backend
 * (`IDENTITY_OTP_INVALID`) and surfaces here as `verify → false`.
 *
 * Used by the full-page `OtpVerifyForm`; the in-modal sign-in/sign-up OTP steps
 * verify through their own flows instead.
 * @returns `verify`/`resend` actions plus their pending flags.
 */
export const useOtpVerify = ({ channel, purpose, target }: UseOtpVerifyParams) => {
    const { trigger: triggerVerify, isMutating: isVerifying } = usePostVerifyOtpSwr()
    const { trigger: triggerResend, isMutating: isResending } = usePostRequestOtpSwr()

    const verify = useCallback(async (code: string): Promise<boolean> => {
        if (!target) return false
        try {
            await triggerVerify({ channel, purpose, target, code })
            return true
        } catch {
            return false
        }
    }, [channel, purpose, target, triggerVerify])

    const resend = useCallback(async (): Promise<boolean> => {
        if (!target) return false
        try {
            await triggerResend({ channel, purpose, target })
            return true
        } catch {
            // quota/cooldown or transport failure — the cooldown UI already throttles retries
            return false
        }
    }, [channel, purpose, target, triggerResend])

    return { verify, resend, isVerifying, isResending }
}
