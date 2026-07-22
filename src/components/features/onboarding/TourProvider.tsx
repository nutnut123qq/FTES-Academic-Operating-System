"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState, type PropsWithChildren } from "react"
import { useMediaQuery } from "usehooks-ts"
import { useAppSelector } from "@/redux/hooks"
import { TourContext, type TourContextValue } from "./TourContext"
import { SpotlightOverlay } from "./SpotlightOverlay"
import { welcomeTour } from "./welcome-tour"
import { isTourDone, markTourDone } from "./persistence"
import type { Tour } from "./types"

/** Delay before the first-run tour opens, so the header/anchors are mounted. */
const AUTOSTART_DELAY_MS = 900

/**
 * TourProvider — the onboarding tour engine host. Mounted once at the app shell
 * ({@link import("@/app/InnerLayout").InnerLayout}) so a single tour can spotlight
 * anchors anywhere in the layout.
 *
 * Responsibilities:
 * - Runs the welcome tour ONCE for a signed-in user on their first visit
 *   (persisted via `ftes.tour.onboarding.done` in localStorage — no backend).
 * - Provides `startTour()` so the account menu's "Xem lại hướng dẫn" entry can
 *   replay it on demand (ignoring the done flag, re-setting it on finish/skip).
 * - Enforces one-tour-at-a-time: `startTour` replaces any running tour, and only
 *   ever ONE {@link SpotlightOverlay} (one mascot) is on screen.
 * - Honours reduced motion (passes the flag down; the overlay drops transitions
 *   and the mascot bob).
 *
 * Skipping, finishing, and a target that never resolves all advance/close the
 * tour so it can never get stuck.
 */
export const TourProvider = ({ children }: PropsWithChildren) => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const user = useAppSelector((state) => state.user.user)
    const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)")

    const [activeTour, setActiveTour] = useState<Tour | null>(null)
    const [stepIndex, setStepIndex] = useState(0)
    // In-memory guard so the auto-start is *scheduled* at most once per session even
    // if the done flag cannot be read (private mode) or auth state churns. A ref —
    // NOT state — so flipping it does not re-render and re-run the effect (which
    // would clear the just-scheduled timer before it fires). The pending timer id
    // lives in its own ref so the schedule and its cleanup are decoupled.
    const autoStartScheduledRef = useRef(false)
    const autoStartTimerRef = useRef<number | null>(null)

    /** Start (or replace) a tour from its first step. Defaults to the welcome tour. */
    const startTour = useCallback((tour: Tour = welcomeTour) => {
        setStepIndex(0)
        setActiveTour(tour)
    }, [])

    /** Close the tour and remember it was seen (so the auto-start never repeats). */
    const finish = useCallback(() => {
        markTourDone()
        setActiveTour(null)
        setStepIndex(0)
    }, [])

    /** Advance to the next step, or finish on the last one. */
    const next = useCallback(() => {
        if (!activeTour) return
        if (stepIndex >= activeTour.steps.length - 1) finish()
        else setStepIndex((i) => i + 1)
    }, [activeTour, stepIndex, finish])

    /** Go back one step (clamped at the first). */
    const prev = useCallback(() => {
        setStepIndex((i) => Math.max(0, i - 1))
    }, [])

    /** Skip (dismiss) the whole tour — same terminal state as finishing. */
    const skip = useCallback(() => {
        finish()
    }, [finish])

    // First-run auto-start: once, for a signed-in user who has not seen the tour.
    // The guard is a ref, so it never re-renders; and this effect schedules the
    // timer but does NOT clear it on re-run (auth/user churn) — otherwise the
    // cleanup would cancel the pending 900ms timer before it fires (the flagship
    // "new account sees the welcome tour" scenario). Teardown happens once, on
    // unmount, in the separate effect below.
    useEffect(() => {
        if (autoStartScheduledRef.current) return
        if (!authenticated || !user) return
        autoStartScheduledRef.current = true
        if (isTourDone()) return
        autoStartTimerRef.current = window.setTimeout(
            () => startTour(welcomeTour),
            AUTOSTART_DELAY_MS,
        )
    }, [authenticated, user, startTour])

    // Clear any pending auto-start timer only when the provider unmounts, so a
    // re-run of the scheduling effect above can never cancel the live timer.
    useEffect(
        () => () => {
            if (autoStartTimerRef.current !== null) window.clearTimeout(autoStartTimerRef.current)
        },
        [],
    )

    const value = useMemo<TourContextValue>(
        () => ({ isActive: activeTour !== null, startTour }),
        [activeTour, startTour],
    )

    const step = activeTour?.steps[stepIndex]

    return (
        <TourContext.Provider value={value}>
            {children}
            {activeTour && step ? (
                // No per-step `key`: the overlay stays mounted across steps so the
                // spotlight box tweens from one anchor to the next (the internal
                // effects re-resolve per step via the step id in their deps).
                <SpotlightOverlay
                    step={step}
                    index={stepIndex}
                    total={activeTour.steps.length}
                    onNext={next}
                    onPrev={prev}
                    onSkip={skip}
                    onMissing={next}
                    reducedMotion={reducedMotion}
                />
            ) : null}
        </TourContext.Provider>
    )
}
