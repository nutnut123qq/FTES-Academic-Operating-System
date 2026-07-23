"use client"

import React, { useLayoutEffect, useRef } from "react"
import { cn } from "@heroui/react"

/**
 * Inline-edit primitives for the on-screen A4 page.
 *
 * ★ INTENTIONAL HOUSE EXCEPTION to "text inputs = HeroUI `TextField`/`Input`":
 * these fields must blend INTO the rendered résumé (transparent background,
 * inheriting the CV font family / size / colour) so the A4 the user edits IS the
 * A4 that exports. A HeroUI `Input` carries its own field chrome (border, bg,
 * padding) which would break the "edit the page in place" illusion. This is the
 * SAME class of exception already documented for the AI-chat composer flat input
 * (see `.claude/rules/drafts/ai-chat-composer-box-controls-and-settings-modal.md`).
 * The exception is scoped to the A4 surface only — standalone fields elsewhere
 * (the design toolbar, etc.) still use house primitives.
 *
 * Every field REQUIRES an `aria-label` because there is no visible `<label>` on
 * the page — the surrounding résumé text is the only visual affordance.
 */

/**
 * Shared flat-field look: transparent, inherits type, subtle focus affordance.
 *
 * The focus treatment uses the house `accent` token (`ring-accent`, matching
 * `SegmentedControl`/`PressableCard`); the placeholder is pinned to an explicit
 * print-ink tint (`text-[#6b6b6b]`, ≈5.3:1 on white) rather than a theme token,
 * because the A4 paper is ALWAYS white regardless of the app's light/dark theme —
 * a `text-muted`/`foreground-N` token would flip light and vanish on the page.
 */
const FLAT_CLASS =
    "w-full min-w-0 rounded-sm bg-transparent px-0.5 outline-none transition-colors " +
    "placeholder:text-[#6b6b6b] focus:bg-accent/5 " +
    "focus:ring-2 focus:ring-accent/70"

export interface InlineTextProps {
    value: string
    onChange: (value: string) => void
    /** Required — the field has no visible label on the A4 page. */
    ariaLabel: string
    placeholder?: string
    /** Inline style so the field inherits the live density/accent typography. */
    style?: React.CSSProperties
    className?: string
    /** Flag an invalid required field (name / email). */
    invalid?: boolean
    /** Id of an error message describing an invalid field (for `aria-describedby`). */
    describedBy?: string
    type?: "text" | "email"
    align?: "left" | "center"
}

/** A single-line inline field that reads as plain résumé text until focused. */
export const InlineText = ({
    value,
    onChange,
    ariaLabel,
    placeholder,
    style,
    className,
    invalid,
    describedBy,
    type = "text",
    align = "left",
}: InlineTextProps) => (
    <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? describedBy : undefined}
        spellCheck={false}
        className={cn(
            FLAT_CLASS,
            align === "center" && "text-center",
            invalid && "ring-1 ring-danger focus:ring-danger",
            className,
        )}
        style={style}
    />
)

export interface InlineTextAreaProps {
    value: string
    onChange: (value: string) => void
    /** Required — the field has no visible label on the A4 page. */
    ariaLabel: string
    placeholder?: string
    style?: React.CSSProperties
    className?: string
}

/**
 * An auto-growing inline textarea — used for the summary and each bullet line so
 * long text wraps and the box grows with content instead of scrolling.
 */
export const InlineTextArea = ({
    value,
    onChange,
    ariaLabel,
    placeholder,
    style,
    className,
}: InlineTextAreaProps) => {
    const ref = useRef<HTMLTextAreaElement>(null)

    // Auto-grow: reset then match scrollHeight. Runs after EVERY render (no dep
    // array) on purpose — the height must be re-measured not only when the value
    // changes but whenever the wrapping metrics do: the density knob rescales
    // fontSize/lineHeight and the font knob swaps the family, both of which reach
    // this textarea by INHERITANCE (not via its own style prop), so a value-only
    // dep would leave the imperative height stale and clip the tail under
    // `overflow-hidden`. Two style writes per render is cheap for a CV's fields.
    useLayoutEffect(() => {
        const node = ref.current
        if (!node) return
        node.style.height = "auto"
        node.style.height = `${node.scrollHeight}px`
    })

    return (
        <textarea
            ref={ref}
            rows={1}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            aria-label={ariaLabel}
            spellCheck={false}
            className={cn(FLAT_CLASS, "resize-none overflow-hidden leading-[inherit]", className)}
            style={style}
        />
    )
}
