"use client"

import React, { useState } from "react"
import { Button, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import {
    CalendarCheckIcon,
    CaretDownIcon,
    CaretUpIcon,
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
import { UserAvatar } from "@/components/reuseable/UserAvatar"
import { useQueryActivitySwr } from "@/components/features/activity/hooks/useQueryActivitySwr"
import { activityMessageKey, type ActivityKind } from "@/components/features/activity/model"

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

/** Rows shown before the reader asks for more. */
const ROWS_VISIBLE = 5

/**
 * Profile-flavored activity timeline. Reuses the same data hook as the global
 * Activity Timeline but renders compact rows that fit inside a `LabeledCard`.
 *
 * Each row is ONE sentence (`activity.events.*`, resolved from the dotted BE type by
 * `activityMessageKey`) plus its timestamp. The kind caption that used to sit above the
 * sentence is gone: the icon already carries the kind, and as text it printed the word
 * "Activity" on every row whose type fell outside the small hand-mapped set.
 *
 * The hook loads one page (30 rows) in a single request, so "show more" only expands
 * what is already in memory — no extra fetch, no pagination state.
 */
export const ProfileActivity = () => {
    const t = useTranslations("activity")
    const { activity } = useQueryActivitySwr()
    const [expanded, setExpanded] = useState(false)

    if (activity.length === 0) {
        return (
            <Typography type="body-sm" color="muted">
                {t("empty")}
            </Typography>
        )
    }

    const visible = expanded ? activity : activity.slice(0, ROWS_VISIBLE)
    const hidden = activity.length - ROWS_VISIBLE

    return (
        <div className="flex flex-col gap-0">
            <ul className="flex flex-col divide-y divide-separator">
                {visible.map((item) => {
                    const Icon = KIND_ICON[item.kind]
                    return (
                        <li key={item.id} className="flex items-center gap-3 py-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-large bg-accent/10 text-accent">
                                <Icon className="size-4" aria-hidden focusable="false" />
                            </div>
                            <Typography type="body-sm" className="min-w-0 flex-1 text-foreground">
                                {t(`events.${activityMessageKey(item.type)}`)}
                            </Typography>
                            <Typography type="body-xs" color="muted" className="shrink-0 whitespace-nowrap">
                                {relativeTime(item.time)}
                            </Typography>
                        </li>
                    )
                })}
            </ul>
            {hidden > 0 ? (
                <div className="mt-3 flex justify-center">
                    <Button
                        variant="tertiary"
                        size="sm"
                        onPress={() => setExpanded((prev) => !prev)}
                    >
                        {expanded ? t("showLess") : t("showMore", { count: hidden })}
                        {expanded ? (
                            <CaretUpIcon aria-hidden focusable="false" className="size-4" />
                        ) : (
                            <CaretDownIcon aria-hidden focusable="false" className="size-4" />
                        )}
                    </Button>
                </div>
            ) : null}
        </div>
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
    return (
        <div className="flex items-center gap-3 rounded-2xl border border-separator p-3">
            {/* `UserAvatar` chứ không `<Avatar><AvatarImage>` trần — cùng lý do như mọi bề mặt
                nhận diện khác: art tròn, thumbnail WebP, DiceBear và initials có guard uuid nằm
                TRONG `UserAvatar`, không rắc lại ở từng call-site. Payload này không có
                `username` nên `seed` dùng `user.id` (uuid vẫn là seed hợp lệ, chỉ không được
                in ra thành chữ — `avatarInitials` đã chặn). */}
            <UserAvatar className="size-10" username={user.name} avatar={user.avatarUrl} seed={user.id} />
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
