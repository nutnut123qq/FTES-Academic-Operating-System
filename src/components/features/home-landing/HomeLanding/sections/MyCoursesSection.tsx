"use client"

import React from "react"
import { ArrowRightIcon } from "@phosphor-icons/react"
import { Chip, Typography } from "@heroui/react"
import { useFormatter, useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { ContinueCourseCard } from "@/components/features/course/ContinueCourseCard"
import { useQueryMyCoursesSwr, type MyCourse } from "@/components/features/course/hooks/useQueryMyCoursesSwr"
import { HomeMascotGreeting } from "./HomeMascotGreeting"

/** Max enrolled courses shown on the landing continue-learning band. */
const HOME_MY_COURSES_LIMIT = 4

/**
 * "Tiếp tục học" landing band — a signed-in, has-enrollments-only shortcut back
 * into the viewer's courses, sitting right under the hero. Renders NOTHING for
 * anonymous viewers, while loading, or when there are no active enrollments (no
 * empty band, no layout jump). Shows up to four least-finished courses as
 * resumable {@link ContinueCourseCard}s (title · % complete · progress) with a
 * "Xem tất cả" link to `/courses/me`.
 *
 * Hosts the page's single {@link HomeMascotGreeting} between the heading and the
 * cards; when this band self-hides, `HomeMascotGreetingBand` puts the greeting back
 * in its own band instead (exactly one mascot per page either way).
 *
 * Cards are capped at TWO per row so the course title keeps a readable column; the
 * card itself mirrors the /courses catalog SHAPE without sharing its code (see
 * {@link ContinueCourseCard}).
 */
export const MyCoursesSection = () => {
    const t = useTranslations()
    const format = useFormatter()
    const { courses, hasCourses, isLoading } = useQueryMyCoursesSwr()

    // signed-out / still-loading / no courses → render nothing (no empty band, no jump)
    if (isLoading || !hasCourses) return null

    /** Term-status chip for a card: "term ended" (expired) or "open until {date}". */
    const termBadge = (course: MyCourse): React.ReactNode => {
        if (course.expired) {
            return (
                <Chip size="sm" variant="soft" color="danger">
                    {t("courses.termExpired")}
                </Chip>
            )
        }
        if (course.accessUntil) {
            return (
                <Chip size="sm" variant="soft" color="warning">
                    {t("courses.termUntil", {
                        date: format.dateTime(new Date(course.accessUntil), { dateStyle: "medium" }),
                    })}
                </Chip>
            )
        }
        return null
    }

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
                {/* FrosTES greets right under the heading, above the cards — a lead-in to
                    "here's what you were doing" instead of a lone mascot band below */}
                <div className="mb-8 flex">
                    <HomeMascotGreeting />
                </div>
                {/* at most TWO cards per row: ContinueCard lays title + CTA on ONE row, so at
                    four columns the text column collapsed to ~30px and the course title was
                    truncated away entirely (the cover now sits on top, full width) */}
                <div className="grid gap-3 sm:grid-cols-2">
                    {courses.slice(0, HOME_MY_COURSES_LIMIT).map((course) => (
                        <ContinueCourseCard
                            key={course.courseId}
                            href={course.href}
                            coverUrl={course.coverImage}
                            title={course.title}
                            completionPercent={course.completionPercent}
                            badge={termBadge(course)}
                            expired={course.expired}
                        />
                    ))}
                </div>
            </div>
        </section>
    )
}
