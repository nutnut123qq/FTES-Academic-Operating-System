"use client"

import React from "react"
import { Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { MedalIcon, TrophyIcon } from "@phosphor-icons/react"
import type { WithClassNames } from "@/modules/types/base/class-name"
import type { MyPortfolioAchievement } from "../../hooks/useQueryMyPortfolioSwr"

/** Props for {@link ProfileAchievements}. */
export interface ProfileAchievementsProps extends WithClassNames<undefined> {
    /** Achievement list to display. */
    achievements: Array<MyPortfolioAchievement>
}

/** Category → icon component for the achievement wall. */
const CATEGORY_ICON: Record<MyPortfolioAchievement["category"], typeof TrophyIcon> = {
    learning: TrophyIcon,
    skills: TrophyIcon,
    community: MedalIcon,
    course: TrophyIcon,
    other: MedalIcon,
}

/**
 * Achievement wall for the Portfolio tab. Groups achievements by category and
 * renders each as a small badge cell with icon, title, and earned date.
 */
export const ProfileAchievements = ({ achievements, className }: ProfileAchievementsProps) => {
    const t = useTranslations()

    const grouped = React.useMemo(() => {
        const map = new Map<MyPortfolioAchievement["category"], Array<MyPortfolioAchievement>>()
        achievements.forEach((achievement) => {
            const list = map.get(achievement.category) ?? []
            list.push(achievement)
            map.set(achievement.category, list)
        })
        return map
    }, [achievements])

    return (
        <div className={`flex flex-col gap-6 ${className ?? ""}`}>
            {Array.from(grouped.entries()).map(([category, list]) => (
                <section key={category} className="flex flex-col gap-3">
                    <Typography type="body-xs" weight="medium" color="muted">
                        {t(`profile.portfolio.achievements.categories.${category}`)}
                    </Typography>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {list.map((achievement) => {
                            const Icon = CATEGORY_ICON[achievement.category]
                            const earnedDate = new Date(`${achievement.earnedDate}T00:00:00`).toLocaleDateString()
                            return (
                                <div
                                    key={achievement.id}
                                    className="flex items-start gap-3 rounded-2xl border border-separator p-4"
                                >
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-large bg-accent/10 text-accent">
                                        <Icon className="size-5" aria-hidden focusable="false" />
                                    </div>
                                    <div className="flex min-w-0 flex-1 flex-col gap-0">
                                        <Typography type="body-sm" weight="medium">
                                            {achievement.title}
                                        </Typography>
                                        <Typography type="body-xs" color="muted" truncate>
                                            {achievement.description}
                                        </Typography>
                                        <Typography type="body-xs" color="muted">
                                            {t("profile.portfolio.achievements.earnedOn", { date: earnedDate })}
                                        </Typography>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </section>
            ))}
        </div>
    )
}
