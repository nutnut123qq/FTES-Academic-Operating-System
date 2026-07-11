"use client"

import React from "react"
import { ArrowRightIcon } from "@phosphor-icons/react"
import { Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { ContinueCard } from "@/components/blocks/cards/ContinueCard"
import { useQueryMyCoursesSwr } from "@/components/features/course/hooks/useQueryMyCoursesSwr"

/** Max enrolled courses shown on the landing continue-learning band. */
const HOME_MY_COURSES_LIMIT = 4

/**
 * "Tiếp tục học" landing band — a signed-in, has-enrollments-only shortcut back
 * into the viewer's courses, sitting right under the hero. Renders NOTHING for
 * anonymous viewers, while loading, or when there are no active enrollments (no
 * empty band, no layout jump). Shows up to four least-finished courses as
 * resumable {@link ContinueCard}s (title · % complete · progress) with a
 * "Xem tất cả" link to `/courses/me`.
 */
export const MyCoursesSection = () => {
    const t = useTranslations()
    const { courses, hasCourses, isLoading } = useQueryMyCoursesSwr()

    // signed-out / still-loading / no courses → render nothing (no empty band, no jump)
    if (isLoading || !hasCourses) return null

    return (
        <section className="w-full border-b border-separator bg-default/20">
            <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
                <div className="mb-8 flex items-end justify-between gap-4">
                    <div className="flex flex-col gap-2">
                        <Typography type="body-sm" color="muted">
                            {t("home.myCourses.eyebrow")}
                        </Typography>
                        <Typography type="h3" weight="bold">
                            {t("home.myCourses.title")}
                        </Typography>
                    </div>
                    <Link
                        href="/courses/me"
                        className="inline-flex shrink-0 items-center gap-2 text-accent"
                    >
                        {t("home.myCourses.seeAll")}
                        <ArrowRightIcon aria-hidden focusable="false" className="size-4" />
                    </Link>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {courses.slice(0, HOME_MY_COURSES_LIMIT).map((course) => (
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
            </div>
        </section>
    )
}
