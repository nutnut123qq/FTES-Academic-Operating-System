"use client"

import React, { useState } from "react"
import Image from "next/image"
import { Button, Chip, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import type { FeaturedCourse } from "../../../hooks/useQueryFeaturedCoursesSwr"

/** Props for one {@link FeaturedSlide} of the catalog hero slider. */
export interface FeaturedSlideProps {
    course: FeaturedCourse
    /** 0-based position of this slide. */
    index: number
    /** Total slide count (for the "i / N" slide label). */
    total: number
    /** Opens the course detail page (`/courses/[id]`). */
    onOpen: () => void
}

/** House VND-primary price format (same shape as the PriceTag block). */
const formatVnd = (amount: number): string => `${amount.toLocaleString("vi-VN")}₫`

/**
 * One slide of the featured-courses hero: full-width cover (picsum mock behind a
 * brand-gradient fallback, so an offline 404 still looks intentional) with a
 * bottom-left dark overlay carrying code + title, level chip, VND price, pitch and
 * the CTA to the course detail page. CTA wording is "view/enroll", never "buy/VIP"
 * (rule premium-unlock-is-enroll-not-vip). Overlay text is explicit white — the
 * dark gradient is locked, so theme tokens would flip illegibly in light mode.
 * ARIA: `role="group"` + `aria-roledescription="slide"` + "i / N" label per the
 * WAI-ARIA carousel pattern.
 */
export const FeaturedSlide = ({ course, index, total, onOpen }: FeaturedSlideProps) => {
    const t = useTranslations("courseSystem")
    // hide the mock cover if it 404s (offline) — the gradient behind it takes over
    const [coverFailed, setCoverFailed] = useState(false)

    return (
        <div
            role="group"
            aria-roledescription="slide"
            aria-label={`${t("featured.slideLabel", { index: index + 1, total })} — ${course.name}`}
            className="relative w-full shrink-0 snap-center overflow-hidden rounded-2xl"
        >
            <div className="relative aspect-video w-full md:aspect-[21/9] md:max-h-96">
                {/* background behind the cover: the banner's own `theme` (a CSS color/gradient
                    string, rendered verbatim — never interpolated as HTML) when present, else a
                    neutral brand gradient. Degrades cleanly for banners without a theme. */}
                <div
                    aria-hidden
                    className={course.theme ? "absolute inset-0" : "absolute inset-0 bg-gradient-to-br from-accent/60 via-accent/30 to-accent/10"}
                    style={course.theme ? { background: course.theme } : undefined}
                />
                {coverFailed ? null : (
                    // ponytail: mock picsum cover — `unoptimized` skips the Next optimizer
                    // so no remotePatterns config is needed; swap for a configured domain
                    // (and drop `unoptimized`) when real covers land.
                    <Image
                        src={course.coverUrl}
                        alt=""
                        fill
                        unoptimized
                        className="object-cover"
                        onError={() => setCoverFailed(true)}
                    />
                )}

                {/* bottom-left overlay with the merchandising content */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4 pt-12 sm:p-6 sm:pt-12">
                    <div className="flex max-w-2xl flex-col gap-2">
                        {/* course-only meta (level + code) — absent on real banner slides */}
                        {course.code ? (
                            <div className="flex flex-wrap items-center gap-2">
                                <Chip size="sm" variant="soft" color="accent">
                                    {t(`levels.${course.level}`)}
                                </Chip>
                                <Typography type="body-xs" className="text-white/80">
                                    {course.code}
                                </Typography>
                            </div>
                        ) : null}
                        <Typography type="h5" weight="bold" className="text-white">
                            {course.name}
                        </Typography>
                        {course.pitch ? (
                            <Typography type="body-sm" className="line-clamp-2 text-white/80">
                                {course.pitch}
                            </Typography>
                        ) : null}
                        <div className="flex flex-wrap items-center gap-3">
                            {course.priceVnd > 0 ? (
                                <Typography type="body" weight="bold" className="text-white">
                                    {formatVnd(course.priceVnd)}
                                </Typography>
                            ) : null}
                            <Button size="sm" variant="primary" onPress={onOpen}>
                                {course.ctaLabel || t("slider.cta")}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
