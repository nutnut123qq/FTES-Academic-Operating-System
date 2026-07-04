"use client"

import React from "react"
import { Button, cn } from "@heroui/react"
import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { useQueryFeaturedCoursesSwr } from "../../hooks/useQueryFeaturedCoursesSwr"
import { FeaturedSlide } from "./FeaturedSlide"
import { FeaturedSliderSkeleton } from "./FeaturedSliderSkeleton"
import { useCarousel } from "./useCarousel"

/**
 * Featured-courses hero slider at the top of the course catalog (§4). Built on a
 * native CSS scroll-snap track + the local {@link useCarousel} hook — NO carousel
 * dependency (decision in openspec change `course-catalog-hero-slider`): swipe is
 * native, arrows/dots/autoplay drive `scrollTo`, autoplay pauses on hover /
 * focus-within / hidden tab and is disabled under `prefers-reduced-motion`.
 *
 * States: loading → mirrored skeleton; error or empty → renders nothing (the
 * catalog below is independent); exactly 1 slide → static hero (no arrows, dots
 * or autoplay). ARIA follows the WAI-ARIA carousel pattern (localized region +
 * slide labels, labeled controls, ArrowLeft/ArrowRight on the region).
 */
export const FeaturedSlider = () => {
    const t = useTranslations("courseSystem")
    const router = useRouter()
    const { featured, error } = useQueryFeaturedCoursesSwr()
    const slideCount = featured?.length ?? 0
    const { trackRef, activeIndex, isAutoplaying, scrollToIndex, next, prev, pauseHandlers } =
        useCarousel(slideCount)

    // skeleton on first load only (mirrors the canon AsyncContent gate)
    if (!featured && !error) return <FeaturedSliderSkeleton />
    // error or empty → hide the section entirely; the catalog below still works
    if (!featured || slideCount === 0) return null

    const hasMultiple = slideCount > 1

    return (
        <section
            role="region"
            aria-roledescription="carousel"
            aria-label={t("featured.regionLabel")}
            className="relative flex flex-col gap-3"
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
        >
            <div className="relative">
                <div
                    ref={trackRef}
                    // announce slide changes only when the user drives them
                    aria-live={isAutoplaying ? "off" : "polite"}
                    className="flex w-full snap-x snap-mandatory overflow-x-auto rounded-2xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                    {featured.map((course, index) => (
                        <FeaturedSlide
                            key={course.id}
                            course={course}
                            index={index}
                            total={slideCount}
                            onOpen={() => router.push(`/courses/${course.id}`)}
                        />
                    ))}
                </div>

                {hasMultiple ? (
                    <>
                        <Button
                            isIconOnly
                            size="sm"
                            variant="secondary"
                            aria-label={t("featured.prev")}
                            onPress={prev}
                            className="absolute left-3 top-1/2 -translate-y-1/2"
                        >
                            <CaretLeftIcon className="size-5" aria-hidden focusable="false" />
                        </Button>
                        <Button
                            isIconOnly
                            size="sm"
                            variant="secondary"
                            aria-label={t("featured.next")}
                            onPress={next}
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                            <CaretRightIcon className="size-5" aria-hidden focusable="false" />
                        </Button>
                    </>
                ) : null}
            </div>

            {hasMultiple ? (
                <div className="flex items-center justify-center gap-2">
                    {featured.map((course, index) => (
                        <button
                            key={course.id}
                            type="button"
                            aria-label={t("featured.goToSlide", { index: index + 1 })}
                            aria-current={index === activeIndex ? "true" : undefined}
                            onClick={() => scrollToIndex(index)}
                            className={cn(
                                "size-2.5 rounded-full transition-colors",
                                index === activeIndex
                                    ? "bg-accent"
                                    : "bg-default hover:bg-muted",
                            )}
                        />
                    ))}
                </div>
            ) : null}
        </section>
    )
}
