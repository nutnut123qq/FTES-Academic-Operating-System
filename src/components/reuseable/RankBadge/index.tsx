"use client"

import React from "react"
import {
    cn,
} from "@heroui/react"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"

/** Props for {@link RankBadge}. */
export interface RankBadgeProps extends WithClassNames<undefined> {
    /** Display label for the rank (already localised, e.g. "Senior"). */
    label: string
    /** Hex colour encoding the rank tier (grey → bronze → silver → gold). */
    color: string
}

/**
 * Seniority rank pill — a coloured dot + the rank label (Beginner → Senior),
 * tinted by the rank's tier colour. Presentational: the caller resolves the
 * user's rank → `{ label, color }` (e.g. via `getRank`) and passes it in.
 *
 * NO border: a soft 10%-tint fill of the rank colour with the dot + label in the
 * full colour (a chip is one colour family, not an outline). `color` is a runtime
 * hex, so the fill uses `color-mix(... 10%, transparent)` (format-agnostic) — the
 * inline-style equivalent of `bg-[color]/10`.
 *
 * @param props - {@link RankBadgeProps}
 */
export const RankBadge = ({
    label,
    color,
    className,
}: RankBadgeProps) => {
    return (
        <span
            className={cn(
                "inline-flex w-fit items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
                className,
            )}
            style={{
                backgroundColor: `color-mix(in srgb, ${color} 10%, transparent)`,
                color,
            }}
        >
            <span
                className="size-2 rounded-full"
                style={{
                    backgroundColor: color,
                }}
            />
            {label}
        </span>
    )
}
