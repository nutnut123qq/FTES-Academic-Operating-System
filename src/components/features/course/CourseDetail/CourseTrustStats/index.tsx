"use client"

import React from "react"
import {
    cn,
} from "@heroui/react"
import {
    useTranslations,
} from "next-intl"
import numeral from "numeral"
import {
    BookOpenIcon,
    ClockIcon,
    PuzzlePieceIcon,
    StackIcon,
    UsersIcon,
} from "@phosphor-icons/react"
import {
    useCourseTotals,
} from "../hooks/useCourseTotals"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { HighlightChip } from "@/components/blocks/chips/HighlightChip"
import { useAppSelector } from "@/redux/hooks"

/** Props for {@link CourseTrustStats}. */
export type CourseTrustStatsProps = WithClassNames<undefined>

/**
 * Marketing trust-stats strip: learners enrolled (social proof) + module / lesson
 * / reading-hours / challenge counts, all derived client-side from the loaded
 * course. Self-contained (reads redux + {@link useCourseTotals}); challenge stat
 * hides when the course has none.
 *
 * @param props - optional className (placement only).
 */
export const CourseTrustStats = ({ className }: CourseTrustStatsProps) => {
    const t = useTranslations()
    const totals = useCourseTotals()
    const enrollmentCount = useAppSelector((state) => state.course.entity?.enrollmentCount) ?? 0
    const hours = Math.max(1, Math.round(totals.totalMinutes / 60))

    return (
        <div className={cn("flex flex-wrap gap-2", className)}>
            {enrollmentCount > 0 ? (
                <HighlightChip
                    icon={<UsersIcon aria-hidden focusable="false" className="size-4" />}
                    value={numeral(enrollmentCount).format("0,0")}
                    label={t("courseLanding.stats.learners")}
                />
            ) : null}
            <HighlightChip
                icon={<StackIcon aria-hidden focusable="false" className="size-4" />}
                value={totals.moduleCount}
                label={t("courseLanding.stats.modules")}
            />
            <HighlightChip
                icon={<BookOpenIcon aria-hidden focusable="false" className="size-4" />}
                value={totals.lessonCount}
                label={t("courseLanding.stats.lessons")}
            />
            <HighlightChip
                icon={<ClockIcon aria-hidden focusable="false" className="size-4" />}
                value={hours}
                label={t("courseLanding.stats.hours")}
            />
            {totals.challengeCount > 0 ? (
                <HighlightChip
                    icon={<PuzzlePieceIcon aria-hidden focusable="false" className="size-4" />}
                    value={totals.challengeCount}
                    label={t("courseLanding.stats.challenges")}
                />
            ) : null}
        </div>
    )
}
