"use client"

import React from "react"
import { Button, Chip, Typography } from "@heroui/react"
import { useFormatter, useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { ContinueCourseCard } from "@/components/features/course/ContinueCourseCard"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { FtesMascot } from "@/components/reuseable/FtesMascot"
import { MascotProfileNudge } from "@/components/features/mascot-moments"
import { useQueryMyCoursesSwr, type MyCourse } from "../hooks/useQueryMyCoursesSwr"

/**
 * "Khóa học của tôi" (`/courses/me`) — the signed-in viewer's active enrollments as
 * a grid of resumable {@link ContinueCourseCard}s (full-width cover · title · % complete ·
 * progress bar · "Tiếp tục học"), each linking into the course learn shell
 * (least-finished first).
 * Loading gates progress-card-shaped skeletons; an empty enrollment set shows an
 * onboarding empty state with a link to the catalog. Owns its container gutter,
 * mirroring {@link CourseCatalog}.
 */
export const MyCourses = () => {
    const t = useTranslations()
    const format = useFormatter()
    const router = useRouter()
    const { courses, isLoading, error, mutate } = useQueryMyCoursesSwr()

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
                            <Skeleton key={i} className="h-64 w-full rounded-large" />
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
                    icon: <FtesMascot pose="explain" size="lg" />,
                    title: t("courses.mine.empty"),
                    description: t("courses.mine.emptyHint"),
                    action: (
                        <Button variant="primary" onPress={() => router.push("/courses")}>
                            {t("courses.mine.browse")}
                        </Button>
                    ),
                }}
            >
                <div className="flex flex-col gap-4">
                    {/* profile-completion nudge sits above the list ONLY when there are
                        courses (no empty-state mascot), keeping one mascot per page */}
                    <MascotProfileNudge />
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {courses.map((course) => (
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
            </AsyncContent>
        </div>
    )
}
