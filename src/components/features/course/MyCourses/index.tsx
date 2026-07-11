"use client"

import React from "react"
import { Button, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { Link, useRouter } from "@/i18n/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { ContinueCard } from "@/components/blocks/cards/ContinueCard"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { useQueryMyCoursesSwr } from "../hooks/useQueryMyCoursesSwr"

/**
 * "Khóa học của tôi" (`/courses/me`) — the signed-in viewer's active enrollments as
 * a grid of resumable {@link ContinueCard}s (title · % complete · progress bar ·
 * "Tiếp tục học"), each linking into the course learn shell (least-finished first).
 * Loading gates progress-card-shaped skeletons; an empty enrollment set shows an
 * onboarding empty state with a link to the catalog. Owns its container gutter,
 * mirroring {@link CourseCatalog}.
 */
export const MyCourses = () => {
    const t = useTranslations()
    const router = useRouter()
    const { courses, isLoading, error, mutate } = useQueryMyCoursesSwr()

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
            <div className="flex flex-col gap-1">
                <Typography type="h4" weight="bold">
                    {t("courses.mine.title")}
                </Typography>
                <Typography type="body-sm" color="muted">
                    {t("courses.mine.subtitle")}
                </Typography>
            </div>

            {/* loading gates progress-card skeletons; empty → onboarding; error → retry */}
            <AsyncContent
                isLoading={isLoading}
                skeleton={(
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                            <Skeleton key={i} className="h-32 w-full rounded-large" />
                        ))}
                    </div>
                )}
                error={courses.length === 0 ? error : undefined}
                errorContent={{
                    title: t("courses.loadError"),
                    onRetry: () => { void mutate() },
                    retryLabel: t("courses.retry"),
                }}
                isEmpty={courses.length === 0}
                emptyContent={{
                    title: t("courses.mine.empty"),
                    action: (
                        <Button variant="primary" onPress={() => router.push("/courses")}>
                            {t("courses.mine.browse")}
                        </Button>
                    ),
                }}
            >
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {courses.map((course) => (
                        <Link
                            key={course.courseId}
                            href={course.href}
                            className="group block no-underline"
                        >
                            <ContinueCard
                                title={course.title}
                                subtitle={t("courses.percentComplete", { percent: course.completionPercent })}
                                value={course.completionPercent}
                                ctaLabel={t("courses.continueLearning")}
                                className="h-full"
                            />
                        </Link>
                    ))}
                </div>
            </AsyncContent>
        </div>
    )
}
