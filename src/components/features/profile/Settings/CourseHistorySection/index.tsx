"use client"

import React, { useMemo, useState } from "react"
import { Button, Chip, Skeleton, Typography } from "@heroui/react"
import { useFormatter, useTranslations } from "next-intl"
import { BookOpenIcon } from "@phosphor-icons/react"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { EmptyContent } from "@/components/blocks/async/EmptyContent"
import { SurfaceListCard, SurfaceListCardItem } from "@/components/blocks/cards/SurfaceListCard"
import { IconTile } from "@/components/blocks/identity/IconTile"
import { ProgressMeter } from "@/components/blocks/stats/ProgressMeter"
import { CourseTrialChip } from "@/components/reuseable/CourseTrialChip"
import { SearchInput } from "@/components/reuseable/SearchInput"
import { useQueryMyCoursesSwr, type MyCourse } from "@/components/features/course/hooks/useQueryMyCoursesSwr"
import { useRouter } from "@/i18n/navigation"

/** Placeholder rows shown while the enrollments load. */
const SKELETON_ROWS = 3

/** The search field appears only once the list is long enough to need it. */
const SEARCH_MIN_COURSES = 4

/**
 * CourseHistorySection — the "Lịch sử học" settings screen: every course the
 * viewer has joined, with its completion, whether it is still a trial, and the
 * term window when the course is term-bound. Each row opens that course's learn
 * shell.
 *
 * Data comes from the SAME adapter the home band and `/courses/me` use
 * ({@link useQueryMyCoursesSwr}, over `GET /courses/me/enrollments`), so this
 * screen can never disagree with them about what the viewer is enrolled in or how
 * far along they are.
 *
 * NOTE ON SCOPE — the StarCI original also drills into a per-course day timeline
 * and chapter outline. That view needs per-course event history; the FTES
 * enrollment adapter carries only the aggregate completion percent, so this screen
 * stops at the hub instead of faking a breakdown it does not have.
 */
export const CourseHistorySection = () => {
    const t = useTranslations()
    const format = useFormatter()
    const router = useRouter()
    const { courses, isLoading, error, mutate } = useQueryMyCoursesSwr()
    const [search, setSearch] = useState("")

    const query = search.trim().toLowerCase()
    const filtered = useMemo(
        () => (query
            ? courses.filter((course) => course.title.toLowerCase().includes(query))
            : courses),
        [courses, query],
    )

    /** Term chip for a row: "term ended" when kicked, else the access deadline. */
    const termChip = (course: MyCourse): React.ReactNode => {
        if (course.expired) {
            return (
                <Chip size="sm" variant="soft" color="danger" className="shrink-0">
                    {t("courses.termExpired")}
                </Chip>
            )
        }
        if (course.accessUntil) {
            return (
                <Chip size="sm" variant="soft" color="warning" className="shrink-0">
                    {t("courses.termUntil", {
                        date: format.dateTime(new Date(course.accessUntil), { dateStyle: "medium" }),
                    })}
                </Chip>
            )
        }
        return null
    }

    return (
        <section className="flex flex-col gap-6">
            <div className="flex flex-col gap-0">
                <Typography type="h6" weight="bold">
                    {t("profileSettings.learning.history.title")}
                </Typography>
                <Typography type="body-sm" color="muted">
                    {t("profileSettings.learning.history.subtitle")}
                </Typography>
            </div>

            {courses.length >= SEARCH_MIN_COURSES ? (
                <SearchInput
                    value={search}
                    onValueChange={setSearch}
                    variant="secondary"
                    placeholder={t("profileSettings.learning.history.searchCourses")}
                    className="sm:max-w-none"
                />
            ) : null}

            <AsyncContent
                isLoading={isLoading}
                skeleton={(
                    <SurfaceListCard>
                        {Array.from({ length: SKELETON_ROWS }).map((_unused, row) => (
                            <SurfaceListCardItem key={row}>
                                <div className="flex w-full items-center gap-3">
                                    <Skeleton className="size-12 shrink-0 rounded-xl" />
                                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                                        <Skeleton className="h-3 w-1/2 rounded" />
                                        <Skeleton className="h-2 w-full rounded" />
                                    </div>
                                </div>
                            </SurfaceListCardItem>
                        ))}
                    </SurfaceListCard>
                )}
                error={courses.length === 0 ? error : undefined}
                errorContent={{
                    title: t("profileSettings.learning.history.error"),
                    onRetry: () => { void mutate() },
                    retryLabel: t("profileSettings.learning.history.retry"),
                }}
                isEmpty={courses.length === 0}
                emptyContent={{
                    title: t("profileSettings.learning.history.coursesEmpty"),
                    description: t("profileSettings.learning.history.coursesEmptyHint"),
                    action: (
                        <Button variant="primary" size="sm" onPress={() => router.push("/courses")}>
                            {t("profileSettings.learning.history.explore")}
                        </Button>
                    ),
                }}
            >
                {filtered.length === 0 ? (
                    // loaded, but nothing matches the current search
                    <EmptyContent title={t("profileSettings.learning.history.noMatch")} />
                ) : (
                    <SurfaceListCard>
                        {filtered.map((course) => (
                            <SurfaceListCardItem
                                key={course.courseId}
                                onPress={() => router.push(course.href)}
                            >
                                <div className="flex w-full items-center gap-3">
                                    <IconTile
                                        size="sm"
                                        src={course.coverImage}
                                        alt={course.title}
                                        icon={<BookOpenIcon aria-hidden focusable="false" />}
                                    />
                                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                                        <div className="flex min-w-0 items-center gap-2">
                                            <Typography
                                                type="body-sm"
                                                weight="semibold"
                                                truncate
                                                className="min-w-0 flex-1"
                                            >
                                                {course.title}
                                            </Typography>
                                            <CourseTrialChip isPurchased={course.isPurchased} />
                                            {termChip(course)}
                                        </div>
                                        <ProgressMeter
                                            value={course.completionPercent}
                                            max={100}
                                            showValue
                                            aria-label={t("profileSettings.learning.history.progress", {
                                                percent: course.completionPercent,
                                            })}
                                        />
                                    </div>
                                </div>
                            </SurfaceListCardItem>
                        ))}
                    </SurfaceListCard>
                )}
            </AsyncContent>
        </section>
    )
}
