"use client"

import { useCallback, useEffect, useRef, useState } from "react"

/**
 * How close to the end (seconds) the up-next button arms. Matches the YouTube/Netflix
 * "up next" window the owner asked for ("khoảng 10s cuối thì hiện cái nút").
 */
export const UP_NEXT_WINDOW_SECONDS = 10

/**
 * Only arm on clips meaningfully longer than the window. A 12s clip would otherwise be
 * "in its last 10s" from the second second, so the button would sit there for the whole
 * video. 20s = the window plus a 10s head, the shortest clip where "last 10 seconds"
 * still reads as an ending rather than the whole thing.
 */
export const UP_NEXT_MIN_DURATION_SECONDS = 20

/** Grace period after `ended` before auto-advancing. Cancellable via {@link UseLessonUpNextResult.dismiss}. */
export const UP_NEXT_COUNTDOWN_SECONDS = 5

/** Where the video should hand off to when it finishes. */
export interface LessonUpNextDestination {
    /** Route to push (already locale-agnostic — pushed through the next-intl router). */
    href: string
    /** Human title shown on the overlay ("" when the source has none). */
    title: string
    /** Whether this is the lesson's own challenge or the next lesson (drives the label). */
    kind: "lesson" | "challenge"
}

/** Options for {@link useLessonUpNext}. */
export interface UseLessonUpNextOptions {
    /** Resolved destination, or null when there is nowhere to go (→ the hook stays inert). */
    destination: LessonUpNextDestination | null
    /**
     * Hard off-switch. TRUE for a freemium PREVIEW / gated player: that video is CUT OFF at
     * `previewSeconds`, so its `ended` is "the preview ran out", never "finished the lesson".
     * Neither the button nor the auto-advance may happen in that state.
     */
    disabled?: boolean
    /** Push the destination route (wired to the next-intl router by the caller). */
    onNavigate: (href: string) => void
    /** Changing this (the lesson id) clears dismissal / fired guards for the new video. */
    resetKey?: string
}

/** State + player callbacks exposed by {@link useLessonUpNext}. */
export interface UseLessonUpNextResult {
    /** Show the overlay button (last {@link UP_NEXT_WINDOW_SECONDS} seconds, or counting down). */
    isArmed: boolean
    /** Seconds left before the auto-advance fires; null while the video is still playing. */
    countdown: number | null
    /** Feed every playback tick here (duration is what tells us "10s left"). */
    onTimeUpdate: (currentTime: number, duration?: number) => void
    /** Feed the media `ended` event here — starts the cancellable countdown. */
    onEnded: () => void
    /** Navigate now (the overlay's primary button). */
    go: () => void
    /** Hide the button AND cancel the auto-advance for this video ("Ở lại"). */
    dismiss: () => void
}

/**
 * "Up next" decision logic for the lesson video: arm a hand-off button during the last
 * {@link UP_NEXT_WINDOW_SECONDS} seconds, then auto-advance a short, cancellable
 * {@link UP_NEXT_COUNTDOWN_SECONDS} countdown after the video ends.
 *
 * Deliberately headless so both player branches (HLS `<video>` and the YouTube IFrame
 * API poll) share ONE implementation — they only differ in how they produce
 * `currentTime` / `duration`.
 *
 * Guarantees the surrounding UI relies on:
 *  - **Never fires on a cut-off preview** — `disabled` makes every entry point a no-op.
 *  - **Never fires without a destination** — the last lesson with no challenge shows nothing.
 *  - **Seeking backwards disarms** — arming is recomputed from `duration - currentTime` on
 *    every tick, so leaving the window hides the button again.
 *  - **Dismiss is final for this video** — it cancels the countdown and latches, so a
 *    learner re-watching the ending is never yanked away.
 *  - **Navigates at most once** — guarded against a double `ended` and against React
 *    StrictMode running the countdown effect twice.
 */
