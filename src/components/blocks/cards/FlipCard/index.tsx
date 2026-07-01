"use client"

import React from "react"
import { cn } from "@heroui/react"
import { motion } from "framer-motion"
import type { ReactNode } from "react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for the {@link FlipCard} block. */
export interface FlipCardProps extends WithClassNames<undefined> {
    /** Whether the back (answer) face is currently shown. */
    revealed: boolean
    /** Toggle between the front and back faces (click / Enter / Space). */
    onToggle: () => void
    /** Accessible label for the flip toggle (e.g. "Show answer" / "Show question"). */
    ariaLabel: string
    /** Front (prompt) face content — composed by the caller; centered in the card. */
    front: ReactNode
    /** Back (answer) face content — composed by the caller; top-aligned + scrolls. */
    back: ReactNode
    /** Optional affordance pill pinned at the bottom of the front face. */
    frontHint?: ReactNode
    /** Optional affordance pill pinned at the bottom of the back face. */
    backHint?: ReactNode
}

/** Shared face shell: a bounded surface card at a FIXED height so both faces are
 * the same size — the card never grows to the taller face (which left a short
 * question stranded in a tall, mostly-empty card). */
const FACE_CLASS =
    "relative flex h-80 flex-col overflow-hidden rounded-2xl border border-default bg-surface sm:h-[22rem]"
/** Keeps both faces stacked in the same grid cell + hides the away-facing side. */
const FACE_STYLE: React.CSSProperties = {
    gridArea: "1 / 1",
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
}

/** The scrollable body of a face. Front centers its (usually short) prompt; back
 * top-aligns its (often long, code-heavy) answer and scrolls. */
const bodyClass = (centered: boolean) =>
    cn(
        "flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-6",
        centered && "items-center justify-center text-center",
    )

/** One face: a scrollable body with an optional affordance pill pinned below it. */
const Face = ({
    centered,
    children,
    hint,
    style,
}: {
    centered: boolean
    children: ReactNode
    hint?: ReactNode
    style: React.CSSProperties
}) => (
    <div className={FACE_CLASS} style={style}>
        <div className={bodyClass(centered)}>{children}</div>
        {hint ? (
            <div className="flex shrink-0 justify-center px-6 pb-4">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-default px-3 py-1.5 text-xs text-muted">
                    {hint}
                </span>
            </div>
        ) : null}
    </div>
)

/**
 * A two-faced flip card with a real 3D rotateY animation. Clicking (or pressing
 * Enter/Space) flips between the {@link FlipCardProps.front} prompt and the
 * {@link FlipCardProps.back} answer. Both faces share ONE grid cell at a FIXED
 * height, so the card is stable across the flip and a short prompt sits centered
 * (never stranded in a card sized to a long answer); the back scrolls when its
 * content overflows. Owns the whole flip look so features just pass the two
 * faces' content (per the no-style-in-features rule).
 *
 * @param props - {@link FlipCardProps}
 */
export const FlipCard = ({
    revealed,
    onToggle,
    ariaLabel,
    front,
    back,
    frontHint,
    backHint,
    className,
}: FlipCardProps) => {
    return (
        <div
            role="button"
            tabIndex={0}
            aria-label={ariaLabel}
            onClick={onToggle}
            onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    onToggle()
                }
            }}
            className={cn("cursor-pointer select-none [perspective:1600px]", className)}
        >
            <motion.div
                initial={false}
                animate={{ rotateY: revealed ? 180 : 0 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                style={{ transformStyle: "preserve-3d" }}
                className="grid"
            >
                {/* front: prompt, centered */}
                <Face centered hint={frontHint} style={FACE_STYLE}>
                    {front}
                </Face>
                {/* back: answer, top-aligned + scrolls; pre-rotated to read upright */}
                <Face
                    centered={false}
                    hint={backHint}
                    style={{ ...FACE_STYLE, transform: "rotateY(180deg)" }}
                >
                    {back}
                </Face>
            </motion.div>
        </div>
    )
}
