"use client"

import React, { useState } from "react"
import { CaretRightIcon } from "@phosphor-icons/react"
import { Typography, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { ProgressMeter } from "@/components/blocks/stats/ProgressMeter"

/** Props for {@link ContinueCourseCard}. */
export interface ContinueCourseCardProps {
    /** Destination — the reader for an active course, the detail page for an expired one. */
    href: string
    /** Course cover URL; `null`/broken falls back to the branded gradient. */
    coverUrl?: string | null
    /** Course title — clamped to two lines. */
    title: string
    /** Completion percent 0..100. */
    completionPercent: number
    /** Term chip ("mở đến {date}" / "hết kỳ"), or `null` when the course has no term. */
    badge?: React.ReactNode
    /** Term expired → the CTA sells a re-purchase instead of resuming. */
    expired?: boolean
}

/**
 * A course the viewer is part-way through, as shown on the home "Tiếp tục học" band
 * and on `/courses/me`.
 *
 * DELIBERATELY NOT the catalog card: this mirrors `CatalogCourseCard`'s SHAPE (flat
 * `rounded-lg` frame, inset 16:9 cover one radius step tighter, branded gradient
 * behind a missing/broken cover, two-line title box, bottom-pinned CTA rule) so the
 * two grids read as one design system — but it imports nothing from it and shares no
 * code with it, so either surface can change without dragging the other along. What
 * it carries instead of the catalog's meta/description/mentor rows is the progress
 * story: percent complete, the meter, and the resume CTA.
 *
 * It replaced a `SectionCard`-based block whose 36px card radius and 24px cover
 * radius sat visibly apart from the 12px/9px pair used everywhere else.
 *
 * @param props - {@link ContinueCourseCardProps}
 */
export const ContinueCourseCard = ({
    href,
    coverUrl,
    title,
    completionPercent,
    badge,
    expired,
}: ContinueCourseCardProps) => {
    const t = useTranslations()
    // A cover that 404s falls back to the gradient rather than a broken-image glyph.
    const [coverFailed, setCoverFailed] = useState(false)

    return (
        <Link
            href={href}
            // h-full is baked in (not left to the caller) so a card always fills its grid
            // cell — neighbours in a row share one height instead of staggering.
            className="group flex h-full flex-col rounded-lg border border-separator p-3 no-underline transition-colors hover:bg-default/40"
        >
            {/* cover 16:9 — inset by the card padding, one radius step tighter than the
                card, with the branded gradient underneath so a cover-less course shows a
                branded block rather than an empty grey panel. */}
            <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-md">
                <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-br from-accent/40 via-accent/20 to-accent/5"
                />
                {coverUrl && !coverFailed ? (
                    // plain <img>: the cover comes from the BE image-delivery host, so this
                    // needs no `next.config` remotePatterns entry (mirrors CoverImage).
                    <img
                        src={coverUrl}
                        alt={title}
                        loading="lazy"
                        onError={() => setCoverFailed(true)}
                        className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                ) : null}
            </div>

            <div className="flex flex-1 flex-col gap-1.5 pt-3">
                {/* Fixed two-line title box (min-h-14 = 2 × the `body` line height) so every
                    card in a row starts its progress block at the same y — a one-line title
                    used to pull the stack up and stagger its neighbours. */}
                <div className="flex min-h-14 items-start">
                    <Typography weight="semibold" className="line-clamp-2">
                        {title}
                    </Typography>
                </div>

                {badge ? <div className="flex">{badge}</div> : null}

                <Typography type="body-xs" color="muted">
                    {t("courses.percentComplete", { percent: completionPercent })}
                </Typography>
                <ProgressMeter value={completionPercent} max={100} />

                {/* footer: the resume cue, pinned to the bottom by mt-auto so the optional
                    term chip above absorbs the slack and the rule sits at the same offset
                    on every card. Mirrors the catalog card's footer treatment. */}
                <div className="mt-auto flex items-center justify-end border-t border-separator pt-2">
                    <span
                        className={cn(
                            "inline-flex shrink-0 items-center gap-1 text-sm font-medium",
                            expired ? "text-warning" : "text-accent",
                        )}
                    >
                        {expired ? t("courses.rebuy") : t("courses.continueLearning")}
                        <CaretRightIcon
                            aria-hidden
                            focusable="false"
                            className="size-4 transition-transform group-hover:translate-x-0.5"
                        />
                    </span>
                </div>
            </div>
        </Link>
    )
}
