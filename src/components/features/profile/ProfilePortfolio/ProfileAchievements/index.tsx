"use client"

import React from "react"
import { Button, Typography } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import { ListPlusIcon, MedalIcon, TrophyIcon } from "@phosphor-icons/react"
import { EmptyContent } from "@/components/blocks/async/EmptyContent"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { BadgeCatalogModal } from "../../ProfileBadges/BadgeCatalogModal"
import { toEarnedDateLabel } from "../../ProfileBadges/model"
import { useBadgeTitle } from "../../ProfileBadges/useBadgeTitle"
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
 * Achievement wall for the Portfolio tab. Groups the EARNED achievements by
 * category and renders each as a small badge cell with icon, title, and earned
 * date, plus a "see all" action that opens the full badge catalog — every badge
 * in the system with how it is earned and whether the viewer has it yet.
 *
 * Two read-path fixes live here because the backend rows cannot be trusted raw:
 * titles arrive as `"Badge FIRST_LESSON"` whenever the award event carried no
 * name ({@link useBadgeTitle} resolves them), and `achievedAt` is frequently
 * absent, which used to render literally as "Earned Invalid Date"
 * ({@link toEarnedDateLabel} degrades it to a dateless line).
 */
export const ProfileAchievements = ({ achievements, className }: ProfileAchievementsProps) => {
    const t = useTranslations()
    const locale = useLocale()
    const badgeTitle = useBadgeTitle()
    const [isCatalogOpen, setIsCatalogOpen] = React.useState(false)

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
            {achievements.length === 0 ? (
                <EmptyContent title={t("profile.portfolio.achievements.empty")} />
            ) : null}

            {Array.from(grouped.entries()).map(([category, list]) => (
                <section key={category} className="flex flex-col gap-3">
                    <Typography type="body-xs" weight="medium" color="muted">
                        {t(`profile.portfolio.achievements.categories.${category}`)}
                    </Typography>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {list.map((achievement) => {
                            const Icon = CATEGORY_ICON[achievement.category]
                            const earnedOn = toEarnedDateLabel(achievement.earnedDate, locale)
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
                                            {badgeTitle(achievement.title)}
                                        </Typography>
                                        <Typography type="body-xs" color="muted" truncate>
                                            {achievement.description}
                                        </Typography>
                                        <Typography type="body-xs" color="muted">
                                            {earnedOn
                                                ? t("profile.portfolio.achievements.earnedOn", { date: earnedOn })
                                                : t("profile.badgeCatalog.earnedNoDate")}
                                        </Typography>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </section>
            ))}

            <div className="flex">
                <Button variant="tertiary" size="sm" onPress={() => setIsCatalogOpen(true)}>
                    <ListPlusIcon className="size-4" aria-hidden focusable="false" />
                    {t("profile.badgeCatalog.seeAll")}
                </Button>
            </div>

            <BadgeCatalogModal isOpen={isCatalogOpen} onClose={() => setIsCatalogOpen(false)} />
        </div>
    )
}
