"use client"

import React from "react"
import { ArrowRightIcon, CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react"
import { Chip, Link, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { MediaCard } from "@/components/blocks/cards/MediaCard"
import { useCarousel } from "@/components/blocks/carousel/useCarousel"
import { ACHIEVEMENTS } from "../content"
import type { AchievementStat } from "../content"

/** Slower than the course hero — each card carries a title plus a two-line description. */
const ACHIEVEMENT_INTERVAL_MS = 4_500

/**
 * One milestone slide: the real event photo with the year badge on it, the localized
 * title, a rank chip for ranked recognitions, a clamped description and — when public
 * evidence exists — a "Xem chi tiết" link out to the original post.
 */
const AchievementSlide = ({ item }: { item: AchievementStat }) => {
    const t = useTranslations("homeLanding")
    const title = t(`achievements.items.${item.key}.title`)

    return (
        <MediaCard
            // one card on phones, two from sm, three per viewport from lg — matching the
            // legacy slider's 1 → 2 → 3 responsive breakpoints (gap-3 = 0.75rem)
            className="w-[17rem] shrink-0 snap-start sm:w-[calc(50%-0.375rem)] lg:w-[calc(33.333%-0.5rem)]"
            cover={
                <div className="relative w-full">
                    {/* rounded-xl on the <img> itself: the HeroUI card pads its body (p-4) so the
                        cover is INSET rather than bleeding to the card edge — without its own
                        radius all four corners read square inside the rounded card. Radius stays
                        here, not on MediaCard/globals, so other covers are untouched. */}
                    <img
                        src={item.imageSrc}
                        alt={title}
                        loading="lazy"
                        className="aspect-video w-full rounded-xl object-cover"
                    />
                    {/* year badge sits ON the photo (legacy slider idiom), accent instead of
                        the legacy red so it stays inside the AOS palette */}
                    <Chip size="sm" className="absolute bottom-3 left-3 bg-accent text-accent-foreground">
                        <Chip.Label>{item.year}</Chip.Label>
                    </Chip>
                </div>
            }
            meta={
                // highlight printed verbatim — never an animated counter
                item.value ? (
                    <Chip size="sm" variant="soft" color="accent">
                        <Chip.Label>{item.value}</Chip.Label>
                    </Chip>
                ) : null
            }
            title={title}
            description={t(`achievements.items.${item.key}.description`)}
            footer={
                item.href ? (
                    <Link
                        href={item.href}
                        target="_blank"
                        rel="noopener"
                        className="inline-flex items-center gap-2 text-sm text-accent"
                    >
                        {t("achievements.viewDetail")}
                        <ArrowRightIcon aria-hidden focusable="false" className="size-4" />
                    </Link>
                ) : null
            }
        />
    )
}

/**
 * "Thành tựu" — FTES's real company milestones (awards, competition placements,
 * scholarships and public events ported from the legacy home), now a CAROUSEL of
 * milestone cards with the actual event PHOTOS and a link out to the original public
 * post, so every claim is verifiable instead of being a bare number tile.
 *
 * Built on the shared {@link useCarousel} hook (native CSS scroll-snap, NO carousel
 * dependency — the legacy home's react-slick is deliberately not ported): fixed-width
 * cards so several show per viewport (shelf-style, like `CategoryShelf`) while autoplay
 * (~4.5s) wraps around and pauses on hover / focus-within / hidden tab and under
 * `prefers-reduced-motion`. Still purely static content (no BE), keeps the neighbouring
 * section rhythm (`max-w-6xl` · `py-16` · centered `mb-10` heading), and is careful not
 * to duplicate the live course/enrollment counters (PlatformStatsSection) or the
 * per-learner "Bảng vàng" (HonorBoardSection). ARIA follows the WAI-ARIA carousel
 * pattern (labeled region, labeled controls, ArrowLeft/ArrowRight on the region).
 */
export const AchievementsSection = () => {
    const t = useTranslations("homeLanding")
    const slideCount = ACHIEVEMENTS.length
    const { trackRef, next, prev, pauseHandlers } = useCarousel(slideCount, {
        intervalMs: ACHIEVEMENT_INTERVAL_MS,
    })
    const hasMultiple = slideCount > 1

    return (
        <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
            <div className="mb-10 flex flex-col items-center gap-2 text-center">
                <Typography type="body-sm" color="muted">
                    {t("achievements.eyebrow")}
                </Typography>
                <Typography type="h3" weight="bold">
                    {t("achievements.title")}
                </Typography>
            </div>

            <div
                role="region"
                aria-roledescription="carousel"
                aria-label={t("achievements.regionLabel")}
                onKeyDown={(event) => {
                    if (!hasMultiple) return
                    if (event.key === "ArrowRight") {
                        event.preventDefault()
                        next()
                    } else if (event.key === "ArrowLeft") {
                        event.preventDefault()
                        prev()
                    }
                }}
                {...pauseHandlers}
                className="relative"
            >
                <div
                    ref={trackRef}
                    className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                    {ACHIEVEMENTS.map((item) => (
                        <AchievementSlide key={item.key} item={item} />
                    ))}
                </div>

                {/* arrows flank the track (legacy slider idiom) instead of sitting under it,
                    vertically centered on the cover strip and hidden on phones where the
                    native swipe is the primary gesture */}
                {hasMultiple ? (
                    <>
                        <button
                            type="button"
                            aria-label={t("achievements.prev")}
                            onClick={prev}
                            className="absolute -left-3 top-1/2 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-separator bg-surface text-foreground shadow-md transition hover:bg-default sm:flex"
                        >
                            <CaretLeftIcon className="size-5" aria-hidden focusable="false" />
                        </button>
                        <button
                            type="button"
                            aria-label={t("achievements.next")}
                            onClick={next}
                            className="absolute -right-3 top-1/2 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-separator bg-surface text-foreground shadow-md transition hover:bg-default sm:flex"
                        >
                            <CaretRightIcon className="size-5" aria-hidden focusable="false" />
                        </button>
                    </>
                ) : null}
            </div>
        </section>
    )
}
