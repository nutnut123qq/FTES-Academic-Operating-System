"use client"

import React from "react"
import {
    GraduationCapIcon,
    LightbulbIcon,
    MedalIcon,
    RocketLaunchIcon,
    SparkleIcon,
    TrophyIcon,
    type Icon,
} from "@phosphor-icons/react"
import { Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { ACHIEVEMENTS } from "../content"

/** Icon per achievement stat key. */
const ACHIEVEMENT_ICON: Record<string, Icon> = {
    techfest: TrophyIcon,
    startupGiaLai: RocketLaunchIcon,
    innovationQuest: LightbulbIcon,
    knstgl: MedalIcon,
    fptScholarship: GraduationCapIcon,
    aiAssistants: SparkleIcon,
}

/**
 * "Thành tựu" — FTES's real company recognitions (awards, competition placements and
 * scholarships from the legacy home), each a stat card with a numeric headline over a
 * label. Replaces the former module showcase in the journey slot. Purely static content
 * (no BE, no interactivity), so it mirrors the neighbouring section rhythm
 * (`max-w-6xl` · `py-16` · centered `mb-10` heading) for a drop-in swap, and is careful
 * not to duplicate the live course/enrollment counters (PlatformStatsSection) or the
 * per-learner "Bảng vàng" (HonorBoardSection).
 */
export const AchievementsSection = () => {
    const t = useTranslations("homeLanding")
    return (
        <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
            <div className="mb-10 flex flex-col items-center gap-2 text-center">
                <Typography type="body-sm" color="muted">
                    {t("achievements.eyebrow")}
                </Typography>
                <Typography type="h3" weight="bold">
                    {t("achievements.title")}
                </Typography>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {ACHIEVEMENTS.map((item) => {
                    const AchievementIcon = ACHIEVEMENT_ICON[item.key] ?? TrophyIcon
                    return (
                        <div
                            key={item.key}
                            className="flex flex-col items-center gap-3 rounded-2xl border border-separator bg-surface p-6 text-center"
                        >
                            <div className="flex size-11 items-center justify-center rounded-full bg-accent/10 text-accent">
                                <AchievementIcon className="size-6" aria-hidden focusable="false" />
                            </div>
                            <span className="text-3xl font-bold tracking-tight text-accent md:text-4xl">
                                {item.value}
                            </span>
                            <Typography type="body-sm" color="muted">
                                {t(`achievements.items.${item.key}.label`)}
                            </Typography>
                        </div>
                    )
                })}
            </div>
        </section>
    )
}
