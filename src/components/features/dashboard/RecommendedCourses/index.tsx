"use client"

import React from "react"
import {
    Chip,
    Typography,
} from "@heroui/react"
import {
    CompassIcon,
    BookOpenIcon,
} from "@phosphor-icons/react"
import {
    useLocale,
    useTranslations,
} from "next-intl"
import {
    EntityToken,
} from "@/components/features/dashboard/EntityToken"
import {
    pathConfig,
} from "@/resources/path"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { useQueryRecommendedCoursesSwr } from "@/hooks/swr/api/graphql/queries/useQueryRecommendedCoursesSwr"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { IconTile } from "@/components/blocks/identity/IconTile"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"

/** Props for {@link RecommendedCourses}. */
export type RecommendedCoursesProps = WithClassNames<undefined>

/** Format a VND amount with the vi-VN grouping + đồng sign. */
const formatVnd = (amount: number) => `${amount.toLocaleString("vi-VN")}₫`

/**
 * "Khóa học cho bạn" — courses the viewer has NOT bought yet, each priced with
 * their engagement-based loyalty discount (an exclusive offer for diligent / multi-
 * course learners; the discounted price is the price actually charged). One framed
 * `LabeledCard` with a flat row per course — the TITLE is the link into the course
 * (not a whole-card press, matching "my courses"). Hides when nothing's left to
 * recommend. Self-fetches its leaf query.
 * @param props - optional className for the root element.
 */
export const RecommendedCourses = ({
    className,
}: RecommendedCoursesProps) => {
    const t = useTranslations()
    const locale = useLocale()
    const { data, isLoading, error, mutate } = useQueryRecommendedCoursesSwr()
    const items = data?.items ?? []

    // bought everything (loaded, no items, no error) → hide the whole section
    if (!isLoading && !error && items.length === 0) {
        return null
    }

    return (
        <LabeledCard
            label={t("dashboard.recommended.title")}
            icon={<CompassIcon aria-hidden focusable="false" className="size-5" />}
            className={className}
        >
            <AsyncContent
                isLoading={isLoading && items.length === 0}
                skeleton={(
                    <div className="flex flex-col gap-3">
                        {[0, 1, 2].map((row) => (
                            <div key={row} className="flex items-center gap-3">
                                <Skeleton className="size-12 shrink-0 rounded-xl" />
                                <div className="flex min-w-0 flex-1 flex-col gap-2">
                                    <Skeleton.Typography type="body-sm" width="1/2" />
                                    <Skeleton.Typography type="body-xs" width="1/4" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                error={items.length === 0 ? error : undefined}
                errorContent={{
                    title: t("dashboard.loadError"),
                    onRetry: () => { void mutate() },
                    retryLabel: t("dashboard.retry"),
                }}
            >
                <div className="flex flex-col gap-3">
                    {items.map((course) => {
                        const discounted = course.discountPercent > 0
                        return (
                            <div key={course.displayId} className="flex items-center gap-3">
                                <IconTile
                                    size="sm"
                                    src={course.thumbnailUrl}
                                    alt={course.title}
                                    icon={<BookOpenIcon aria-hidden focusable="false" />}
                                />
                                <div className="flex min-w-0 flex-1 flex-col gap-1">
                                    <div className="flex items-center justify-between gap-2">
                                        {/* course title is a link into the course */}
                                        <EntityToken
                                            href={pathConfig().locale(locale).course(course.displayId).build()}
                                            label={course.title}
                                            className="min-w-0 flex-1 truncate"
                                        />
                                        {discounted ? (
                                            <Chip color="danger" variant="soft" size="sm">
                                                <Chip.Label>{`-${course.discountPercent}%`}</Chip.Label>
                                            </Chip>
                                        ) : null}
                                    </div>
                                    {course.description ? (
                                        <Typography type="body-xs" color="muted" truncate>
                                            {course.description}
                                        </Typography>
                                    ) : null}
                                    <div className="flex items-center gap-2">
                                        <Typography type="body-sm" weight="medium">
                                            {formatVnd(course.discountedPriceVnd)}
                                        </Typography>
                                        {discounted ? (
                                            <Typography type="body-xs" color="muted" className="line-through">
                                                {formatVnd(course.originalPriceVnd)}
                                            </Typography>
                                        ) : null}
                                    </div>
                                    {discounted && course.discountReason !== "none" ? (
                                        <Typography type="body-xs" className="text-accent">
                                            {t(`dashboard.recommended.reason.${course.discountReason}`, {
                                                count: course.enrolledCount,
                                            })}
                                        </Typography>
                                    ) : null}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </AsyncContent>
        </LabeledCard>
    )
}
