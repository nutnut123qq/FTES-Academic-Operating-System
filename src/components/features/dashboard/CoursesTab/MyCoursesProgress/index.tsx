"use client"

import React, { useState } from "react"
import { Button } from "@heroui/react"
import { CaretDownIcon, CaretUpIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { CourseRow } from "./CourseRow"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"
import { SurfaceListCard, SurfaceListCardItem } from "@/components/blocks/cards/SurfaceListCard"
import { useQueryMyCoursesSwr } from "@/components/features/course/hooks/useQueryMyCoursesSwr"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link MyCoursesProgress}. */
export type MyCoursesProgressProps = WithClassNames<undefined>

/**
 * "Khóa học của tôi" — the viewer's active enrollments as one surface list, each row
 * carrying its own progress bar and state chips.
 *
 * `frameless` is COMPUTED, not hardcoded: the loaded list is already a bounded
 * `SurfaceListCard`, so it drops the outer `Card` (never card-in-card), while the
 * skeleton / empty / error branches — which have no surface of their own — keep the
 * frame so they never render bare on the page background.
 *
 * Reads the shared `GET /courses/me/enrollments` adapter, so this list and
 * `/courses/me` hit one cache entry and can never drift apart.
 *
 * @param props - optional root class name (placement only)
 */
/**
 * Số khoá hiện sẵn trước khi phải bấm "Xem thêm". Người học lâu năm có vài chục khoá; đổ hết
 * ra thì thẻ này nuốt trọn trang tổng quan và đẩy mọi thứ khác xuống dưới màn hình.
 */
const ROWS_VISIBLE = 10

export const MyCoursesProgress = ({ className }: MyCoursesProgressProps) => {
    const t = useTranslations()
    const { courses, isLoading, error, mutate } = useQueryMyCoursesSwr()
    const hasCourses = !isLoading && !error && courses.length > 0
    const [expanded, setExpanded] = useState(false)
    const visible = expanded ? courses : courses.slice(0, ROWS_VISIBLE)
    const hidden = courses.length - ROWS_VISIBLE

    return (
        <LabeledCard
            className={className}
            label={t("dashboard.enrolledCourses")}
            frameless={hasCourses}
        >
            <AsyncContent
                isLoading={isLoading && courses.length === 0}
                skeleton={(
                    <SurfaceListCard>
                        {[0, 1, 2].map((row) => (
                            <SurfaceListCardItem key={row}>
                                <div className="flex items-center gap-3">
                                    <Skeleton className="size-12 shrink-0 rounded-xl" />
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
                <div className="flex flex-col gap-3">
                    <SurfaceListCard>
                        {visible.map((course) => (
                            <CourseRow key={course.courseId} course={course} />
                        ))}
                    </SurfaceListCard>
                    {hidden > 0 ? (
                        <div className="flex justify-center">
                            <Button
                                variant="tertiary"
                                size="sm"
                                onPress={() => setExpanded((prev) => !prev)}
                            >
                                {expanded
                                    ? t("dashboard.coursesShowLess")
                                    : t("dashboard.coursesShowMore", { count: hidden })}
                                {expanded ? (
                                    <CaretUpIcon aria-hidden focusable="false" className="size-4" />
                                ) : (
                                    <CaretDownIcon aria-hidden focusable="false" className="size-4" />
                                )}
                            </Button>
                        </div>
                    ) : null}
                </div>
            </AsyncContent>
        </LabeledCard>
    )
}
