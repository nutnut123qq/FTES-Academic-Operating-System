"use client"

import React from "react"
import { Chip } from "@heroui/react"
import { useTranslations } from "next-intl"

/** Props for {@link CourseTrialChip}. */
export interface CourseTrialChipProps {
    /**
     * The enrollment's paid flag. The chip renders ONLY when this is `false`
     * (a trial / "Học thử" placeholder); a real/paid enrollment shows nothing
     * (mark the exception, not the norm).
     */
    isEnrolled: boolean
}

/**
 * Small "Học thử" badge for an enrolled-course row — surfaces that a course is
 * still a trial (the learner has not enrolled/paid yet) while progress is still
 * tracked. Soft warning tone; self-hiding for paid courses. Shared by every
 * place that renders the joined-course list (dashboard / profile / settings).
 *
 * @param props - {@link CourseTrialChipProps}
 */
export const CourseTrialChip = ({ isEnrolled }: CourseTrialChipProps) => {
    const t = useTranslations()
    if (isEnrolled) {
        return null
    }
    return (
        <Chip size="sm" variant="soft" color="warning" className="shrink-0">
            {t("course.trial")}
        </Chip>
    )
}
