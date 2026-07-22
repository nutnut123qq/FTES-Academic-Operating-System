"use client"

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useTranslations } from "next-intl"
import { MascotCoachMark } from "./MascotCoachMark"
import { useTargetRect, type TargetRect } from "./useTargetRect"
import type { TourStep } from "./types"

/** Props for {@link SpotlightOverlay}. */
export interface SpotlightOverlayProps {
    /** Current step. */
    step: TourStep
    /** Zero-based index. */
    index: number
    /** Total steps. */
    total: number
    /** Advance / finish. */
    onNext: () => void
    /** Go back. */
    onPrev: () => void
    /** Skip (dismiss) the tour. */
    onSkip: () => void
    /** Called when the step's target never appears → provider skips the step. */
    onMissing: () => void
    /** Disable spotlight/coach transitions + mascot bob when true. */
    reducedMotion: boolean
}

/** Padding around the spotlighted rect (px). */
const SPOT_PAD = 8
/** Gap between the target and the coach-mark card (px). */
const COACH_GAP = 14
/** Keep the coach card this far from the viewport edges (px). */
const EDGE = 16
/** Dim scrim colour painted everywhere except the spotlight hole. */
const DIM = "rgba(11, 15, 46, 0.72)"

interface CoachPos {
    top: number
    left: number
    ready: boolean
}

/**
 * Compute where the coach card should sit: centered when there is no target;
 * otherwise below the target (flipped above when there is no room), left-aligned
 * to the target, and clamped inside the viewport. `placement` forces a side.
 */
const computeCoachPos = (
    rect: TargetRect | null,
    size: { width: number; height: number },
    placement: TourStep["placement"],
): { top: number; left: number } => {
    const vw = window.innerWidth
    const vh = window.innerHeight
    const { width: cw, height: ch } = size

    if (!rect) {
        return {
            top: Math.max(EDGE, (vh - ch) / 2),
            left: Math.max(EDGE, (vw - cw) / 2),
        }
    }

    const below = rect.top + rect.height + COACH_GAP
    const above = rect.top - COACH_GAP - ch
    const fitsBelow = below + ch + EDGE <= vh
    const mode = placement ?? "auto"

    let top: number
    if (mode === "top") top = above
    else if (mode === "bottom") top = below
    else top = fitsBelow ? below : above >= EDGE ? above : below

    top = Math.min(Math.max(top, EDGE), Math.max(EDGE, vh - ch - EDGE))
    const left = Math.min(Math.max(rect.left, EDGE), Math.max(EDGE, vw - cw - EDGE))
    return { top, left }
}

/**
 * The tour overlay: a full-screen click-blocking scrim with a rounded "hole"
 * lit over the current target (via a giant box-shadow), and the
 * {@link MascotCoachMark} card anchored beside it. Targetless steps dim the whole
 * screen and center the card.
 *
 * Rendered in a portal on `document.body`. Owns a11y: `role="dialog"`
 * `aria-modal`, focus moves into the card on each step, Esc skips, ←/→ and Enter
 * navigate. Under reduced motion all transitions are dropped (instant step
 * changes, no spotlight tween). See `openspec/changes/onboarding-mascot-guide`.
 */
