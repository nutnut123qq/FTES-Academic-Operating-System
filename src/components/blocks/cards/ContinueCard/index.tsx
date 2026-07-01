"use client"

import React from "react"
import { Typography, cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { SectionCard } from "@/components/reuseable/SectionCard"
import { ProgressMeter } from "@/components/blocks/stats/ProgressMeter"

/**
 * Props for the {@link ContinueCard} block.
 *
 * A presentational, props-only card that lets the caller surface a single
 * "continue where you left off" item — a course, module, or lesson — with
 * a progress bar and an optional call-to-action label.
 *
 * All interactivity is delivered by the caller via {@link onPress} or
 * {@link href}; the block itself performs no data fetching and reads no
 * global store.
 */
export interface ContinueCardProps extends WithClassNames<undefined> {
    /**
     * Optional media node rendered flush on the left of the info row — typically
     * a `<img>` thumbnail or course icon (renders shrink-0 so it never
     * compresses).
     */
    cover?: React.ReactNode
    /**
     * Primary label of the item being continued (course / module / lesson title).
     * Rendered via {@link Typography} weight="medium", truncated to one line.
     */
    title: React.ReactNode
    /**
     * Optional secondary label shown under the title — e.g. module name,
     * lesson number, or author. Rendered via {@link Typography} type="body-xs"
     * color="muted", truncated to one line.
     */
    subtitle?: React.ReactNode
    /**
     * Current progress value. Forwarded directly to {@link ProgressMeter}.
     * Should fall within `[0, max]`.
     */
    value: number
    /**
     * Maximum value representing 100 % completion. Defaults to `100`.
     * Forwarded to {@link ProgressMeter}.
     */
    max?: number
    /**
     * Optional call-to-action label rendered to the far right of the info row
     * (e.g. "Continue", "Resume"). Rendered via {@link Typography} type="body-sm"
     * with `text-accent` so it stands out as a navigational affordance.
     */
    ctaLabel?: React.ReactNode
    /**
     * Optional press handler. When provided the whole card is wrapped in a
     * `<button>` so the entire surface is one accessible tap target. Prefer
     * {@link href} for pure navigation.
     */
    onPress?: () => void
    /**
     * Optional destination URL. When provided the card is wrapped in an `<a>`
     * anchor — the whole surface becomes a single accessible link.
     * Takes priority over {@link onPress}.
     */
    href?: string
}

/**
 * ContinueCard renders a "pick up where you left off" surface inside a
 * {@link SectionCard} frame. It stacks:
 *
 * 1. An info row — `cover` (shrink-0) + a min-w-0 column with `title` (medium
 *    weight, truncated) and `subtitle` (body-xs muted, truncated) + `ctaLabel`
 *    pinned to the far right (body-sm, accent colour, shrink-0).
 * 2. A {@link ProgressMeter} spanning the full card width.
 *
 * Because HeroUI v3 {@link Card} / {@link SectionCard} is not pressable,
 * interactivity is delivered by wrapping the `<SectionCard>` in a real
 * `<a>` (for `href`) or `<button>` (for `onPress`).
 *
 * @param props - {@link ContinueCardProps}
 */
export const ContinueCard = ({
    cover,
    title,
    subtitle,
    value,
    max = 100,
    ctaLabel,
    onPress,
    href,
    className,
}: ContinueCardProps) => {
    const interactive = Boolean(onPress || href)

    const card = (
        <SectionCard
            className={cn("flex flex-col", !interactive && className)}
            contentClassName="flex flex-col gap-3"
        >
            {/* Info row: cover | text column | cta label */}
            <div className="flex items-center gap-3">
                {/* Cover thumbnail — shrink-0 so it never compresses */}
                {cover ? <div className="shrink-0">{cover}</div> : null}

                {/* Text column: title + subtitle — min-w-0 allows truncation */}
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <Typography weight="medium" truncate>
                        {title}
                    </Typography>
                    {subtitle ? (
                        <Typography type="body-xs" color="muted" truncate>
                            {subtitle}
                        </Typography>
                    ) : null}
                </div>

                {/* CTA label pinned to the right — accent colour, shrink-0 */}
                {ctaLabel ? (
                    <Typography
                        type="body-sm"
                        className="ml-auto shrink-0 text-accent"
                    >
                        {ctaLabel}
                    </Typography>
                ) : null}
            </div>

            {/* Progress bar spanning the full card width */}
            <ProgressMeter value={value} max={max} />
        </SectionCard>
    )

    if (href) {
        return (
            <a href={href} className={cn("block", className)}>
                {card}
            </a>
        )
    }
    if (onPress) {
        return (
            <button
                type="button"
                onClick={onPress}
                className={cn("block w-full text-left", className)}
            >
                {card}
            </button>
        )
    }
    return card
}
