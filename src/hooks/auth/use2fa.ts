"use client"

import { useCallback, useEffect, useState } from "react"
import { LocalStorage } from "@/modules/storage/local/storage"
import { LocalStorageId } from "@/modules/storage/local/enums/id"

/** Mock TOTP enrolment payload (client-generated — demo only; the real secret comes from BE). */
export interface TwoFactorEnrolment {
    /** Base32 shared secret for manual entry in an authenticator app. */
    secret: string
    /** `otpauth://` provisioning URL (what a real QR code would encode). */
    otpauthUrl: string
}

/** Base32 alphabet used by TOTP secrets. */
const SECRET_CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"

/** Simulated network latency for the mock auth services (ms). */
const MOCK_LATENCY_MS = 600

/**
 * TOTP two-factor service: enrolment (secret generation + confirm) and the
 * login challenge. The enabled flag persists in local storage so the sign-in
 * flow can gate on it.
 * @returns enrolment/challenge actions, the `isEnabled` flag and pending state.
 */
// ponytail: mock BE — secret is client-generated and any 6-digit code verifies;
// wire setupTwoFactor/confirmTwoFactor GraphQL mutations when the BE flow exists
export const use2fa = () => {
    const [isEnabled, setIsEnabled] = useState(false)
    const [isVerifying, setIsVerifying] = useState(false)

    // hydrate after mount — local storage is unavailable during SSR
    useEffect(() => {
        setIsEnabled(LocalStorage.getItem<boolean>(LocalStorageId.AuthTwoFactorEnabled) ?? false)
    }, [])

    const enrol = useCallback((): TwoFactorEnrolment => {
        const secret = Array.from(
            crypto.getRandomValues(new Uint8Array(16)),
            (byte) => SECRET_CHARSET[byte % SECRET_CHARSET.length],
        ).join("")
        const otpauthUrl = `otpauth://totp/FTES%20AOS?secret=${secret}&issuer=FTES%20AOS`
        return { secret, otpauthUrl }
    }, [])

    const verifyEnrolment = useCallback(async (code: string): Promise<boolean> => {
        setIsVerifying(true)
        try {
            await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS))
            if (!/^\d{6}$/.test(code)) return false
            LocalStorage.setItem(LocalStorageId.AuthTwoFactorEnabled, true)
            setIsEnabled(true)
            return true
        } finally {
            setIsVerifying(false)
        }
    }, [])

    const verifyChallenge = useCallback(async (code: string): Promise<boolean> => {
        setIsVerifying(true)
        try {
            await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS))
            return /^\d{6}$/.test(code)
        } finally {
            setIsVerifying(false)
        }
    }, [])

    return { isEnabled, enrol, verifyEnrolment, verifyChallenge, isVerifying }
}
