"use client"

import React from "react"
import { Typography, cn } from "@heroui/react"
import type { ReactNode } from "react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** One selectable recall grade in a {@link RatingBar}. */
export interface RatingOption {
    /** SM-2 grade value reported to {@link RatingBarProps.onRate} (0=Again … 3=Easy). */
    grade: number
    /** Localized button label (resolved by the caller — blocks carry no i18n). */
    label: ReactNode
    /** Optional secondary line under the label (e.g. the next-interval preview). */
    hint?: ReactNode
}

/** Props for the {@link RatingBar} block. */
export interface RatingBarProps extends WithClassNames<undefined> {
    /** Ordered grades to offer, weakest recall first (Again → Easy). */
    options: Array<RatingOption>
    /** Called with the chosen grade. */
    onRate: (grade: number) => void
    /** Disables every button while a review is in flight. */
    isPending?: boolean
}

/**
 * Soft-tint per recall grade — ONE consistent treatment (every button is a
 * `bg-token/10 text-token` tile) across a weakest→strongest semantic ramp
 * (danger → warning → success → accent). Reads as a 4-step scale, not four
 * mismatched button variants. Plain `<button>` (not HeroUI `Button`, whose
 * unlayered variant bg would override the tint), so the block owns the look.
 */
const GRADE_TINT: Record<number, string> = {
    0: "bg-danger/10 text-danger hover:bg-danger/20",
    1: "bg-warning/10 text-warning hover:bg-warning/20",
    2: "bg-success/10 text-success hover:bg-success/20",
    3: "bg-accent/10 text-accent hover:bg-accent/20",
}

/**
 * The SM-2 recall-rating bar: a row of FOUR equal-width grade tiles (Again / Hard
 * / Good / Easy) the learner taps after revealing a flashcard's answer. Each press
 * reports its grade so the caller can reschedule the card. All tiles share one
 * soft-tint treatment across a red→green semantic ramp + carry an optional
 * next-interval preview; labels arrive localized from the caller.
 *
 * @param props - {@link RatingBarProps}
 */
export const RatingBar = ({ options, onRate, isPending = false, className }: RatingBarProps) => {
    return (
        <div className={cn("grid grid-cols-2 gap-2 sm:grid-cols-4", className)}>
            {options.map((option) => (
                <button
                    key={option.grade}
                    type="button"
                    disabled={isPending}
                    onClick={() => onRate(option.grade)}
                    className={cn(
                        "flex w-full flex-col items-center justify-center gap-0.5 rounded-3xl px-3 py-2.5",
                        "cursor-pointer text-sm font-medium outline-none transition-colors",
                        "focus-visible:ring-2 focus-visible:ring-accent",
                        "disabled:cursor-not-allowed disabled:opacity-60",
                        GRADE_TINT[option.grade] ?? "bg-default text-foreground hover:bg-default/80",
                    )}
                >
                    <span>{option.label}</span>
                    {option.hint !== undefined ? (
                        <Typography type="body-xs" className="opacity-80">
                            {option.hint}
                        </Typography>
                    ) : null}
                </button>
            ))}
        </div>
    )
}
