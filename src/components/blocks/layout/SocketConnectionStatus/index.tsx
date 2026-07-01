"use client"

import React, { useEffect, useRef, useState } from "react"
import { cn } from "@heroui/react"
import { ArrowsClockwiseIcon, CheckCircleIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useAnySocketDown } from "@/hooks/socketio/connectionStore"

/** Grace period before a drop is surfaced — a sub-2s blip never flashes the pill. */
const DOWN_DELAY_MS = 2000
/** How long the "reconnected" confirmation lingers before the pill hides. */
const RECOVERED_MS = 1500

/** Debounced display phase of the status pill. */
type Phase = "hidden" | "down" | "recovered"

/**
 * SocketConnectionStatus — a global, non-blocking "connection lost / reconnecting"
 * pill (Google Docs style). It floats, centered, just below the navbar and appears
 * only when a realtime socket drops for longer than {@link DOWN_DELAY_MS}, then auto
 * confirms "reconnected" and hides on recovery.
 *
 * The app keeps working over HTTP, so this is purely informational — `pointer-events-none`
 * on the wrapper means it never blocks interaction. Mounted once in
 * {@link import("@/app/InnerLayout").InnerLayout}, right after the navbar.
 */
export const SocketConnectionStatus = () => {
    const t = useTranslations()
    const anyDown = useAnySocketDown()
    const [phase, setPhase] = useState<Phase>("hidden")

    const downTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const recoveredTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    /** Latest phase, read inside async timers without re-subscribing them. */
    const phaseRef = useRef<Phase>("hidden")
    phaseRef.current = phase

    // React to the socket up/down signal: arm a grace timer on drop, confirm on recovery.
    useEffect(() => {
        if (anyDown) {
            if (recoveredTimer.current) {
                clearTimeout(recoveredTimer.current)
                recoveredTimer.current = null
            }
            // wait out the grace period — a brief blip should never show the pill
            if (!downTimer.current) {
                downTimer.current = setTimeout(() => {
                    downTimer.current = null
                    setPhase("down")
                }, DOWN_DELAY_MS)
            }
            return
        }
        // back up — cancel a pending grace timer
        if (downTimer.current) {
            clearTimeout(downTimer.current)
            downTimer.current = null
        }
        // only celebrate "reconnected" if the drop was actually surfaced
        if (phaseRef.current === "down") {
            setPhase("recovered")
        } else {
            setPhase("hidden")
        }
    }, [anyDown])

    // After the "reconnected" confirmation lingers, hide the pill.
    useEffect(() => {
        if (phase !== "recovered") {
            return
        }
        recoveredTimer.current = setTimeout(() => {
            recoveredTimer.current = null
            setPhase("hidden")
        }, RECOVERED_MS)
        return () => {
            if (recoveredTimer.current) {
                clearTimeout(recoveredTimer.current)
                recoveredTimer.current = null
            }
        }
    }, [phase])

    // Tidy timers on unmount.
    useEffect(
        () => () => {
            if (downTimer.current) {
                clearTimeout(downTimer.current)
            }
            if (recoveredTimer.current) {
                clearTimeout(recoveredTimer.current)
            }
        },
        [],
    )

    if (phase === "hidden") {
        return null
    }

    const recovered = phase === "recovered"

    return (
        <div className="pointer-events-none fixed inset-x-0 top-[4.5rem] z-40 flex justify-center">
            <div
                className={cn(
                    "pointer-events-auto flex items-center gap-2 rounded-full px-3 py-1.5 text-xs shadow-md",
                    recovered ? "bg-success/10 text-success" : "bg-warning/10 text-warning",
                )}
            >
                {recovered ? (
                    <CheckCircleIcon aria-hidden focusable="false" className="size-4" />
                ) : (
                    <ArrowsClockwiseIcon aria-hidden focusable="false" className="size-4 animate-spin" />
                )}
                {recovered ? t("socketStatus.reconnected") : t("socketStatus.reconnecting")}
            </div>
        </div>
    )
}
