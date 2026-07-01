"use client"

import React from "react"
import {
    Avatar,
    Typography,
    cn,
} from "@heroui/react"
import {
    useTranslations,
} from "next-intl"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import {
    useProfileUsername,
} from "../../hooks/useProfileUsername"
import { useQueryUserAchievementsSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserAchievementsSwr"
import { useQueryUserProfileSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserProfileSwr"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { InfoTooltip } from "@/components/blocks/feedback/InfoTooltip"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { MascotBadge } from "@/components/reuseable/MascotBadge"
import { getRank } from "@/modules/utils/rank"

/** How many medals to show before the "+N" overflow. */
const MAX_BADGES = 6

/** Props for {@link ProfileBadges}. */
export type ProfileBadgesProps = WithClassNames<undefined>

/**
 * Earned-achievement medal strip in the identity column: the user's earned
 * badges as an overlapping avatar-list (rank-ring framed via {@link MascotBadge}),
 * highest tier first, hover a medal to reveal its name + rank. A "+N" chip caps
 * the row. Self-contained + AsyncContent-wrapped; self-hides when nothing earned.
 *
 * @param props - optional className (placement only).
 */
export const ProfileBadges = ({ className }: ProfileBadgesProps) => {
    const t = useTranslations()
    const username = useProfileUsername()
    const { data: user } = useQueryUserProfileSwr(username)
    const userId = user?.id ?? null
    const { data: achievements, isLoading } = useQueryUserAchievementsSwr(userId)

    // earned only, highest tier first (the flex leads)
    const earned = (achievements ?? [])
        .filter((item) => item.earned)
        .sort((a, b) => (b.tierReached ?? 0) - (a.tierReached ?? 0))
    const visible = earned.slice(0, MAX_BADGES)
    const extra = Math.max(earned.length - visible.length, 0)

    return (
        <AsyncContent
            isLoading={isLoading && !achievements}
            skeleton={(
                <div className="flex -space-x-2">
                    {[0, 1, 2, 3].map((row) => (
                        <Skeleton key={row} className="size-9 rounded-full ring-2 ring-background" />
                    ))}
                </div>
            )}
            isEmpty={earned.length === 0}
        >
            <div className={cn("flex -space-x-2", className)}>
                {visible.map((item) => {
                    const { labelKey, ring } = getRank(item.earned, item.tierReached)
                    const status = labelKey ? t(labelKey) : null
                    return (
                        <InfoTooltip
                            key={item.slug}
                            content={(
                                <>
                                    <Typography type="body-sm" weight="semibold">
                                        {item.name}
                                    </Typography>
                                    {/* the condition that earns this badge — users don't
                                        remember every rule, so spell it out on hover */}
                                    <Typography type="body-xs" color="muted">
                                        {item.description}
                                    </Typography>
                                    {/* rank + rarity share ONE line, dot-separated, so the
                                        meta reads as a single fact group and the card
                                        doesn't feel empty. Rank is tinted by the badge's own
                                        ring colour (bronze/silver/gold) = the single standout;
                                        the dot + rarity stay muted behind it. */}
                                    {status || item.rarityPercent != null ? (
                                        <div className="flex items-center gap-2">
                                            {status ? (
                                                <Typography
                                                    type="body-xs"
                                                    weight="medium"
                                                    style={ring ? { color: ring } : undefined}
                                                >
                                                    {status}
                                                </Typography>
                                            ) : null}
                                            {status && item.rarityPercent != null ? (
                                                <Typography type="body-xs" color="muted">
                                                    ·
                                                </Typography>
                                            ) : null}
                                            {item.rarityPercent != null ? (
                                                <Typography type="body-xs" color="muted">
                                                    {t("publicProfile.rarity", { percent: item.rarityPercent })}
                                                </Typography>
                                            ) : null}
                                        </div>
                                    ) : null}
                                </>
                            )}
                        >
                            <span className="rounded-full ring-2 ring-background">
                                <MascotBadge
                                    objectKey={item.iconKey}
                                    name={item.name}
                                    earned={item.earned}
                                    tierReached={item.tierReached}
                                    size={36}
                                />
                            </span>
                        </InfoTooltip>
                    )
                })}
                {extra > 0 ? (
                    <Avatar size="sm" className="size-9 ring-2 ring-background">
                        <Avatar.Fallback>+{extra}</Avatar.Fallback>
                    </Avatar>
                ) : null}
            </div>
        </AsyncContent>
    )
}
