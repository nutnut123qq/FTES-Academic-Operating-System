"use client"

import React, {
    useMemo,
} from "react"
import {
    ChevronRight as CaretRightIcon,
} from "@gravity-ui/icons"
import {
    cn,
} from "@heroui/react"
import Link from "next/link"
import {
    useLocale,
} from "next-intl"
import {
    UserAvatar,
} from "@/components/reuseable/UserAvatar"
import {
    pathConfig,
} from "@/resources/path"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { useAppSelector } from "@/redux/hooks"
import { useQueryUserAchievementsSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserAchievementsSwr"
import { rankInfo, resolveSeniorityRank } from "@/modules/utils/rank"

/** Props for {@link ProfileMenuCard}. */
export type ProfileMenuCardProps = WithClassNames<undefined>

/**
 * The dashboard rail's identity row: a rank-ringed avatar + display name +
 * @handle on the left, with a trailing caret. The whole row is a link to the
 * public profile. No level, no XP number — the only status surfaced is the
 * seniority rank encoded by the avatar ring colour.
 *
 * Self-contained container: reads the viewer from redux and derives the
 * seniority rank from the earned-achievement wall via SWR (deduped with the
 * rest of the page). `"use client"` for the store selector.
 *
 * @param props - optional className merged onto the row.
 */
export const ProfileMenuCard = ({
    className,
}: ProfileMenuCardProps) => {
    const locale = useLocale()
    const user = useAppSelector((state) => state.user.user)
    const { data: achievements } = useQueryUserAchievementsSwr(user?.id ?? null)

    /**
     * Readable name next to the avatar: the chosen display name, else the handle
     * before "@" so a raw email is never surfaced.
     */
    const displayName = useMemo(
        () => {
            const explicit = user?.displayName?.trim()
            if (explicit) {
                return explicit
            }
            const base = user?.email ?? user?.username ?? ""
            return base.split("@")[0]
        },
        [
            user,
        ],
    )

    // overall seniority rank → the ring colour (breadth-gated highest tier)
    const info = useMemo(
        () => {
            const earnedTiers = (achievements ?? [])
                .filter((item) => item.earned)
                .map((item) => item.tierReached ?? 1)
            return rankInfo(resolveSeniorityRank(earnedTiers))
        },
        [
            achievements,
        ],
    )

    if (!user) {
        return null
    }

    return (
        <Link
            href={pathConfig().locale(locale).profile(user.username).build()}
            className={cn(
                "flex cursor-pointer items-center justify-between gap-3 no-underline transition-opacity hover:opacity-60",
                className,
            )}
        >
            <div className="flex min-w-0 items-center gap-3">
                {/* avatar framed by the seniority rank colour (when ranked) */}
                <div
                    className={cn("shrink-0 rounded-full", info.ring && "p-0.5")}
                    style={info.ring ? { backgroundColor: info.ring } : undefined}
                >
                    <UserAvatar
                        className="size-10"
                        username={displayName}
                        avatar={user.avatar}
                        seed={user.username}
                    />
                </div>
                <div className="flex min-w-0 flex-col gap-0">
                    <span className="truncate text-sm font-semibold text-foreground">
                        {displayName}
                    </span>
                    <span className="truncate text-xs text-muted">
                        @{user.username}
                    </span>
                </div>
            </div>
            {/* trailing caret (plain icon) */}
            <CaretRightIcon className="size-5 shrink-0 text-muted" />
        </Link>
    )
}
