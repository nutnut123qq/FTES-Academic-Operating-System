"use client"

import React, { useState } from "react"
import { Button, Chip, Typography } from "@heroui/react"
import { BookOpenIcon, CaretDownIcon, CaretUpIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"
import { ProgressMeter } from "@/components/blocks/stats/ProgressMeter"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { SurfaceListCard, SurfaceListCardItem } from "@/components/blocks/cards/SurfaceListCard"
import { useQueryMyCoursesSwr } from "@/components/features/course/hooks/useQueryMyCoursesSwr"

/**
 * Courses section of the personal profile (§4.2). Each active enrollment renders
 * as one row: a course icon, the title with an Enrolled / Trial badge, its
 * completion percent and a progress bar. The Content / Challenges / Milestone
 * count line is intentionally OMITTED — the `GET /courses/me/enrollments`
 * contract exposes only `completionPercent`, no per-dimension totals, so counts
 * would be fabricated (see change Findings). Real data only; empty state when the
 * viewer has no enrollments. Owns its own `LabeledCard`, `frameless` computed HERE
 * so the loaded list (self-framed as a `SurfaceListCard`) skips the outer card
 * while skeleton / empty states keep their bounded surface.
 *
 * Collapsed by default to {@link COURSES_VISIBLE} row so a long enrollment list does
 * not push the streak calendar (`ProfileContributions`, rendered directly below) off
 * the fold; "See more" reveals the rest.
 */
const COURSES_VISIBLE = 1

export const ProfileCourses = () => {
    const t = useTranslations()
    const router = useRouter()
    const { courses, hasCourses, isLoading, error, mutate } = useQueryMyCoursesSwr()
    const [expanded, setExpanded] = useState(false)
    const hasMore = courses.length > COURSES_VISIBLE
    const visibleCourses = expanded ? courses : courses.slice(0, COURSES_VISIBLE)

    return (
        <LabeledCard label={t("profile.courses.title")} frameless={hasCourses}>
            <AsyncContent
                isLoading={isLoading && courses.length === 0}
                skeleton={(
                    <SurfaceListCard>
                        {[0, 1].map((row) => (
                            <SurfaceListCardItem key={row}>
                                <div className="flex items-center gap-3">
                                    <Skeleton className="size-12 shrink-0 rounded-2xl" />
                                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <Skeleton.Typography type="body-sm" width="1/2" />
                                            <Skeleton className="h-3 w-8 rounded" />
                                        </div>
                                        <Skeleton.ProgressBar />
                                    </div>
                                </div>
                            </SurfaceListCardItem>
                        ))}
                    </SurfaceListCard>
                )}
                isEmpty={courses.length === 0}
                emptyContent={{
                    title: t("profile.courses.empty"),
                    icon: <BookOpenIcon aria-hidden focusable="false" className="size-8 text-muted" />,
                }}
                error={courses.length === 0 ? error : undefined}
                errorContent={{
                    title: t("profile.loadingError"),
                    onRetry: () => void mutate(),
                    retryLabel: t("profile.retry"),
                }}
            >
                <SurfaceListCard>
                    {visibleCourses.map((course) => (
                        <SurfaceListCardItem
                            key={course.courseId}
                            onPress={() => router.push(course.href)}
                        >
                            <div className="flex items-center gap-3">
                                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                                    <BookOpenIcon aria-hidden focusable="false" className="size-6" />
                                </span>
                                <div className="flex min-w-0 flex-1 flex-col gap-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <Typography
                                            type="body-sm"
                                            weight="medium"
                                            truncate
                                            className="min-w-0 flex-1"
                                        >
                                            {course.title}
                                        </Typography>
                                        <Chip
                                            size="sm"
                                            variant="soft"
                                            color={course.isPurchased ? "success" : "warning"}
                                        >
                                            <Chip.Label>
                                                {t(course.isPurchased
                                                    ? "profile.courses.enrolled"
                                                    : "profile.courses.trial")}
                                            </Chip.Label>
                                        </Chip>
                                    </div>
                                    <ProgressMeter
                                        value={course.completionPercent}
                                        max={100}
                                        showValue
                                        aria-label={t("profile.courses.progressAria", {
                                            title: course.title,
                                            percent: course.completionPercent,
                                        })}
                                    />
                                </div>
                            </div>
                        </SurfaceListCardItem>
                    ))}
                </SurfaceListCard>
                {hasMore ? (
                    <div className="mt-3 flex justify-center">
                        <Button
                            variant="tertiary"
                            size="sm"
                            onPress={() => setExpanded((prev) => !prev)}
                        >
                            {expanded
                                ? t("profile.courses.showLess")
                                : t("profile.courses.showMore", { count: courses.length - COURSES_VISIBLE })}
                            {expanded ? (
                                <CaretUpIcon aria-hidden focusable="false" className="size-4" />
                            ) : (
                                <CaretDownIcon aria-hidden focusable="false" className="size-4" />
                            )}
                        </Button>
                    </div>
                ) : null}
            </AsyncContent>
        </LabeledCard>
    )
}
