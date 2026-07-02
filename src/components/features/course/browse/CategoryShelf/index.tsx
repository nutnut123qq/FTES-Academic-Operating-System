"use client"

import React, { useEffect, useState } from "react"
import { Button, Typography, cn } from "@heroui/react"
import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react"
import { useLocale, useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { useCarousel } from "../../CourseCatalog/FeaturedSlider/useCarousel"
import type { Course } from "../../hooks/useQueryCoursesSwr"
import { categoryName, type CourseCategory } from "../categories"
import { CatalogCourseCard } from "../CatalogCourseCard"

/** Props for {@link CategoryShelf}. */
export interface CategoryShelfProps extends WithClassNames<undefined> {
    /** The category this shelf presents. */
    category: CourseCategory
    /** The category's courses (callers hide the shelf when empty). */
    courses: Array<Course>
}

/**
 * One category shelf of the browse catalog: a section header (icon tile +
 * localized name + "Xem tất cả" link to `/courses/category/[slug]`) over a
 * horizontal scroll-snap carousel of {@link CatalogCourseCard}s, driven by the
 * shared {@link useCarousel} primitive with autoplay OFF (only the hero
 * autoplays; shelves are manual scroll/swipe only). Prev/next controls sit in
 * the header and are hidden while the track has no overflow.
 *
 * @param props - {@link CategoryShelfProps}
 */
export const CategoryShelf = ({ category, courses, className }: CategoryShelfProps) => {
    const t = useTranslations()
    const locale = useLocale()
    const name = categoryName(category, locale)
    const { trackRef, next, prev } = useCarousel(courses.length, { autoplay: false })
    // arrows only make sense when the cards actually overflow the track
    const [hasOverflow, setHasOverflow] = useState(false)

    useEffect(() => {
        const track = trackRef.current
        if (!track) return
        const measure = () => setHasOverflow(track.scrollWidth > track.clientWidth)
        measure()
        const observer = new ResizeObserver(measure)
        observer.observe(track)
        return () => observer.disconnect()
    }, [trackRef, courses.length])

    return (
        <section
            role="region"
            aria-roledescription="carousel"
            aria-label={name}
            className={cn("flex flex-col gap-3", className)}
        >
            {/* label row mirrors the LabeledCard idiom: icon (foreground, size-5) + title,
                actions pinned right */}
            <div className="flex items-center gap-3">
                <category.icon aria-hidden focusable="false" className="size-5 shrink-0" />
                <Typography type="h6" weight="semibold" className="min-w-0 flex-1" truncate>
                    {name}
                </Typography>
                {hasOverflow ? (
                    <div className="flex items-center gap-2">
                        <Button
                            isIconOnly
                            size="sm"
                            variant="secondary"
                            aria-label={t("courseSystem.browse.shelfPrev")}
                            onPress={prev}
                        >
                            <CaretLeftIcon aria-hidden focusable="false" className="size-4" />
                        </Button>
                        <Button
                            isIconOnly
                            size="sm"
                            variant="secondary"
                            aria-label={t("courseSystem.browse.shelfNext")}
                            onPress={next}
                        >
                            <CaretRightIcon aria-hidden focusable="false" className="size-4" />
                        </Button>
                    </div>
                ) : null}
                {/* see-more style link: accent + caret sliding right on hover */}
                <Link
                    href={`/courses/category/${category.slug}`}
                    className="group inline-flex shrink-0 items-center gap-2 text-sm text-accent no-underline"
                >
                    {t("courseSystem.browse.seeAll")}
                    <CaretRightIcon
                        aria-hidden
                        focusable="false"
                        className="size-4 transition-transform group-hover:translate-x-1"
                    />
                </Link>
            </div>

            <div
                ref={trackRef}
                className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                {courses.map((course) => (
                    <CatalogCourseCard
                        key={course.id}
                        course={course}
                        className="w-60 shrink-0 snap-start sm:w-64"
                    />
                ))}
            </div>
        </section>
    )
}
