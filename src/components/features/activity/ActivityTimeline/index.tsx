"use client"

import React from "react"
import { Typography } from "@heroui/react"
import {
    GraduationCapIcon,
    CheckCircleIcon,
    UploadSimpleIcon,
    ChatCircleIcon,
    MedalIcon,
    CoinsIcon,
    CalendarCheckIcon,
    UsersThreeIcon,
    PulseIcon,
    type Icon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { useQueryActivitySwr, type ActivityKind } from "../hooks/useQueryActivitySwr"

/** Kind → phosphor icon. Each row's badge uses the accent-tinted token pair. */
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

/** Coarse relative-time formatter — mins / hours / days ago, no i18n plural fuss. */
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

/** Loading skeleton — mirrors the timeline row anatomy (badge + label/text + time). */
const TimelineSkeleton = () => (
    <ul className="flex flex-col divide-y divide-separator">
        {[0, 1, 2, 3, 4].map((index) => (
            <li key={index} className="flex items-start gap-4 py-4">
                <Skeleton className="size-10 shrink-0 rounded-large" />
                <div className="flex min-w-0 flex-1 flex-col gap-0">
                    <Skeleton.Typography type="body-xs" width="1/3" />
                    <Skeleton.Typography type="body-sm" width="3/4" />
                </div>
                <Skeleton.Typography type="body-xs" className="w-8 shrink-0" />
            </li>
        ))}
    </ul>
)

/**
 * Activity timeline (§18) — the FE surface of the Activity Engine backbone (which is
 * BE). A vertical feed of the user's recent actions: each row is an accent-tinted
 * icon badge (by kind) + the event text + a relative timestamp, separated by rows.
 * Feature owns data (mock) + kind→icon map; tokens own the look. ponytail: plain
 * divided rows, coarse relative time, mock feed — no BE contract yet.
 */
export const ActivityTimeline = () => {
    const t = useTranslations("activity")
    const { activity, isLoading, error, mutate } = useQueryActivitySwr()

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
            <div className="flex flex-col gap-0">
                <Typography type="h4" weight="bold">
                    {t("title")}
                </Typography>
                <Typography type="body-sm" color="muted">
                    {t("subtitle")}
                </Typography>
            </div>

            <AsyncContent
                isLoading={isLoading && activity.length === 0}
                skeleton={<TimelineSkeleton />}
                isEmpty={activity.length === 0}
                emptyContent={{
                    icon: <PulseIcon aria-hidden focusable="false" className="size-8 text-muted" />,
                    title: t("empty"),
                    description: t("emptyDescription"),
                }}
                error={activity.length === 0 ? error : undefined}
                errorContent={{
                    title: t("error"),
                    onRetry: () => void mutate(),
                    retryLabel: t("retry"),
                }}
            >
                <ul className="flex flex-col divide-y divide-separator">
                    {activity.map((item) => {
                        const Icon = KIND_ICON[item.kind]
                        return (
                            <li key={item.id} className="flex items-start gap-4 py-4">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-large bg-accent/10 text-accent">
                                    <Icon className="size-5" aria-hidden />
                                </div>
                                <div className="flex min-w-0 flex-1 flex-col gap-0">
                                    <Typography type="body-xs" weight="medium" className="text-accent">
                                        {t(`kinds.${item.kind}`)}
                                    </Typography>
                                    <Typography type="body-sm" className="line-clamp-2 text-foreground">
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
            </AsyncContent>
        </div>
    )
}
