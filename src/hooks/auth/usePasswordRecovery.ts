"use client"

import { useCallback, useState } from "react"

/** Simulated network latency for the mock auth services (ms). */
const MOCK_LATENCY_MS = 600

/**
 * Password recovery service: request a reset email and complete the reset with
 * a token. The request always "succeeds" so the UI can stay neutral (no account
 * enumeration).
 * @returns `requestReset`/`resetPassword` actions plus their pending flags.
 */
// ponytail: mock BE — wire real endpoints when the contract exists
export const usePasswordRecovery = () => {
    const [isRequesting, setIsRequesting] = useState(false)
    const [isResetting, setIsResetting] = useState(false)

    const requestReset = useCallback(async (email: string): Promise<void> => {
        void email
        setIsRequesting(true)
        try {
            await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS))
        } finally {
            setIsRequesting(false)
        }
    }, [])

    const resetPassword = useCallback(async (token: string, password: string): Promise<boolean> => {
        void password
        setIsResetting(true)
        try {
            await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS))
            // a present token is treated as valid in the mock
            return Boolean(token)
        } finally {
            setIsResetting(false)
        }
    }, [])

    return { requestReset, resetPassword, isRequesting, isResetting }
}
