"use client"

import React from "react"
import { Avatar, AvatarFallback, AvatarImage, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import {
    CalendarCheckIcon,
    ChatCircleIcon,
    CheckCircleIcon,
    CoinsIcon,
    GraduationCapIcon,
    MedalIcon,
    PulseIcon,
    UploadSimpleIcon,
    UsersThreeIcon,
    type Icon,
} from "@phosphor-icons/react"
import { useQueryActivitySwr, type ActivityKind } from "@/components/features/activity/hooks/useQueryActivitySwr"

/** Kind → phosphor icon. */
const KIND_ICON: Record<ActivityKind, Icon> = {
    courseEnrolled: GraduationCapIcon,
    lessonCompleted: CheckCircleIcon,
    resourceUploaded: UploadSimpleIcon,
    questionPosted: ChatCircleIcon,
    badgeEarned: MedalIcon,
    coinEarned: CoinsIcon,
    eventJoined: CalendarCheckIcon,
    groupJoined: UsersThreeIcon,
    other: PulseIcon,
}

/** Coarse relative-time formatter. */
const relativeTime = (iso: string): string => {
    const diffMs = Date.now() - new Date(iso).getTime()
    const min = Math.round(diffMs / 60000)
    if (min < 1) return "just now"
    if (min < 60) return `${min}m`
    const hours = Math.round(min / 60)
    if (hours < 24) return `${hours}h`
    const days = Math.round(hours / 24)
    return `${days}d`
}

/**
 * Profile-flavored activity timeline. Reuses the same data hook as the global
 * Activity Timeline but renders compact rows that fit inside a `LabeledCard`.
 */
export const ProfileActivity = () => {
    const t = useTranslations("activity")
    const { activity } = useQueryActivitySwr()

    if (activity.length === 0) {
        return (
            <Typography type="body-sm" color="muted">
                {t("empty")}
            </Typography>
        )
    }

    return (
        <ul className="flex flex-col divide-y divide-separator">
            {activity.map((item) => {
                const Icon = KIND_ICON[item.kind]
                return (
                    <li key={item.id} className="flex items-start gap-3 py-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-large bg-accent/10 text-accent">
                            <Icon className="size-4" aria-hidden focusable="false" />
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col gap-0">
                            <Typography type="body-xs" weight="medium" className="text-accent">
                                {t(`kinds.${item.kind}`)}
                            </Typography>
                            <Typography type="body-sm" className="text-foreground">
                                {item.text}
                            </Typography>
                        </div>
                        <Typography type="body-xs" color="muted" className="shrink-0 whitespace-nowrap">
                            {relativeTime(item.time)}
                        </Typography>
                    </li>
                )
            })}
        </ul>
    )
}

/** Skeleton mirroring the profile activity rows. */
export const ProfileActivitySkeleton = () => (
    <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-start gap-3 py-3">
                <div className="size-9 shrink-0 rounded-large bg-default/40" />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="h-3 w-16 rounded-sm bg-default/40" />
                    <div className="h-4 w-3/4 rounded-sm bg-default/40" />
                </div>
                <div className="h-3 w-10 rounded-sm bg-default/40" />
            </div>
        ))}
    </div>
)

/** User row used by the followers/following list. */
export const CommunityUserRow = ({
    user,
}: {
    user: { id: string; name: string; avatarUrl: string; headline: string }
}) => {
    const initials = user.name.slice(0, 1).toUpperCase()

    return (
        <div className="flex items-center gap-3 rounded-2xl border border-separator p-3">
            <Avatar className="size-10 rounded-full">
                {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.name} /> : null}
                <AvatarFallback className="bg-accent/10 text-sm font-bold text-accent">
                    {initials}
                </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-1 flex-col gap-0">
                <Typography type="body-sm" weight="medium" truncate>
                    {user.name}
                </Typography>
                <Typography type="body-xs" color="muted" truncate>
                    {user.headline}
                </Typography>
            </div>
        </div>
    )
}
