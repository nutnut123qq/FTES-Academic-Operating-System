"use client"

import React from "react"
import { Chip, Typography } from "@heroui/react"
import { BookOpenIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { IconTile } from "@/components/blocks/identity/IconTile"
import { ProgressMeter } from "@/components/blocks/stats/ProgressMeter"
import { SurfaceListCardItem } from "@/components/blocks/cards/SurfaceListCard"
import { CourseTrialChip } from "@/components/reuseable/CourseTrialChip"
import type { MyCourse } from "@/components/features/course/hooks/useQueryMyCoursesSwr"

/** Props for {@link CourseRow}. */
export interface CourseRowProps {
    /** One of the viewer's active enrollments. */
    course: MyCourse
}

/**
 * One enrolled course as a WHOLE-ROW pressable surface-list item: cover tile ·
 * title · state chips · overall percent, over a SINGLE progress bar.
 *
 * The bar is deliberately one-dimensional: `GET /courses/me/enrollments` exposes a
 * single `completionPercent` per enrollment and no per-kind breakdown, so splitting
 * it into content / challenge / milestone slices would be inventing numbers.
 *
 * Pressing anywhere routes into the course learn shell through the locale-aware
 * router (a raw `href` here would trigger a full page load).
 *
 * @param props - {@link CourseRowProps}
 */
export const CourseRow = ({ course }: CourseRowProps) => {
    const t = useTranslations()
    const router = useRouter()

    return (
        <SurfaceListCardItem
            onPress={() => router.push(course.href)}
            hover="underline"
        >
            <div className="flex items-center gap-3">
                <IconTile
                    size="sm"
                    src={course.coverImage}
                    alt={course.title}
                    icon={<BookOpenIcon aria-hidden focusable="false" />}
                />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                        <Typography
                            type="body-sm"
                            weight="medium"
                            truncate
                            className="min-w-0 flex-1 underline-offset-4 decoration-[var(--separator-tertiary)] group-hover:underline"
                        >
                            {course.title}
                        </Typography>
                        {/* Trial = the exception worth marking; a paid enrollment shows
                            nothing. The flag is the BE's own `EnrollmentView.isPurchased`
                            (an ACTIVE `package_purchases` row for this course), mapped
                            through `useQueryMyCoursesSwr` — so a row wearing this badge is
                            genuinely an unpaid enrollment (free enroll / legacy import),
                            not a field the query forgot to populate. */}
                        <CourseTrialChip isPurchased={course.isPurchased} />
                        {course.expired ? (
                            <Chip size="sm" variant="soft" color="danger" className="shrink-0">
                                {t("courses.termExpired")}
                            </Chip>
                        ) : null}
                        <Typography type="body-xs" color="muted" className="shrink-0">
                            {`${course.completionPercent}%`}
                        </Typography>
                    </div>
                    <ProgressMeter
                        value={course.completionPercent}
                        aria-label={`${course.title} · ${course.completionPercent}%`}
                    />
                </div>
            </div>
        </SurfaceListCardItem>
    )
}
