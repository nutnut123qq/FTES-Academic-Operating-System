"use client"

import React from "react"
import { Typography } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
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
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { EmptyContent } from "@/components/blocks/async/EmptyContent"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import type { ActivityKind } from "@/components/features/activity/hooks/useQueryActivitySwr"
import { useQueryPublicActivitySwr } from "../../hooks/useQueryPublicActivitySwr"
import { ProfileActivityGrid } from "../ProfileActivityGrid"
import { toDateLabel } from "../ProfileEntries"

/** Kind → phosphor icon (mirrors the owner-scoped profile activity list). */
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

/** Skeleton mirroring the grid + timeline rows. */
const ActivitySkeleton = () => (
    <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
            <Skeleton.Typography type="h6" width="1/3" />
            <Skeleton.Card lines={3} />
        </div>
        <div className="flex flex-col gap-3">
            <Skeleton.Typography type="h6" width="1/3" />
            <Skeleton.ListRow />
            <Skeleton.ListRow />
            <Skeleton.ListRow />
        </div>
    </div>
)

/**
 * Activity tab — a contribution grid plus the recent activity timeline, both built from
 * `GET /activities?userId=` (the only real per-user activity source; the profile module's
 * own timeline port is a stub that always returns `[]`).
 *
 * Two honesty guards drive what renders:
 * - **Guests see a sign-in notice, not an empty grid.** The endpoint needs `activity.read`,
 *   so an anonymous viewer would otherwise get a blank grid that reads as "did nothing".
 * - **The grid spans only PROVEN coverage** (`coveredWeeks`, computed in the hook). Under a
 *   week of coverage it is not drawn at all.
 */
export const ProfileActivityTab = ({ userId }: { userId: string }) => {
    const t = useTranslations()
    const locale = useLocale()
    const { activity, isLoading, error, mutate, authenticated } =
        useQueryPublicActivitySwr(userId)

    if (!authenticated) {
        return <EmptyContent title={t("publicProfile.activity.signIn")} />
    }

    const totalEvents = activity?.days.reduce((sum, day) => sum + day.count, 0) ?? 0

    return (
        <AsyncContent
            isLoading={isLoading && !activity}
            skeleton={<ActivitySkeleton />}
            error={!activity ? error : undefined}
            errorContent={{
                title: t("profile.loadingError"),
                retryLabel: t("profile.retry"),
                onRetry: () => void mutate(),
            }}
        >
            {activity ? (
                <div className="flex flex-col gap-6">
                    <LabeledCard label={t("publicProfile.activity.gridTitle")}>
                        {activity.coveredWeeks < 1 ? (
                            <EmptyContent title={t("publicProfile.activity.gridUnavailable")} />
                        ) : (
                            <div className="flex flex-col gap-3">
                                <ProfileActivityGrid
                                    days={activity.days}
                                    weeks={activity.coveredWeeks}
                                    cellLabel={(day) =>
                                        t("publicProfile.activity.gridCell", {
                                            date: toDateLabel(day.date, locale) || day.date,
                                            count: day.count,
                                        })
                                    }
                                />
                                <Typography type="body-xs" color="muted">
                                    {t("publicProfile.activity.gridSummary", {
                                        weeks: activity.coveredWeeks,
                                        count: totalEvents,
                                    })}
                                    {activity.isPartial
                                        ? ` · ${t("publicProfile.activity.gridPartial")}`
                                        : ""}
                                </Typography>
                            </div>
                        )}
                    </LabeledCard>

                    <LabeledCard label={t("publicProfile.activity.timelineTitle")}>
                        {activity.timeline.length === 0 ? (
                            <EmptyContent title={t("publicProfile.activity.empty")} />
                        ) : (
                            <ul className="flex flex-col divide-y divide-separator">
                                {activity.timeline.map((item) => {
                                    const ItemIcon = KIND_ICON[item.kind]
                                    return (
                                        <li key={item.id} className="flex items-start gap-3 py-3">
                                            <div className="flex size-9 shrink-0 items-center justify-center rounded-large bg-accent/10 text-accent">
                                                <ItemIcon
                                                    className="size-4"
                                                    aria-hidden
                                                    focusable="false"
                                                />
                                            </div>
                                            <div className="flex min-w-0 flex-1 flex-col gap-0">
                                                <Typography
                                                    type="body-xs"
                                                    weight="medium"
                                                    className="text-accent"
                                                >
                                                    {t(`activity.kinds.${item.kind}`)}
                                                </Typography>
                                                <Typography
                                                    type="body-sm"
                                                    className="text-foreground"
                                                >
                                                    {item.text}
                                                </Typography>
                                            </div>
                                            <Typography
                                                type="body-xs"
                                                color="muted"
                                                className="shrink-0 whitespace-nowrap"
                                            >
                                                {toDateLabel(item.time, locale)}
                                            </Typography>
                                        </li>
                                    )
                                })}
                            </ul>
                        )}
                    </LabeledCard>
                </div>
            ) : null}
        </AsyncContent>
    )
}
