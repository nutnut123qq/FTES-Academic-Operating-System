"use client"

import React, {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react"
import {
    usePathname,
    useSearchParams,
} from "next/navigation"

/** Delay before the bar actually paints — lets fast / prefetched navigations
 *  finish without a 1-frame flash (per Next's fast-navigation guidance). */
const SHOW_DELAY_MS = 120
/** How long the full bar lingers as it fades out. */
const FADE_MS = 260
/** Trickle tick cadence while the route is still loading. */
const TRICKLE_MS = 400
/** Hard ceiling — if a navigation never resolves (e.g. a same-page link), bail. */
const SAFETY_MS = 10_000

type TimeoutRef = React.MutableRefObject<ReturnType<typeof setTimeout> | null>

/**
 * TopLoader — a thin brand-pink line that slides across the very top of the
 * viewport on every in-app navigation, then fills to 100% and fades once the new
 * route is ready.
 *
 * No dependency and no router-event API (the App Router exposes none by design).
 * It detects navigation START by patching `history.pushState` + listening to
 * `popstate` — the App Router updates the URL optimistically at the start of a
 * push, so this fires early — and detects DONE via the `pathname` / `searchParams`
 * effect, which only updates once the new segment has committed. Progress is
 * indeterminate (a route has no real load events), so it trickles toward 90% and
 * snaps to 100% on completion — the proven nprogress / buildui pattern.
 *
 * Mounted once in {@link InnerLayout}, above the navbar (`z-[60]` > navbar's
 * `z-50`). Honours `prefers-reduced-motion` (no trickle — a static segment that
 * just appears, then clears). Owns all of its style; takes no props.
 */
export const TopLoader = () => {
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const [width, setWidth] = useState(0)
    const [visible, setVisible] = useState(false)

    /** A navigation is in flight (may not be painted yet during the show-delay). */
    const activeRef = useRef(false)
    /** The bar is actually on screen (passed the show-delay). */
    const shownRef = useRef(false)
    const reduceRef = useRef(false)
    const showTimer: TimeoutRef = useRef(null)
    const fadeTimer: TimeoutRef = useRef(null)
    const resetTimer: TimeoutRef = useRef(null)
    const safetyTimer: TimeoutRef = useRef(null)
    const trickleTimer = useRef<ReturnType<typeof setInterval> | null>(null)

    const clearTimer = useCallback((ref: TimeoutRef) => {
        if (ref.current) {
            clearTimeout(ref.current)
            ref.current = null
        }
    }, [])

    const stopTrickle = useCallback(() => {
        if (trickleTimer.current) {
            clearInterval(trickleTimer.current)
            trickleTimer.current = null
        }
    }, [])

    const complete = useCallback(() => {
        if (!activeRef.current) {
            return
        }
        activeRef.current = false
        clearTimer(showTimer)
        clearTimer(safetyTimer)
        stopTrickle()
        if (!shownRef.current) {
            // resolved before the bar ever appeared → nothing to animate out
            return
        }
        setWidth(100)
        fadeTimer.current = setTimeout(() => {
            setVisible(false)
            shownRef.current = false
            resetTimer.current = setTimeout(() => setWidth(0), FADE_MS)
        }, FADE_MS)
    }, [clearTimer, stopTrickle])

    const start = useCallback(() => {
        if (activeRef.current) {
            return
        }
        activeRef.current = true
        clearTimer(fadeTimer)
        clearTimer(resetTimer)
        showTimer.current = setTimeout(() => {
            shownRef.current = true
            setVisible(true)
            if (reduceRef.current) {
                setWidth(85)
                return
            }
            setWidth(8)
            trickleTimer.current = setInterval(() => {
                setWidth((current) => {
                    if (current >= 90) {
                        return current
                    }
                    const step = current < 40 ? 7 : current < 70 ? 3 : 1.2
                    return Math.min(90, current + step)
                })
            }, TRICKLE_MS)
        }, SHOW_DELAY_MS)
        safetyTimer.current = setTimeout(complete, SAFETY_MS)
    }, [clearTimer, complete])

    // Detect navigation START: patch the history API (the App Router pushes the URL
    // optimistically at the start of a navigation) + back / forward.
    useEffect(() => {
        reduceRef.current = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches
        const originalPush = window.history.pushState
        window.history.pushState = function patchedPush(
            this: History,
            ...args: Parameters<History["pushState"]>
        ) {
            start()
            return originalPush.apply(this, args)
        }
        // router.replace is mostly shallow (filter params) — leave those silent;
        // only a real pushState route change + popstate trigger the loader.
        const onPopState = () => start()
        window.addEventListener("popstate", onPopState)
        return () => {
            window.history.pushState = originalPush
            window.removeEventListener("popstate", onPopState)
        }
    }, [start])

    // Detect navigation DONE: the new segment has committed once pathname / search
    // change. (First mount fires here too → complete() no-ops while idle.)
    useEffect(() => {
        complete()
    }, [pathname, searchParams])

    // Tidy every timer on unmount.
    useEffect(
        () => () => {
            clearTimer(showTimer)
            clearTimer(fadeTimer)
            clearTimer(resetTimer)
            clearTimer(safetyTimer)
            stopTrickle()
        },
        [clearTimer, stopTrickle],
    )

    return (
        <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px]"
            style={{
                opacity: visible ? 1 : 0,
                transition: `opacity ${FADE_MS}ms ease`,
            }}
        >
            <div
                className="h-full bg-accent"
                style={{
                    width: `${width}%`,
                    transition: reduceRef.current ? "none" : "width 280ms ease",
                }}
            />
        </div>
    )
}
