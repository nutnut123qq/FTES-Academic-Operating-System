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

/** Delay before the bar actually paints — a navigation that resolves inside this
 *  window shows NO bar at all. A bar that flashes on every instant navigation is
 *  what makes an app read as slow, so this is deliberately longer than a frame. */
const SHOW_DELAY_MS = 180
/** Where the bar lands the moment it appears — a head start, not a crawl from 0.
 *  Perceived speed comes from the first movement being big and quick. */
const HEAD_START_PERCENT = 45
/** How long the head-start / trickle ramp takes (the `width` transition). */
const RAMP_MS = 200
/** Trickle tick cadence while the route is still loading. */
const TRICKLE_MS = 250
/** The trickle never passes this — 100% is reserved for a real completion. */
const TRICKLE_CEILING = 92
/** Snap-to-100% duration once the route commits (shorter than the ramp: it's a finish). */
const FINISH_MS = 120
/** Fade-out duration once the bar has hit 100%. */
const FADE_MS = 150
/** Fade-IN duration — quick, so the bar doesn't dawdle into view. */
const APPEAR_MS = 90
/** Hard ceiling — last-resort bail-out if a navigation never commits. Same-URL and
 *  `#hash` pushes are filtered by {@link changesRoute} before they ever start. */
const SAFETY_MS = 10_000

type TimeoutRef = React.MutableRefObject<ReturnType<typeof setTimeout> | null>

/**
 * True when pushing `target` would change the pathname or the query — i.e. when the
 * loader has a completion signal to wait for. A same-URL push or a pure `#hash` jump
 * changes neither, so the bar must not start for those. Unparseable / absent targets
 * are treated as real navigations (fail towards showing progress, never towards a
 * bar that can't finish — the safety timeout still backs that up).
 */
const changesRoute = (target: string | URL | null | undefined): boolean => {
    if (target == null) {
        return true
    }
    try {
        const next = new URL(String(target), window.location.href)
        return (
            next.pathname !== window.location.pathname
            || next.search !== window.location.search
            || next.origin !== window.location.origin
        )
    } catch {
        return true
    }
}

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
 * indeterminate (a route has no real load events), so it jumps to a head start,
 * trickles toward {@link TRICKLE_CEILING} and snaps to 100% on completion — the
 * proven nprogress / buildui pattern.
 *
 * Tuned for PERCEIVED speed: nothing paints for {@link SHOW_DELAY_MS} (a fast
 * navigation shows no bar at all), the bar then lands at {@link HEAD_START_PERCENT}
 * in one quick move rather than crawling up from zero, and the finish is a short
 * snap + fade instead of a long linger.
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
    /** The route committed and the bar is snapping to 100% → use the short finish curve. */
    const [finishing, setFinishing] = useState(false)

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
        // snap to full on the short finish curve, hold just long enough to read as
        // "done", then fade. The reset back to 0 happens while already invisible.
        setFinishing(true)
        setWidth(100)
        fadeTimer.current = setTimeout(() => {
            setVisible(false)
            shownRef.current = false
            resetTimer.current = setTimeout(() => {
                setWidth(0)
                setFinishing(false)
            }, FADE_MS)
        }, FINISH_MS)
    }, [clearTimer, stopTrickle])

    const start = useCallback(() => {
        if (activeRef.current) {
            return
        }
        activeRef.current = true
        clearTimer(fadeTimer)
        clearTimer(resetTimer)
        // A previous run may still be finishing on screen (bar parked at 100%). Retract
        // it now instead of letting the new run visibly rewind 100% → head start.
        if (shownRef.current) {
            shownRef.current = false
            setVisible(false)
            setWidth(0)
        }
        setFinishing(false)
        showTimer.current = setTimeout(() => {
            shownRef.current = true
            setVisible(true)
            if (reduceRef.current) {
                setWidth(90)
                return
            }
            // one big first move, then a decelerating creep — the ramp is what sells
            // "already well underway" instead of "stuck at 8%".
            setWidth(HEAD_START_PERCENT)
            trickleTimer.current = setInterval(() => {
                setWidth((current) => {
                    if (current >= TRICKLE_CEILING) {
                        return current
                    }
                    const step = current < 70 ? 5 : current < 85 ? 2 : 0.6
                    return Math.min(TRICKLE_CEILING, current + step)
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
            // Only a push that actually changes pathname/search can be COMPLETED — done
            // is detected from `usePathname` / `useSearchParams`. Re-clicking the active
            // link, or jumping to an in-page `#hash`, leaves both untouched, so starting
            // there would park the bar at the trickle ceiling until the safety timeout —
            // the exact "stuck loading bar" that reads as a slow app. Skip those.
            if (changesRoute(args[2])) {
                start()
            }
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
                // in fast, out a touch slower — an eager appearance, an unobtrusive exit
                transition: `opacity ${visible ? APPEAR_MS : FADE_MS}ms ease`,
            }}
        >
            <div
                className="h-full bg-accent"
                style={{
                    width: `${width}%`,
                    // ease-OUT (fast first, settle late) on both curves: the movement the
                    // eye reads first is the fastest one.
                    transition: reduceRef.current
                        ? "none"
                        : `width ${finishing ? FINISH_MS : RAMP_MS}ms cubic-bezier(0, 0, 0.2, 1)`,
                }}
            />
        </div>
    )
}
