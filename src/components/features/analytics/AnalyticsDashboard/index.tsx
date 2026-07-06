"use client"

import React from "react"
import { Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import {
    BookOpenIcon,
    ListChecksIcon,
    FireIcon,
    TargetIcon,
} from "@phosphor-icons/react"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"
import { IdentityCard } from "./IdentityCard"
import { QuickActions } from "./QuickActions"
import { ContinueLearning } from "./ContinueLearning"
import { DailyQuest } from "./DailyQuest"
import { StreakStrip } from "./StreakStrip"
import { WeeklyGoals } from "./WeeklyGoals"

/**
 * Dashboard overview (§24) — the `/analytics` cockpit. A 2-column layout: a LEFT
 * identity card (avatar · streak · AI-credit meter · reward points) + a quick-
 * actions list, and a RIGHT column of activity widgets — "Continue learning"
 * (resume cards), "Today's quest" (toggleable checklist), a weekly streak strip,
 * and "Weekly goals" (progress bars). Stacks to one column on mobile. Each widget
 * self-fetches its own MOCK leaf query + owns its loading/error states.
 * ponytail: FE-only + mock hooks; swap the hooks for real queries when BE lands.
 */
export const AnalyticsDashboard = () => {
    const t = useTranslations("analytics")

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
            <div className="flex flex-col gap-2">
                <Typography type="h4" weight="bold">
                    {t("overview.title")}
                </Typography>
                <Typography type="body-sm" color="muted">
                    {t("overview.subtitle")}
                </Typography>
            </div>

            {/* 2-column cockpit — identity+actions left, activity widgets right; stacks on mobile */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[20rem_1fr]">
                {/* LEFT: identity + quick actions */}
                <div className="flex flex-col gap-6">
                    <IdentityCard />
                    <QuickActions />
                </div>

                {/* RIGHT: activity widgets */}
                <div className="flex flex-col gap-6">
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
                </div>
            </div>
        </div>
    )
}
