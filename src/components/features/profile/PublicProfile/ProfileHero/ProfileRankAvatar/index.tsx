"use client"

import React from "react"
import {
    cn,
    Typography,
} from "@heroui/react"
import {
    useTranslations,
} from "next-intl"
import {
    useProfileUsername,
} from "../../hooks/useProfileUsername"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { useQueryUserAchievementsSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserAchievementsSwr"
import { useQueryUserProfileSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserProfileSwr"
import { RankBadge } from "@/components/reuseable/RankBadge"
import { UserAvatar } from "@/components/reuseable/UserAvatar"
import { InfoTooltip } from "@/components/blocks/feedback/InfoTooltip"
import { explainSeniority, rankInfo, resolveSeniorityRank } from "@/modules/utils/rank"

/** Props for {@link ProfileRankAvatar}. */
export type ProfileRankAvatarProps = WithClassNames<undefined>

/**
 * The profile avatar framed by the user's seniority rank: the highest tier
 * reached across their earned achievements maps to a rank (beginner → senior),
 * whose colour rings the avatar and shows as a label pill below it. No mascot
 * pinning — the rank is derived, not chosen.
 *
 * Self-contained container: resolves the target user from the route, reads the
 * profile + achievement wall via SWR (deduped with the rest of the page).
 * Renders a plain avatar (no ring/pill) until the user has earned a badge.
 *
 * @param props - optional className for the root element.
 */
export const ProfileRankAvatar = ({
    className,
}: ProfileRankAvatarProps) => {
    const t = useTranslations()
    const username = useProfileUsername()
    const { data: user } = useQueryUserProfileSwr(username)
    const userId = user?.id ?? null
    const { data: achievements } = useQueryUserAchievementsSwr(userId)

    if (!user) {
        return null
    }

    // overall seniority = breadth-gated highest tier across earned achievements
    // (a single lucky tier-4 badge can't alone push the rank to senior)
    const earnedTiers = (achievements ?? [])
        .filter((item) => item.earned)
        .map((item) => item.tierReached ?? 1)
    const rank = resolveSeniorityRank(earnedTiers)
    const info = rankInfo(rank)
    // personalised "why this rank + how to climb" copy for the chip tooltip
    const explain = explainSeniority(earnedTiers)

    return (
        <div className={cn("flex flex-col items-start gap-3", className)}>
            {/* avatar framed by the rank colour (only when a rank is reached). The
                ring is drawn via inline padding + the dynamic rank colour (a hex,
                not a token) so we keep off the static spacing scale here. */}
            <div
                className="relative w-fit rounded-full"
                style={info.ring ? { backgroundColor: info.ring, padding: 4 } : undefined}
            >
                <UserAvatar
                    username={user.displayName ?? user.username}
                    avatar={user.avatar}
                    seed={user.username}
                    size="lg"
                    className="size-32 rounded-full"
                />
                {/* LinkedIn-style "open to work" badge: a green pill overlapping the
                    bottom of the avatar (the recruiter signal lives ON the photo) */}
                {user.openToWork ? (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-success px-2.5 py-0.5 ring-2 ring-background">
                        <Typography type="body-xs" weight="semibold" className="text-white">
                            {t("publicProfile.openToWork")}
                        </Typography>
                    </div>
                ) : null}
            </div>
            {/* rank label pill (the seniority flex) — hover explains WHY this rank
                and what's left to climb (jargon → Tooltip) */}
            {info.rank && info.labelKey ? (
                <InfoTooltip
                    content={(
                        <>
                            <Typography type="body-sm" weight="semibold">
                                {t(info.labelKey)}
                            </Typography>
                            <Typography type="body-xs" color="muted">
                                {t("ranks.explain.why", {
                                    count: explain.earnedCount,
                                })}
                            </Typography>
                            <Typography type="body-xs" color="muted">
                                {explain.next && explain.need
                                    ? t("ranks.explain.next", {
                                        next: t(`ranks.${explain.next}`),
                                        remaining: explain.need.remaining,
                                        tier: explain.need.tier,
                                        have: explain.need.have,
                                        count: explain.need.count,
                                    })
                                    : t("ranks.explain.maxed")}
                            </Typography>
                        </>
                    )}
                >
                    <RankBadge
                        label={t(info.labelKey)}
                        color={info.ring}
                    />
                </InfoTooltip>
            ) : null}
        </div>
    )
}
