"use client"

import React from "react"
import { cn } from "@heroui/react"
import {
    BookOpenIcon,
    FireIcon,
    TargetIcon,
    ChartBarIcon,
    ListChecksIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { ContinueLearning } from "../ContinueLearning"
import { DailyQuest } from "../DailyQuest"
import { StreakStrip } from "../StreakStrip"
import { WeeklyGoals } from "../WeeklyGoals"
import { WeeklyChallengeCard } from "../WeeklyChallengeCard"
import { OverviewContributions } from "../OverviewContributions"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link OverviewTab}. */
export type OverviewTabProps = WithClassNames<undefined>

/**
 * Dashboard "Overview" tab — the cockpit, every section framed by a `LabeledCard`
 * (label outside + card): "Tiếp tục học" (next action), "Nhiệm vụ hôm nay" (daily
 * quest), "Đà học" (streak), "Mục tiêu tuần" (weekly goals), the weekly-challenge
 * event (self-titled, self-hides), then the contribution heatmap. Faithful port of
 * StarCI's OverviewTab. Each child self-fetches + owns its states.
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
            <LabeledCard
                label={t("overview.sections.quest")}
                icon={<ListChecksIcon aria-hidden focusable="false" className="size-5" />}
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
                icon={<TargetIcon aria-hidden focusable="false" className="size-5" />}
            >
                <WeeklyGoals />
            </LabeledCard>
            {/* weekly-challenge event — self-titled card (self-hides when none) */}
            <WeeklyChallengeCard />
            <LabeledCard
                label={t("overview.contributions.heading")}
                icon={<ChartBarIcon aria-hidden focusable="false" className="size-5" />}
            >
                <OverviewContributions />
            </LabeledCard>
        </div>
    )
}
