"use client"

import { useCallback } from "react"
import { usePostRequestPasswordResetSwr } from "@/hooks/swr/api/rest/mutations/usePostRequestPasswordResetSwr"
import { usePostResetPasswordSwr } from "@/hooks/swr/api/rest/mutations/usePostResetPasswordSwr"

/**
 * Password recovery service backed by the real identity REST endpoints:
 * `POST /api/v1/auth/forgot-password` and `POST /api/v1/auth/reset-password`.
 *
 * The forgot-password endpoint answers neutrally regardless of whether the
 * account exists (anti-enumeration is server-side), so `requestReset` only
 * returns `false` on a transport/server failure.
 * @returns `requestReset`/`resetPassword` actions plus their pending flags.
 */
export const usePasswordRecovery = () => {
    const { trigger: triggerRequest, isMutating: isRequesting } = usePostRequestPasswordResetSwr()
    const { trigger: triggerReset, isMutating: isResetting } = usePostResetPasswordSwr()

    const requestReset = useCallback(async (email: string): Promise<boolean> => {
        try {
            await triggerRequest({ email })
            return true
        } catch {
            return false
        }
    }, [triggerRequest])

    const resetPassword = useCallback(async (token: string, password: string): Promise<boolean> => {
        try {
            await triggerReset({ token, newPassword: password })
            return true
        } catch {
            // invalid/expired token (or transport failure) — the form shows the invalid-link notice
            return false
        }
    }, [triggerReset])

    return { requestReset, resetPassword, isRequesting, isResetting }
}
