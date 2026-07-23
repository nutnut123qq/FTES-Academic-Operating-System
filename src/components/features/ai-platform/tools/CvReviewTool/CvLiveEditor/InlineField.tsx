"use client"

import React, { useEffect, useRef } from "react"
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

/** Shared flat-field look: transparent, inherits type, subtle focus affordance. */
const FLAT_CLASS =
    "w-full min-w-0 rounded-sm bg-transparent px-0.5 outline-none transition-colors " +
    "placeholder:text-foreground-500/50 focus:bg-primary/5 " +
    "focus:ring-1 focus:ring-primary/40"

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

    // Auto-grow: reset then match scrollHeight whenever the value changes.
    useEffect(() => {
        const node = ref.current
        if (!node) return
        node.style.height = "auto"
        node.style.height = `${node.scrollHeight}px`
    }, [value])

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
