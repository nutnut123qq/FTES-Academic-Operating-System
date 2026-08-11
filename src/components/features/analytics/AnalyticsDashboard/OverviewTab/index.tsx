"use client"

import React from "react"
import { cn } from "@heroui/react"
import { BookOpenIcon, FireIcon, TargetIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { ContinueLearning } from "../ContinueLearning"
import { DailyQuest } from "../DailyQuest"
import { StreakStrip } from "../StreakStrip"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link OverviewTab}. */
export type OverviewTabProps = WithClassNames<undefined>

/**
 * Dashboard "Overview" tab — the cockpit, every section framed by a `LabeledCard`
 * (label outside + card): "Tiếp tục học" (resume cards), "Nhiệm vụ hôm nay" (today's
 * quest board preview) and "Đà học" (streak strip), all backed by real BE data.
 * Faithful port of StarCI's OverviewTab, trimmed to the widgets the BE can actually
 * serve. Each child self-fetches + owns its states.
 *
 * `DailyQuest` is the dashboard's only entry to the quest board now that the account
 * menu's "Nhiệm vụ" row is gone — it reads the SAME `useGetMyQuestsSwr` cache the
 * `/quests` page reads and links on to it.
 *
 * Hidden here (components kept, render removed so no fake numbers ship):
 * `WeeklyChallengeCard` (weekly-challenge event) — no endpoint exists and its
 * adapter `useQueryWeeklyChallengeSwr` is an explicit mock; and this subtree's
 * `OverviewContributions`, whose adapter `useQueryContributionCalendarSwr`
 * fabricates days from a hash of the day-of-year.
 *
 * A per-user contribution/time-series endpoint DOES exist, though —
 * `GET /gamification/me/activity-days` (`{ date, xp }`, sparse, Vietnam-day
 * buckets). The shipped cockpit at `/dashboard` (`features/dashboard/OverviewTab`)
 * renders both "Mục tiêu tuần" (`GET /gamification/me/goals`, with a real XP
 * numerator) and an XP heatmap off those real endpoints. Only the MOCK-backed
 * adapters named above stay unshippable. This tab, reached only through the
 * now-unrouted `AnalyticsDashboard` shell, keeps its narrower three-section form.
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
        </div>
    )
}
