"use client"

import React from "react"
import { cn, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { UserAvatar } from "@/components/reuseable/UserAvatar"
import { StaffBadge } from "@/components/reuseable/StaffBadge"
import { useAppSelector } from "@/redux/hooks"
import { useViewerStaffRole } from "@/hooks/useViewerStaffRole"
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
 * badged) + display name (with a {@link StaffBadge} when the viewer is
 * platform staff) + `@username`. Mirrors the `UserCell` row shape (avatar +
 * truncating text column) so `Skeleton.UserCell` still fits. Container: reads
 * the user + staff role from redux and the level from the shared gamification
 * hook; before the snapshot resolves the ring renders empty (no badge) — no
 * layout jump.
 *
 * @param props - optional root class name (placement only)
 */
export const UserSummary = ({ className }: UserSummaryProps) => {
    const t = useTranslations()
    const user = useAppSelector((state) => state.user.user)
    const staffRole = useViewerStaffRole()
    const { data } = useQueryMyGamificationSwr()

    const progress = data ? data.levelProgress.current / Math.max(1, data.levelProgress.nextThreshold) : 0
    const percent = Math.round(progress * 100)
    /**
     * Secondary line = the public handle, NOT the email. Email is private contact
     * data and has no business sitting in a menu that opens over the viewer's
     * shoulder; `username` is what everyone else already sees on posts/comments.
     * Falls back to the email only when the account has no username at all.
     */
    const handle = user?.username ? `@${user.username}` : (user?.email ?? null)

    return (
        <div className={cn("flex min-w-0 items-center gap-2", className)}>
            <LevelRing
                progress={progress}
                level={data?.level}
                label={t("accountMenu.gamification.levelRing", { level: data?.level ?? 1, percent })}
            >
                <UserAvatar
                    username={user?.displayName || user?.username || ""}
                    avatar={user?.avatar}
                    seed={user?.displayName || user?.username || ""}
                    size="sm"
                />
            </LevelRing>
            <div className="flex min-w-0 flex-col gap-0">
                <div className="flex min-w-0 items-center gap-1">
                    <Typography type="body-sm" weight="medium" truncate className="min-w-0 leading-5">
                        {user?.displayName || user?.username || ""}
                    </Typography>
                    <StaffBadge role={staffRole} />
                </div>
                {handle ? (
                    <Typography type="body-xs" color="muted" truncate className="leading-4">
                        {handle}
                    </Typography>
                ) : null}
            </div>
        </div>
    )
}
