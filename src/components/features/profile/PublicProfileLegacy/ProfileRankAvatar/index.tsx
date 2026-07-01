"use client"

import React from "react"
import {
    cn,
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
import { RankBadge } from "@/components/reuseable/RankBadge"
import { UserAvatar } from "@/components/reuseable/UserAvatar"
import { rankInfo, resolveSeniorityRank } from "@/modules/utils/rank"

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

    return (
        <div className={cn("flex flex-col items-start gap-3", className)}>
            {/* avatar framed by the rank colour (only when a rank is reached). The
                ring is drawn via inline padding + the dynamic rank colour (a hex,
                not a token) so we keep off the static spacing scale here. */}
            <div
                className="w-fit rounded-2xl"
                style={info.ring ? { backgroundColor: info.ring, padding: 4 } : undefined}
            >
                <UserAvatar
                    username={user.displayName ?? user.username}
                    avatar={user.avatar}
                    seed={user.username}
                    size="lg"
                    className="size-32 rounded-xl"
                />
            </div>
            {/* rank label pill (the seniority flex) */}
            {info.rank && info.labelKey ? (
                <RankBadge
                    label={t(info.labelKey)}
                    color={info.ring}
                />
            ) : null}
        </div>
    )
}
