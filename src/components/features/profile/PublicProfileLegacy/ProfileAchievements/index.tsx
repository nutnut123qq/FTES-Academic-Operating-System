"use client"

import React from "react"
import {
    cn,
    Spinner,
    Tooltip,
    Typography,
} from "@heroui/react"
import {
    useTranslations,
} from "next-intl"
import {
    useProfileUsername,
} from "../useProfileUsername"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { useQueryUserAchievementsSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserAchievementsSwr"
import { useQueryUserProfileSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserProfileSwr"
import { MascotBadge } from "@/components/reuseable/MascotBadge"
import { EmptyState } from "@/components/blocks/feedback/EmptyState"
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
    } = useQueryUserAchievementsSwr(userId)

    // first load in flight (username not yet resolved, or query running) → spinner
    if (!data && (isLoading || !userId)) {
        return (
            <div className="flex justify-center py-6">
                <Spinner size="lg" />
            </div>
        )
    }

    // no definitions / nothing earned to surface → empty state
    if (!data || data.length === 0) {
        return (
            <EmptyState
                title={t("publicProfile.achievementsEmpty")}
                className={cn(className)}
            />
        )
    }

    const renderItem = (item: (typeof data)[number]) => {
        // earned → rank label (ring colour shows it too); locked → progress
        const { labelKey } = getRank(item.earned, item.tierReached)
        const status = labelKey
            ? t(labelKey)
            : `${item.currentValue}/${item.threshold}`
        return (
            <Tooltip
                key={item.slug}
                delay={200}
            >
                <Tooltip.Trigger>
                    <div className="flex cursor-default flex-col items-center gap-2 text-center">
                        <MascotBadge
                            objectKey={item.iconKey}
                            name={item.name}
                            earned={item.earned}
                            tierReached={item.tierReached}
                            size={64}
                        />
                        <Typography type="body-xs" truncate>
                            {item.name}
                        </Typography>
                        <Typography type="body-xs" color="muted">
                            {status}
                        </Typography>
                    </div>
                </Tooltip.Trigger>
                <Tooltip.Content
                    placement="top"
                    showArrow
                    className="max-w-[240px]"
                >
                    <Tooltip.Arrow />
                    {/* hover card: big mascot + name + how-to-earn + rank/progress */}
                    <div className="flex flex-col items-center gap-2 p-2 text-center">
                        <MascotBadge
                            objectKey={item.iconKey}
                            name={item.name}
                            earned={item.earned}
                            tierReached={item.tierReached}
                            size={72}
                        />
                        <Typography type="body-sm" weight="semibold">
                            {item.name}
                        </Typography>
                        <Typography type="body-xs" color="muted">
                            {item.description}
                        </Typography>
                        <Typography
                            type="body-xs"
                            weight="medium"
                            className={cn(item.earned && "text-success")}
                        >
                            {status}
                        </Typography>
                        {/* population rarity — only meaningful once earned */}
                        {item.rarityPercent != null && (
                            <Typography
                                type="body-xs"
                                weight="medium"
                                className="text-warning"
                            >
                                {t("publicProfile.rarity", {
                                    percent: item.rarityPercent,
                                })}
                            </Typography>
                        )}
                    </div>
                </Tooltip.Content>
            </Tooltip>
        )
    }

    // earned badges first (then higher tier, then closer-to-earning) so the flex
    // leads and locked/grey badges sink to the back of each group
    const byFlex = (
        a: (typeof data)[number],
        b: (typeof data)[number],
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
            items: data.filter((item) => group.slugs.includes(item.slug)).sort(byFlex),
        }))
        .filter((group) => group.items.length > 0)
    const other = data.filter((item) => !assigned.has(item.slug)).sort(byFlex)
    if (other.length > 0) {
        groups.push({
            key: "other",
            items: other,
        })
    }

    return (
        <div className={cn("flex flex-col gap-6", className)}>
            {groups.map((group) => (
                <section
                    key={group.key}
                    className="flex flex-col gap-3"
                >
                    {/* parent renders the tab h3; group label sits one level down */}
                    <Typography.Heading level={4} weight="semibold">
                        {t(`publicProfile.achievementGroups.${group.key}`)}
                    </Typography.Heading>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(92px,1fr))] gap-6">
                        {group.items.map(renderItem)}
                    </div>
                </section>
            ))}
        </div>
    )
}
