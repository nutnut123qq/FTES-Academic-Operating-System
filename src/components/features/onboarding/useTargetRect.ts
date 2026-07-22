"use client"

import { useEffect, useState } from "react"

/** A plain, serializable viewport rectangle (subset of `DOMRect`). */
export interface TargetRect {
    top: number
    left: number
    width: number
    height: number
}

/** How long to wait for a not-yet-mounted target before skipping. */
const RESOLVE_TIMEOUT_MS = 1500
/**
 * Grace for a target that EXISTS in the DOM but is hidden (0-size) — e.g. the
 * desktop header nav under `md`. Shorter than the mount timeout: a present-but-
 * hidden anchor will not become visible on this viewport, so skip it quickly (a
 * small grace still covers an anchor mid enter-animation).
 */
const HIDDEN_GRACE_MS = 400
/** Poll interval while waiting for the target. */
const POLL_MS = 100

/** Resolution status of a `data-tour` anchor on the current viewport. */
type Resolution =
    | { status: "visible"; el: HTMLElement }
    | { status: "hidden" }
    | { status: "absent" }

/** Resolve the element carrying `data-tour="<target>"` and whether it is visible. */
const resolveTarget = (target: string): Resolution => {
    const el = document.querySelector<HTMLElement>(`[data-tour="${CSS.escape(target)}"]`)
    if (!el) return { status: "absent" }
    const rect = el.getBoundingClientRect()
    // 0-size = present but hidden (display:none ancestor, e.g. header nav on mobile).
    if (rect.width <= 0 || rect.height <= 0) return { status: "hidden" }
    return { status: "visible", el }
}

const toRect = (el: HTMLElement): TargetRect => {
    const r = el.getBoundingClientRect()
    return { top: r.top, left: r.left, width: r.width, height: r.height }
}

/**
 * Track the viewport rect of the element a tour step points at.
 *
 * - No `target` (centered step) → returns `null` and never reports missing.
 * - Target found → scrolls it into view ONCE, returns its live rect, and keeps
 *   the rect fresh on scroll/resize (without re-scrolling, so the user stays in
 *   control) so the spotlight tracks the element.
 * - Target absent/hidden for {@link RESOLVE_TIMEOUT_MS} → calls `onMissing` so the
 *   provider can advance to the next step instead of getting stuck.
 *
 * `stepKey` is included so the hook re-resolves from scratch on every step. Pass
 * a STABLE `onMissing` (memoized) to avoid needless re-runs.
 */
export const useTargetRect = (
    target: string | undefined,
    stepKey: string,
    onMissing: () => void,
): TargetRect | null => {
    const [rect, setRect] = useState<TargetRect | null>(null)

    useEffect(() => {
        if (!target) {
            setRect(null)
            return
        }

        let cancelled = false
        let pollTimer = 0
        let resolved: HTMLElement | null = null
        const startedAt = Date.now()

        // Re-read the resolved element's rect WITHOUT scrolling (reposition path).
        const reposition = () => {
            if (resolved) setRect(toRect(resolved))
        }

        // Try to resolve the target; scroll into view + record rect on first hit.
        const attempt = () => {
            if (cancelled) return
            const found = resolveTarget(target)
            if (found.status === "visible") {
                resolved = found.el
                found.el.scrollIntoView({ block: "center", inline: "center", behavior: "auto" })
                setRect(toRect(found.el))
                window.addEventListener("resize", reposition)
                window.addEventListener("scroll", reposition, true)
                return
            }
            // present-but-hidden → give it a short grace then skip (won't show here);
            // completely absent → wait the full mount timeout (it may render soon).
            const deadline = found.status === "hidden" ? HIDDEN_GRACE_MS : RESOLVE_TIMEOUT_MS
            if (Date.now() - startedAt > deadline) {
                onMissing()
                return
            }
            pollTimer = window.setTimeout(attempt, POLL_MS)
        }

        attempt()

        return () => {
            cancelled = true
            window.clearTimeout(pollTimer)
            window.removeEventListener("resize", reposition)
            window.removeEventListener("scroll", reposition, true)
        }
    }, [target, stepKey, onMissing])

    return rect
}
