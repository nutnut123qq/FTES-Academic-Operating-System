"use client"

import React from "react"
import { Chip } from "@heroui/react"
import { useTranslations } from "next-intl"

/** Props for {@link CourseTrialChip}. */
export interface CourseTrialChipProps {
    /**
     * The enrollment's PAID flag — BE `EnrollmentView.isPurchased` /
     * `CourseAccessStateView.purchased`, which `PurchaseFlagService` defines as "an
     * ACTIVE `package_purchases` row points at a package of this course". The chip
     * renders ONLY when this is `false` (a trial / "Học thử"); a paid enrollment
     * shows nothing (mark the exception, not the norm).
     *
     * It was called `isEnrolled`, which is a DIFFERENT fact — every row on these
     * surfaces is an enrollment, so a caller reading the old name would reasonably
     * feed it `enrolled` and silently turn the badge off for everyone. The value
     * passed never changed; only the name now says which flag it is.
     */
    isPurchased: boolean
}

/**
 * Small "Học thử" badge for an enrolled-course row — surfaces that a course is
 * still a trial (the learner is enrolled but has not PAID for it) while progress
 * is still tracked. Soft warning tone; self-hiding for paid courses. Shared by
 * every place that renders the joined-course list (dashboard / profile / settings).
 *
 * @param props - {@link CourseTrialChipProps}
 */
export const CourseTrialChip = ({ isPurchased }: CourseTrialChipProps) => {
    const t = useTranslations()
    if (isPurchased) {
        return null
    }
    return (
        <Chip size="sm" variant="soft" color="warning" className="shrink-0">
            {t("course.trial")}
        </Chip>
    )
}
