"use client"

import React from "react"
import {
    useTranslations,
} from "next-intl"
import {
    CourseRow,
} from "./CourseRow"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { useQueryMyCoursesSwr } from "@/hooks/swr/api/graphql/queries/useQueryMyCoursesSwr"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { SurfaceListCard, SurfaceListCardItem } from "@/components/blocks/cards/SurfaceListCard"

/** Props for {@link MyCoursesProgress}. */
export type MyCoursesProgressProps = WithClassNames<undefined>

/**
 * Enrolled-course progress — each course as one whole-row clickable item inside a
 * single surface list card (the parent {@link import("@/components/blocks").LabeledCard}
 * is `frameless`, so this card is the only bordered surface — no card-in-card).
 * Reads its own `myCourses` leaf query through {@link AsyncContent}.
 * @param props - optional root class name (placement only)
 */
export const MyCoursesProgress = ({
    className,
}: MyCoursesProgressProps) => {
    const t = useTranslations()
    const { data, isLoading, error, mutate } = useQueryMyCoursesSwr()
    const courses = data ?? []

    return (
        <AsyncContent
            isLoading={isLoading && courses.length === 0}
            skeleton={(
                <SurfaceListCard className={className}>
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
            emptyContent={{ title: t("dashboard.enrolledCoursesEmpty") }}
            error={courses.length === 0 ? error : undefined}
            errorContent={{
                title: t("dashboard.loadError"),
                onRetry: () => { void mutate() },
                retryLabel: t("dashboard.retry"),
            }}
        >
            <SurfaceListCard className={className}>
                {courses.map((item) => (
                    <CourseRow key={item.globalId} item={item} />
                ))}
            </SurfaceListCard>
        </AsyncContent>
    )
}
