"use client"

import { useCallback } from "react"
import { useGetMfaStatusSwr } from "@/hooks/swr/api/rest/queries/useGetMfaStatusSwr"
import { usePostEnrollMfaTotpSwr } from "@/hooks/swr/api/rest/mutations/usePostEnrollMfaTotpSwr"
import { usePostActivateMfaTotpSwr } from "@/hooks/swr/api/rest/mutations/usePostActivateMfaTotpSwr"
import { usePostDisableMfaTotpSwr } from "@/hooks/swr/api/rest/mutations/usePostDisableMfaTotpSwr"

/** TOTP enrolment payload returned by `POST /api/v1/identity/mfa/totp/enroll`. */
export interface TwoFactorEnrolment {
    /** Base32 shared secret for manual entry in an authenticator app. */
    secret: string
    /** `otpauth://` provisioning URL (what a QR code would encode). */
    otpauthUrl: string
}

/**
 * TOTP two-factor service backed by the real identity MFA REST endpoints
 * (`/api/v1/identity/mfa/**`, access token required): status, enrolment
 * (server-generated secret), activation (returns single-use recovery codes)
 * and disable (requires a valid TOTP code as proof).
 *
 * The sign-in TOTP challenge is NOT here — it verifies through
 * `usePostVerifyMfaChallengeSwr` (`POST /api/v1/auth/mfa/verify`).
 * @returns enrolment/disable actions, the `isEnabled` flag and pending state.
 */
export const use2fa = () => {
    const statusSwr = useGetMfaStatusSwr()
    const { trigger: triggerEnroll, isMutating: isEnrolling } = usePostEnrollMfaTotpSwr()
    const { trigger: triggerActivate, isMutating: isVerifying } = usePostActivateMfaTotpSwr()
    const { trigger: triggerDisable, isMutating: isDisabling } = usePostDisableMfaTotpSwr()

    const isEnabled = statusSwr.data?.totpEnabled ?? false
    const isStatusLoading = statusSwr.isLoading
    const mutateStatus = statusSwr.mutate

    const enrol = useCallback(async (): Promise<TwoFactorEnrolment | null> => {
        try {
            const response = await triggerEnroll()
            return { secret: response.secret, otpauthUrl: response.otpauthUri }
        } catch {
            return null
        }
    }, [triggerEnroll])

    /**
     * Confirms enrolment with a TOTP code.
     * @returns The single-use recovery codes on success, `null` when the code is rejected.
     */
    const verifyEnrolment = useCallback(async (code: string): Promise<Array<string> | null> => {
        try {
            const response = await triggerActivate({ code })
            await mutateStatus()
            return response.recoveryCodes
        } catch {
            return null
        }
    }, [triggerActivate, mutateStatus])

    const disable = useCallback(async (code: string): Promise<boolean> => {
        try {
            await triggerDisable({ code })
            await mutateStatus()
            return true
        } catch {
            return false
        }
    }, [triggerDisable, mutateStatus])

    return { isEnabled, isStatusLoading, enrol, verifyEnrolment, disable, isEnrolling, isVerifying, isDisabling }
}