export const useLessonUpNext = ({
    destination,
    disabled = false,
    onNavigate,
    resetKey,
}: UseLessonUpNextOptions): UseLessonUpNextResult => {
    const [isArmed, setIsArmed] = useState(false)
    const [countdown, setCountdown] = useState<number | null>(null)

    // Live values read inside the player callbacks. Refs (not deps) keep `onTimeUpdate` /
    // `onEnded` referentially stable — the YouTube player latches them into its own ref and
    // the HLS player calls them from a DOM handler, so neither wants a churning identity.
    const disabledRef = useRef(disabled)
    disabledRef.current = disabled
    const hrefRef = useRef<string | null>(destination?.href ?? null)
    hrefRef.current = destination?.href ?? null
    const navigateRef = useRef(onNavigate)
    navigateRef.current = onNavigate

    /** Learner pressed "Ở lại" — latched for the rest of this video. */
    const dismissedRef = useRef(false)
    /** `ended` already handled — a second event (or a pause→ended pair) must not re-fire. */
    const endedRef = useRef(false)
    /** Route already pushed — the one-navigation guard (also covers a StrictMode double effect). */
    const navigatedRef = useRef(false)

    /** Everything is off unless there is a destination, we're enabled, and nobody dismissed. */
    const isLive = useCallback(
        () => !disabledRef.current && !!hrefRef.current && !dismissedRef.current,
        [],
    )

    const onTimeUpdate = useCallback((currentTime: number, duration?: number) => {
        if (!isLive()) {
            setIsArmed(false)
            return
        }
        // No duration (metadata not in yet) or a clip too short for a "last 10s" to mean
        // anything → stay disarmed rather than showing the button over the whole video.
        if (
            duration === undefined ||
            !Number.isFinite(duration) ||
            duration <= UP_NEXT_MIN_DURATION_SECONDS
        ) {
            setIsArmed(false)
            return
        }
        const remaining = duration - currentTime
        setIsArmed(remaining >= 0 && remaining <= UP_NEXT_WINDOW_SECONDS)
    }, [isLive])

    const navigate = useCallback(() => {
        if (navigatedRef.current || !isLive()) return
        const href = hrefRef.current
        if (!href) return
        navigatedRef.current = true
        setCountdown(null)
        setIsArmed(false)
        navigateRef.current(href)
    }, [isLive])

    const onEnded = useCallback(() => {
        // A browser can emit `ended` more than once (and StrictMode re-runs handlers) —
        // the countdown must start exactly once per video.
        if (endedRef.current || !isLive()) return
        endedRef.current = true
        setIsArmed(true)
        setCountdown(UP_NEXT_COUNTDOWN_SECONDS)
    }, [isLive])

    const dismiss = useCallback(() => {
        dismissedRef.current = true
        setCountdown(null)
        setIsArmed(false)
    }, [])

    // Countdown ticker. Reaching 0 navigates; `dismiss` clears `countdown`, which unmounts
    // this timer, so the auto-advance really is cancellable (not merely hidden).
    useEffect(() => {
        if (countdown === null) return
        if (countdown <= 0) {
            navigate()
            return
        }
        const timer = window.setTimeout(() => {
            setCountdown((value) => (value === null ? null : value - 1))
        }, 1000)
        return () => window.clearTimeout(timer)
    }, [countdown, navigate])

    // New lesson → a brand new video: forget the dismissal and the fired/navigated guards.
    useEffect(() => {
        dismissedRef.current = false
        endedRef.current = false
        navigatedRef.current = false
        setIsArmed(false)
        setCountdown(null)
    }, [resetKey])

    // The stream resolves AFTER mount, so `disabled` can flip to true (PREVIEW / gated)
    // while the button is already up — take it down immediately, don't wait for a tick.
    useEffect(() => {
        if (disabled || !destination) {
            setIsArmed(false)
            setCountdown(null)
        }
    }, [disabled, destination])

    return {
        // Final render-time gate, so a stale `isArmed` can never outlive its destination.
        isArmed: isArmed && !disabled && !!destination,
        countdown,
        onTimeUpdate,
        onEnded,
        go: navigate,
        dismiss,
    }
}
