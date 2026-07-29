"use client"

import React, { useState } from "react"
import Image from "next/image"
import { Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import type { FeaturedCourse } from "../../../hooks/useQueryFeaturedCoursesSwr"

/** Props for one {@link FeaturedSlide} of the catalog hero slider. */
export interface FeaturedSlideProps {
    course: FeaturedCourse
    /** 0-based position of this slide. */
    index: number
    /** Total slide count (for the "i / N" slide label). */
    total: number
    /** Opens the course detail page (`/courses/[id]`) or the banner link. */
    onOpen: () => void
}

/** Neutral brand gradient painted when a banner carries no `theme`. */
const FALLBACK_THEME = "linear-gradient(135deg, #3F51B5 0%, #5C6BC0 60%, #7986CB 100%)"

/**
 * One slide of the featured hero, rebuilt to the classic Ftes split-card look: a
 * flex row on a solid `theme` background (verbatim CSS color/gradient, never
 * interpolated as HTML), the course cover on the LEFT and the merchandising copy on
 * the RIGHT (title + pitch + white-outline pill CTA → `onOpen`) — matching the legacy
 * FTES banner. On mobile it stacks to a column and the image is hidden. CTA wording is "view/enroll", never
 * "buy/VIP" (rule premium-unlock-is-enroll-not-vip). Text is explicit white — the
 * themed background is a locked dark surface, so theme tokens would flip illegibly.
 * ARIA: `role="group"` + `aria-roledescription="slide"` + "i / N" label per the
 * WAI-ARIA carousel pattern.
 */
export const FeaturedSlide = ({ course, index, total, onOpen }: FeaturedSlideProps) => {
    const t = useTranslations("courseSystem")
    // hide the mock cover if it 404s (offline) — the themed background takes over
    const [coverFailed, setCoverFailed] = useState(false)
    const showImage = !coverFailed && !!course.coverUrl

    return (
        <div
            role="group"
            aria-roledescription="slide"
            aria-label={`${t("featured.slideLabel", { index: index + 1, total })} — ${course.name}`}
            className="w-full shrink-0 snap-center px-2.5"
        >
            <div
                className="flex min-h-[300px] flex-col items-center gap-5 overflow-hidden rounded-[20px] p-[30px_35px] text-white md:flex-row-reverse"
                style={{ background: course.theme || FALLBACK_THEME }}
            >
                {/* RIGHT (desktop) — merchandising copy; flex-row-reverse puts the cover on the LEFT */}
                <div className="flex w-full flex-col gap-3 md:max-w-[50%]">
                    <Typography type="h4" weight="bold" className="text-white">
                        {course.name}
                    </Typography>
                    {course.pitch ? (
                        <Typography type="body-sm" className="line-clamp-3 text-white/85">
                            {course.pitch}
                        </Typography>
                    ) : null}
                    <button
                        type="button"
                        onClick={onOpen}
                        className="w-fit rounded-full border-2 border-white bg-transparent px-4 py-1 text-xs font-bold text-white transition-colors hover:bg-white/15"
                    >
                        {course.ctaLabel || t("slider.cta")}
                    </button>
                </div>

                {/* RIGHT — cover; hidden on mobile (flex-col drops the image) */}
                {showImage ? (
                    <div className="hidden shrink-0 items-center justify-center md:flex md:max-w-[45%]">
                        {/* ponytail: mock/remote cover — `unoptimized` skips the Next optimizer
                            so no remotePatterns config is needed; explicit dims keep aspect
                            while `max-h-[280px] w-auto` caps the rendered height. */}
                        <Image
                            src={course.coverUrl}
                            alt=""
                            width={480}
                            height={280}
                            unoptimized
                            className="max-h-[280px] w-auto object-contain"
                            onError={() => setCoverFailed(true)}
                        />
                    </div>
                ) : null}
            </div>
        </div>
    )
}
