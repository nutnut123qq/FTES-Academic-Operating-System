"use client"

import React from "react"
import {
    Label,
    Tooltip,
    Typography,
} from "@heroui/react"
import {
    useTranslations,
} from "next-intl"
import {
    TrophyIcon,
} from "@phosphor-icons/react"
import {
    useProfileUsername,
} from "../../hooks/useProfileUsername"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { useQueryUserAchievementsSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserAchievementsSwr"
import { useQueryUserProfileSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserProfileSwr"
import { MascotBadge } from "@/components/reuseable/MascotBadge"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { getRank } from "@/modules/utils/rank"

/** One labelled achievement bucket: a group key plus the badge slugs it holds. */
interface AchievementGroup {
    /** i18n key identifying the group (e.g. `learning`, `skills`). */
    key: string
    /** Badge slugs displayed under this group, in order. */
    slugs: ReadonlyArray<string>
}

/**
 * Achievement wall layout: each badge slug bucketed into a labelled group, in
 * display order. Slugs not listed here fall into a trailing "other" group, so
 * adding a badge never silently drops it.
 */
const ACHIEVEMENT_GROUPS: ReadonlyArray<AchievementGroup> = [
    {
        key: "learning",
        slugs: [
            "baby-duckling",
            "blazing-fox",
            "crowned-owl",
            "polyglot-parrot",
        ],
    },
    {
        key: "skills",
        slugs: [
            "sword-shark",
            "bug-hunting-chameleon",
            "brainy-octopus",
        ],
    },
    {
        key: "community",
        slugs: [
            "guiding-elephant",
            "busy-bee",
            "champion-lion",
        ],
    },
    {
        key: "course",
        slugs: [
            "architect-rhino",
            "fullstack-monkey",
            "devops-wolf",
        ],
    },
]

/** Props for {@link ProfileAchievements}. */
export type ProfileAchievementsProps = WithClassNames<undefined>

/**
 * Achievements tab of the public profile — the profile owner's badge wall. Earned
 * badges show in full colour; locked ones are dimmed with progress toward the
 * threshold. Self-contained container: reads the target user id from the route
 * and drives its own SWR. Mirrors the dashboard achievements grid but for any
 * user (not just the viewer). Badge art comes from MinIO (`iconKey`), falling
 * back to a medal placeholder.
 *
 * @param props - optional className for the root element.
 */
export const ProfileAchievements = ({
    className,
}: ProfileAchievementsProps) => {
    const t = useTranslations()
    // route carries the username; resolve it to the entity id the achievements
    // query keys off (the profile fetch is SWR-deduped with the parent + tabs)
    const username = useProfileUsername()
    const { data: user } = useQueryUserProfileSwr(username)
    const userId = user?.id ?? null
    const {
        data,
        isLoading,
        error,
        mutate,
    } = useQueryUserAchievementsSwr(userId)

    const items = data ?? []

    const renderItem = (item: (typeof items)[number]) => {
        // earned → rank (coloured by its ring) · rarity %; locked → progress
        const { labelKey, ring } = getRank(item.earned, item.tierReached)
        const rankLabel = labelKey ? t(labelKey) : null
        // shared meta line: rank in its ring colour + rarity muted, or locked progress
        const meta = item.earned && rankLabel ? (
            <div className="flex items-center gap-2">
                <Typography type="body-xs" weight="medium" style={{ color: ring }}>
                    {rankLabel}
                </Typography>
                {item.rarityPercent != null ? (
                    <Typography type="body-xs" color="muted">
                        · {item.rarityPercent}%
                    </Typography>
                ) : null}
            </div>
        ) : (
            <Typography type="body-xs" color="muted">
                {item.currentValue}/{item.threshold}
            </Typography>
        )
        return (
            <Tooltip
                key={item.slug}
                delay={200}
            >
                <Tooltip.Trigger>
                    <div className="flex max-w-32 min-w-0 cursor-default flex-col items-center gap-2 text-center">
                        <MascotBadge
                            objectKey={item.iconKey}
                            name={item.name}
                            earned={item.earned}
                            tierReached={item.tierReached}
                            size={48}
                        />
                        <Typography type="body-xs" truncate className="w-full">
                            {item.name}
                        </Typography>
                        {meta}
                    </div>
                </Tooltip.Trigger>
                <Tooltip.Content
                    placement="top"
                    showArrow
                    className="max-w-[240px]"
                >
                    <Tooltip.Arrow />
                    {/* hover card: big mascot + name + how-to-earn + rank/progress
                        (Tooltip.Content self-pads → no inner p-*) */}
                    <div className="flex flex-col items-center gap-2 text-center">
                        <MascotBadge
                            objectKey={item.iconKey}
                            name={item.name}
                            earned={item.earned}
                            tierReached={item.tierReached}
                            size={56}
                        />
                        <Typography type="body-sm" weight="semibold">
                            {item.name}
                        </Typography>
                        <Typography type="body-xs" color="muted">
                            {item.description}
                        </Typography>
                        {meta}
                    </div>
                </Tooltip.Content>
            </Tooltip>
        )
    }

    // earned badges first (then higher tier, then closer-to-earning) so the flex
    // leads and locked/grey badges sink to the back of each group
    const byFlex = (
        a: (typeof items)[number],
        b: (typeof items)[number],
    ): number => {
        if (a.earned !== b.earned) {
            return a.earned ? -1 : 1
        }
        const aTier = a.tierReached ?? 0
        const bTier = b.tierReached ?? 0
        if (aTier !== bTier) {
            return bTier - aTier
        }
        // both locked → the one nearer its threshold ranks first
        const aProgress = a.threshold > 0 ? a.currentValue / a.threshold : 0
        const bProgress = b.threshold > 0 ? b.currentValue / b.threshold : 0
        return bProgress - aProgress
    }

    // bucket the wall into labelled groups (display order), with a trailing
    // "other" group catching any slug not assigned above
    const assigned = new Set(ACHIEVEMENT_GROUPS.flatMap((group) => group.slugs))
    const groups = ACHIEVEMENT_GROUPS
        .map((group) => ({
            key: group.key,
            items: items.filter((item) => group.slugs.includes(item.slug)).sort(byFlex),
        }))
        .filter((group) => group.items.length > 0)
    const other = items.filter((item) => !assigned.has(item.slug)).sort(byFlex)
    if (other.length > 0) {
        groups.push({
            key: "other",
            items: other,
        })
    }

    return (
        <LabeledCard
            className={className}
            label={t("publicProfile.tabs.achievements")}
            icon={<TrophyIcon aria-hidden focusable="false" className="size-5" />}
        >
            <AsyncContent
                isLoading={(isLoading || !userId) && items.length === 0}
                skeleton={
                    <div className="flex flex-col gap-6">
                        {[0, 1].map((groupIndex) => (
                            <section
                                key={groupIndex}
                                className="flex flex-col gap-3"
                            >
                                <Skeleton.Typography type="body-sm" width="1/4" />
                                <div className="flex flex-wrap gap-4">
                                    {[0, 1, 2, 3].map((cellIndex) => (
                                        <div
                                            key={cellIndex}
                                            className="flex w-24 flex-col items-center gap-2 text-center"
                                        >
                                            <Skeleton className="size-12 rounded-full" />
                                            <Skeleton.Typography type="body-xs" width="3/4" />
                                            <Skeleton.Typography type="body-xs" width="1/2" />
                                        </div>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                }
                isEmpty={items.length === 0}
                emptyContent={{
                    title: t("publicProfile.achievementsEmpty"),
                }}
                error={error}
                errorContent={{
                    title: t("publicProfile.loadError"),
                    onRetry: () => mutate(),
                    retryLabel: t("publicProfile.loadErrorRetry"),
                }}
            >
                <div className="flex flex-col gap-6">
                    {groups.map((group) => (
                        <section
                            key={group.key}
                            className="flex flex-col gap-3"
                        >
                            {/* sub-section label inside the card → HeroUI Label (matches LabeledCard) */}
                            <Label>
                                {t(`publicProfile.achievementGroups.${group.key}`)}
                            </Label>
                            <div className="flex flex-wrap gap-4">
                                {group.items.map(renderItem)}
                            </div>
                        </section>
                    ))}
                </div>
            </AsyncContent>
        </LabeledCard>
    )
}