export const SpotlightOverlay = ({
    step,
    index,
    total,
    onNext,
    onPrev,
    onSkip,
    onMissing,
    reducedMotion,
}: SpotlightOverlayProps) => {
    const t = useTranslations()
    const rect = useTargetRect(step.target, step.id, onMissing)
    const coachRef = useRef<HTMLDivElement>(null)
    const [pos, setPos] = useState<CoachPos>({ top: 0, left: 0, ready: false })
    // Skip is confirmed (spec/design 4): the first skip request (button or Esc)
    // opens a prompt inside the coach card; only confirming it ends the tour.
    const [confirmingSkip, setConfirmingSkip] = useState(false)

    // A step change (the overlay stays mounted across steps) always dismisses a
    // stale skip prompt so we never confirm-skip on the wrong step.
    useEffect(() => {
        setConfirmingSkip(false)
    }, [step.id])

    const requestSkip = useCallback(() => setConfirmingSkip(true), [])
    const cancelSkip = useCallback(() => setConfirmingSkip(false), [])

    // Measure the card, then place it (below/above target, or centered). Re-runs
    // on step change, when the tracked rect moves, and on resize.
    useLayoutEffect(() => {
        const place = () => {
            const el = coachRef.current
            if (!el) return
            const box = el.getBoundingClientRect()
            const next = computeCoachPos(rect, { width: box.width, height: box.height }, step.placement)
            setPos({ top: next.top, left: next.left, ready: true })
        }
        place()
        window.addEventListener("resize", place)
        return () => window.removeEventListener("resize", place)
    }, [rect, step.placement, step.id])

    // Move focus into the card when the step changes / the card first appears, and
    // when the skip prompt opens or closes (a11y: keep the keyboard on the tour, not
    // on the inert page behind the scrim, and re-announce the swapped card content).
    useEffect(() => {
        coachRef.current?.focus()
    }, [step.id, rect, confirmingSkip])

    // Keyboard: ←/→ + Enter navigate, Esc requests skip, Tab is trapped inside the
    // coach card. Ignore navigation keys while typing in a field.
    const onKeyDown = useCallback(
        (event: KeyboardEvent) => {
            // Focus trap (tasks 5.2): keep Tab / Shift+Tab cycling inside the coach
            // card so it can never land on a background control behind the scrim.
            if (event.key === "Tab") {
                const container = coachRef.current
                if (!container) return
                const focusables = Array.from(
                    container.querySelectorAll<HTMLElement>(
                        "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])",
                    ),
                ).filter((el) => el.offsetParent !== null)
                const active = document.activeElement as HTMLElement | null
                if (focusables.length === 0) {
                    event.preventDefault()
                    container.focus()
                    return
                }
                const first = focusables[0]
                const last = focusables[focusables.length - 1]
                if (active && !container.contains(active)) {
                    event.preventDefault()
                    ;(event.shiftKey ? last : first).focus()
                } else if (!event.shiftKey && (active === last || active === container)) {
                    event.preventDefault()
                    first.focus()
                } else if (event.shiftKey && (active === first || active === container)) {
                    event.preventDefault()
                    last.focus()
                }
                return
            }
            const node = event.target as HTMLElement | null
            const tag = node?.tagName
            if (event.key === "Escape") {
                event.preventDefault()
                // Esc gets the same friction as the Skip button: open the confirm,
                // and a second Esc backs out of it (never ends the tour outright).
                if (confirmingSkip) cancelSkip()
                else requestSkip()
                return
            }
            if (tag === "INPUT" || tag === "TEXTAREA" || node?.isContentEditable) return
            // While the skip prompt is open, arrows/Enter must not advance the tour.
            if (confirmingSkip) return
            if (event.key === "Enter") {
                // A focused Button fires its own onPress on Enter — don't double-advance;
                // only handle Enter when focus is on the (inert) card container.
                if (tag === "BUTTON") return
                event.preventDefault()
                onNext()
            } else if (event.key === "ArrowRight") {
                event.preventDefault()
                onNext()
            } else if (event.key === "ArrowLeft") {
                event.preventDefault()
                if (index > 0) onPrev()
            }
        },
        [onNext, onPrev, index, confirmingSkip, requestSkip, cancelSkip],
    )
    useEffect(() => {
        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [onKeyDown])

    if (typeof document === "undefined") return null

    const transition = reducedMotion ? undefined : "top 0.25s ease, left 0.25s ease, width 0.25s ease, height 0.25s ease"
    // A targeted step shows its card ONLY once the anchor is resolved, so a card
    // never flashes mis-placed while we wait (or on a viewport where it is skipped).
    // Targetless steps (welcome / celebration) always show their centered card.
    const showCard = !step.target || rect !== null

    return createPortal(
        <div
            role="dialog"
            aria-modal="true"
            aria-label={t("onboarding.dialogLabel")}
            className="fixed inset-0 z-[1000]"
        >
            {/* click-blocking scrim: TRANSPARENT (the dim is painted by the spotlight
                box-shadow below / the fallback panel) so the whole page is inert. */}
            <div className="absolute inset-0" aria-hidden="true" />

            {rect ? (
                // spotlight hole: a rounded rect whose huge box-shadow paints the dim
                // everywhere else. pointer-events none so the shadow does not swallow
                // the card; the transparent scrim above already blocks the page.
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute rounded-2xl"
                    style={{
                        top: rect.top - SPOT_PAD,
                        left: rect.left - SPOT_PAD,
                        width: rect.width + SPOT_PAD * 2,
                        height: rect.height + SPOT_PAD * 2,
                        boxShadow: `0 0 0 9999px ${DIM}`,
                        transition,
                    }}
                />
            ) : (
                // targetless step → dim the whole screen
                <div aria-hidden="true" className="absolute inset-0" style={{ background: DIM }} />
            )}

            {/* the coach card */}
            {showCard ? (
                <div
                    ref={coachRef}
                    tabIndex={-1}
                    className="absolute w-[min(360px,calc(100vw-2rem))] outline-none"
                    style={{
                        top: pos.top,
                        left: pos.left,
                        opacity: pos.ready ? 1 : 0,
                        transition: reducedMotion
                            ? undefined
                            : "opacity 0.2s ease, top 0.25s ease, left 0.25s ease",
                    }}
                >
                    <MascotCoachMark
                        step={step}
                        index={index}
                        total={total}
                        onNext={onNext}
                        onPrev={onPrev}
                        onSkip={requestSkip}
                        confirmingSkip={confirmingSkip}
                        onConfirmSkip={onSkip}
                        onCancelSkip={cancelSkip}
                        animated={!reducedMotion}
                    />
                </div>
            ) : null}
        </div>,
        document.body,
    )
}
