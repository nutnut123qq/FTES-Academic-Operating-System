"use client"

import { useCallback, useEffect, useState } from "react"

/**
 * Countdown gate for "resend code" actions (OTP emails/SMS).
 *
 * Call `start()` whenever a code is dispatched; the resend control should stay
 * disabled while `isCoolingDown` and display `remaining` seconds.
 * @param seconds - Cooldown length in seconds (default 30).
 * @returns `remaining` seconds, `isCoolingDown` flag and the `start` trigger.
 */
export const useResendCooldown = (seconds = 30) => {
    const [remaining, setRemaining] = useState(0)
    const isCoolingDown = remaining > 0

    useEffect(() => {
        if (!isCoolingDown) return
        const timer = setInterval(
            () => setRemaining((current) => Math.max(0, current - 1)),
            1000,
        )
        return () => clearInterval(timer)
    }, [isCoolingDown])

    const start = useCallback(
        () => setRemaining(seconds),
        [seconds],
    )

    return { remaining, isCoolingDown, start }
}
