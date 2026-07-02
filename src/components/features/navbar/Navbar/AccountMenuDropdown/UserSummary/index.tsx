"use client"

import React from "react"
import { cn, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { UserAvatar } from "@/components/reuseable/UserAvatar"
import { useAppSelector } from "@/redux/hooks"
import { useQueryMyGamificationSwr } from "@/components/features/gamification/hooks/useQueryMyGamificationSwr"
import { LevelRing } from "../LevelRing"
import type { WithClassNames } from "@/modules/types/base/class-name"

/**
 * Props for {@link UserSummary}.
 */
export type UserSummaryProps = WithClassNames<undefined>

/**
 * Header row for the account menu: the signed-in user's avatar wrapped in a
 * {@link LevelRing} (arc = progress toward the next level, current level
 * badged) + username + email. Mirrors the `UserCell` row shape (avatar +
 * truncating text column) so `Skeleton.UserCell` still fits. Container: reads
 * the user from redux and the level from the shared gamification hook; before
 * the snapshot resolves the ring renders empty (no badge) — no layout jump.
 *
 * @param props - optional root class name (placement only)
 */
export const UserSummary = ({ className }: UserSummaryProps) => {
    const t = useTranslations()
    const user = useAppSelector((state) => state.user.user)
    const { data } = useQueryMyGamificationSwr()

    const progress = data ? data.levelProgress.current / Math.max(1, data.levelProgress.nextThreshold) : 0
    const percent = Math.round(progress * 100)

    return (
        <div className={cn("flex min-w-0 items-center gap-2", className)}>
            <LevelRing
                progress={progress}
                level={data?.level}
                label={t("accountMenu.gamification.levelRing", { level: data?.level ?? 1, percent })}
            >
                <UserAvatar
                    username={user?.username ?? ""}
                    avatar={user?.avatar}
                    seed={user?.username ?? ""}
                    size="sm"
                />
            </LevelRing>
            <div className="flex min-w-0 flex-col gap-0">
                <Typography type="body-sm" weight="medium" truncate className="leading-5">
                    {user?.username ?? ""}
                </Typography>
                {user?.email ? (
                    <Typography type="body-xs" color="muted" truncate className="leading-4">
                        {user.email}
                    </Typography>
                ) : null}
            </div>
        </div>
    )
}
