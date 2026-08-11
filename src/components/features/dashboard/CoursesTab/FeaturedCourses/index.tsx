"use client"

import React from "react"
import { Typography } from "@heroui/react"
import { BookOpenIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { IconTile } from "@/components/blocks/identity/IconTile"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"
import { PriceTag } from "@/components/blocks/commerce/PriceTag"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { SurfaceListCard, SurfaceListCardItem } from "@/components/blocks/cards/SurfaceListCard"
import { useQueryDashboardCoursesFeaturedSwr } from "../../hooks/useQueryDashboardCoursesFeaturedSwr"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link FeaturedCourses}. */
export type FeaturedCoursesProps = WithClassNames<undefined>

/**
 * Catalog rail on the COURSES tab — published courses the viewer has not enrolled
 * in yet, each with its real VND price.
 *
 * Deliberately titled as a plain catalog rail ("Khám phá khoá học"), NOT "featured"
 * and NOT "recommended for you" — `recommendedCatalog` pages published rows with no
 * Sort at all, so any curation word in the heading would be a claim the query cannot
 * back (the i18n key is still named `featuredCourses` for callers; its VALUE is the
 * neutral copy). The backend applies no viewer scoping and no ranking, and it hardcodes
 * `discountReason` / `enrolledCount` / both USD prices, so no loyalty copy, no
 * enrolment count and no USD amount is rendered here. The saving chip comes from
 * `PriceTag`, computed from the two real VND amounts.
 *
 * Self-hides once loaded with nothing left to show (no empty state) — a viewer who
 * owns everything should see the tab end, not an apology.
 *
 * @param props - optional root class name (placement only)
 */
export const FeaturedCourses = ({ className }: FeaturedCoursesProps) => {
    const t = useTranslations()
    const router = useRouter()
    const { items, isLoading, error, mutate } = useQueryDashboardCoursesFeaturedSwr()

    // nothing left to offer (loaded, no items, no error) → drop the whole section
    if (!isLoading && !error && items.length === 0) {
        return null
    }
    // computed, not hardcoded: the loaded list is already a bounded SurfaceListCard,
    // while the skeleton/error branches still need the frame (mirrors MyCoursesProgress).
    const hasItems = !isLoading && !error && items.length > 0

    return (
        <LabeledCard
            className={className}
            label={t("dashboard.featuredCourses.title")}
            frameless={hasItems}
        >
            <AsyncContent
                isLoading={isLoading && items.length === 0}
                skeleton={(
                    <SurfaceListCard>
                        {[0, 1, 2].map((row) => (
                            <SurfaceListCardItem key={row}>
                                <div className="flex items-center gap-3">
                                    <Skeleton className="size-12 shrink-0 rounded-xl" />
                                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                                        <Skeleton.Typography type="body-sm" width="1/2" />
                                        <Skeleton.Typography type="body-xs" width="1/4" />
                                    </div>
                                </div>
                            </SurfaceListCardItem>
                        ))}
                    </SurfaceListCard>
                )}
                error={items.length === 0 ? error : undefined}
                errorContent={{
                    title: t("dashboard.loadError"),
                    onRetry: () => { void mutate() },
                    retryLabel: t("dashboard.retry"),
                }}
            >
                <SurfaceListCard>
                    {items.map((course) => (
                        <SurfaceListCardItem
                            key={course.slug}
                            onPress={() => router.push(`/courses/${course.slug}`)}
                            hover="underline"
                        >
                            <div className="flex items-center gap-3">
                                <IconTile
                                    size="sm"
                                    src={course.thumbnailUrl}
                                    alt={course.title}
                                    icon={<BookOpenIcon aria-hidden focusable="false" />}
                                />
                                <div className="flex min-w-0 flex-1 flex-col gap-1">
                                    <Typography
                                        type="body-sm"
                                        weight="medium"
                                        truncate
                                        className="min-w-0 underline-offset-4 decoration-[var(--separator-tertiary)] group-hover:underline"
                                    >
                                        {course.title}
                                    </Typography>
                                    <PriceTag
                                        discounted={course.priceVnd}
                                        original={course.originalPriceVnd}
                                        size="sm"
                                    />
                                </div>
                            </div>
                        </SurfaceListCardItem>
                    ))}
                </SurfaceListCard>
            </AsyncContent>
        </LabeledCard>
    )
}
