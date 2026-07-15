"use client"

import React from "react"
import { cn } from "@heroui/react"
import { BookOpenIcon, FireIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { ContinueLearning } from "../ContinueLearning"
import { StreakStrip } from "../StreakStrip"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link OverviewTab}. */
export type OverviewTabProps = WithClassNames<undefined>

/**
 * Dashboard "Overview" tab — the cockpit, every section framed by a `LabeledCard`
 * (label outside + card): "Tiếp tục học" (resume cards) and "Đà học" (streak strip),
 * both backed by real BE data. Faithful port of StarCI's OverviewTab, trimmed to the
 * widgets the BE can actually serve. Each child self-fetches + owns its states.
 *
 * Hidden — chờ BE (components kept, render removed so no fake numbers ship):
 * `DailyQuest` ("Nhiệm vụ hôm nay"), `WeeklyGoals` ("Mục tiêu tuần"),
 * `WeeklyChallengeCard` (weekly-challenge event) — no gamification endpoints yet;
 * `OverviewContributions` (contribution heatmap) — analytics has no per-user
 * contribution/time-series endpoint (only the admin contributionStats zero-stub).
 * Re-add each `LabeledCard` here when its endpoint lands.
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
                label={t("overview.sections.streak")}
                icon={<FireIcon aria-hidden focusable="false" className="size-5" />}
            >
                <StreakStrip />
            </LabeledCard>
        </div>
    )
}
