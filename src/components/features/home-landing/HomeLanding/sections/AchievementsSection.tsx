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
 * label. Purely static content (no BE, no interactivity), so it mirrors the neighbouring
 * section rhythm (`max-w-6xl` · `py-16` · centered `mb-10` heading) for a drop-in swap,
 * and is careful not to duplicate the live course/enrollment counters
 * (PlatformStatsSection) or the per-learner "Bảng vàng" (HonorBoardSection).
 *
 * The card look mirrors the legacy `Ftes-frontend` "Thành tựu" grid
 * (`views/home/components/achiverProject/index.tsx`): a soft accent-tinted fill,
 * LEFT-aligned content, a plain accent-coloured award icon at the top (no circle bubble),
 * the big value below it, then the label, with a lift-on-hover. Legacy raw hex
 * (`#F0F6FF`, `text-utilsPrimary`, blue-tinted hover shadow) is mapped onto house tokens
 * (`bg-accent/5`, `text-accent`, `border-separator`/`border-accent`) so it stays
 * theme-aware in both modes.
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
                            className="flex flex-col items-start gap-2 rounded-2xl border border-separator bg-accent/5 p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-lg"
                        >
                            <AchievementIcon
                                className="mb-1 size-8 text-accent"
                                aria-hidden
                                focusable="false"
                            />
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
