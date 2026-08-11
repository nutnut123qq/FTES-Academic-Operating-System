"use client"

import React from "react"
import { cn } from "@heroui/react"
import { BookOpenIcon, FireIcon, FlagIcon, GridFourIcon, TargetIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { OverviewContributions } from "./OverviewContributions"
import { WeeklyGoals } from "./WeeklyGoals"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"
import { ContinueLearning } from "@/components/features/analytics/AnalyticsDashboard/ContinueLearning"
import { DailyQuest } from "@/components/features/analytics/AnalyticsDashboard/DailyQuest"
import { StreakStrip } from "@/components/features/analytics/AnalyticsDashboard/StreakStrip"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link OverviewTab}. */
export type OverviewTabProps = WithClassNames<undefined>

/**
 * Dashboard OVERVIEW panel — the cockpit: what to do next and the viewer's pace.
 * Every section is framed by a `LabeledCard` (label OUTSIDE the card) and each
 * widget self-fetches its own leaf query and owns its four states through
 * `AsyncContent`, so one slow or failing endpoint never blanks the panel.
 *
 * Sections, in order: "Tiếp tục học" (enrollments) · "Nhiệm vụ hôm nay" (quest
 * board preview) · "Đà học" (streak strip) · "Mục tiêu tuần" (weekly goals) ·
 * "Đóng góp" (XP heatmap). The first three reuse the analytics dashboard widgets
 * verbatim — same components, same caches — rather than forking them.
 *
 * NOT built (no backend contract): the weekly-challenge card, the changelog list
 * and the job-readiness widget — FTES has no endpoint behind any of them, and the
 * analytics `useQueryWeeklyChallengeSwr` adapter is an explicit mock.
 *
 * @param props - optional root class name (placement only)
 */
export const OverviewTab = ({ className }: OverviewTabProps) => {
    const t = useTranslations("analytics")

    return (
        <div className={cn("flex flex-col gap-6", className)}>
            {/* frameless: resume items are themselves cards → no card-in-card */}
            <LabeledCard
                label={t("overview.sections.continue")}
                icon={<BookOpenIcon aria-hidden focusable="false" className="size-5" />}
                frameless
            >
                <ContinueLearning />
            </LabeledCard>
            {/* today's quests — live board preview + link to the full /quests page */}
            <LabeledCard
                label={t("overview.sections.quest")}
                icon={<TargetIcon aria-hidden focusable="false" className="size-5" />}
            >
                <DailyQuest />
            </LabeledCard>
            <LabeledCard
                label={t("overview.sections.streak")}
                icon={<FireIcon aria-hidden focusable="false" className="size-5" />}
            >
                <StreakStrip />
            </LabeledCard>
            <LabeledCard
                label={t("overview.sections.goals")}
                icon={<FlagIcon aria-hidden focusable="false" className="size-5" />}
            >
                <WeeklyGoals />
            </LabeledCard>
            <LabeledCard
                label={t("overview.sections.contributions")}
                icon={<GridFourIcon aria-hidden focusable="false" className="size-5" />}
            >
                <OverviewContributions />
            </LabeledCard>
        </div>
    )
}
