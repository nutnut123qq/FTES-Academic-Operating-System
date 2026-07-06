"use client"

import React, { useMemo } from "react"
import { Chip, Link, Typography } from "@heroui/react"
import { FlameIcon, CaretRightIcon } from "@phosphor-icons/react"
import { useLocale, useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { UserAvatar } from "@/components/reuseable/UserAvatar"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { useQueryWeeklyChallengeSwr } from "../../hooks/useQueryWeeklyChallengeSwr"

/** How many recent finishers to show. */
const TOP_ROWS = 5

/** Props for {@link WeeklyChallengeCard}. */
export type WeeklyChallengeCardProps = WithClassNames<undefined>

/**
 * "Thử thách tuần" section — the featured challenge of the week: title (routable),
 * a live countdown, the viewer's pass status, total pass count, and a short list of
 * recent finishers. Owns its own `LabeledCard` frame (label outside) and hides
 * entirely when no event is active. Faithful port of StarCI's WeeklyChallengeCard
 * (the routable entity-token title is simplified to a plain Link here). Self-fetches.
 * @param props - optional className for the root element.
 */
export const WeeklyChallengeCard = ({ className }: WeeklyChallengeCardProps) => {
    const t = useTranslations("analytics")
    const locale = useLocale()
    const router = useRouter()
    const { data, isLoading } = useQueryWeeklyChallengeSwr()

    /** Days/hours left until the event closes (computed from `weekEndAt`). */
    const countdown = useMemo(() => {
        if (!data) {
            return null
        }
        const remaining = Math.max(0, new Date(data.weekEndAt).getTime() - Date.now())
        return {
            days: Math.floor(remaining / 86_400_000),
            hours: Math.floor((remaining % 86_400_000) / 3_600_000),
        }
    }, [data])

    /** Locale-aware relative-time formatter for the "passed N ago" labels. */
    const relativeFormatter = useMemo(
        () => new Intl.RelativeTimeFormat(locale, { numeric: "auto" }),
        [locale],
    )

    /** Render a coarse "x ago" label for an ISO timestamp. */
    const formatRelative = (iso: string) => {
        const diffMs = new Date(iso).getTime() - Date.now()
        const minutes = Math.round(diffMs / 60_000)
        if (Math.abs(minutes) < 60) {
            return relativeFormatter.format(minutes, "minute")
        }
        const hours = Math.round(minutes / 60)
        if (Math.abs(hours) < 24) {
            return relativeFormatter.format(hours, "hour")
        }
        return relativeFormatter.format(Math.round(hours / 24), "day")
    }

    const topRows = data?.leaderboard.slice(0, TOP_ROWS) ?? []

    return (
        // self-hiding section: skeleton while loading, then hide when no event is active
        <AsyncContent
            isLoading={isLoading}
            skeleton={(
                <div className="flex flex-col gap-3">
                    <Skeleton.Typography type="body-sm" width="1/4" />
                    <Skeleton className="h-24 w-full rounded-large" />
                </div>
            )}
            isEmpty={!data}
        >
            {data ? (
                <LabeledCard
                    label={t("overview.weeklyChallenge.title")}
                    icon={<FlameIcon aria-hidden focusable="false" className="size-5" />}
                    className={className}
                    contentClassName="flex flex-col gap-3"
                >
                    {/* featured challenge title (routable) */}
                    <Link
                        onPress={() => router.push(data.href)}
                        className="group inline-flex cursor-pointer items-center gap-2 text-accent"
                    >
                        {data.title}
                        <CaretRightIcon
                            aria-hidden
                            focusable="false"
                            className="size-4 transition-transform group-hover:translate-x-1"
                        />
                    </Link>

                    {/* countdown + viewer status */}
                    <div className="flex items-center justify-between gap-3">
                        {countdown ? (
                            <Typography type="body-xs" color="muted">
                                {t("overview.weeklyChallenge.endsIn", {
                                    days: countdown.days,
                                    hours: countdown.hours,
                                })}
                            </Typography>
                        ) : <span />}
                        {data.viewerPassed ? (
                            <Chip color="success" size="sm" variant="soft">
                                <Chip.Label>{t("overview.weeklyChallenge.passed")}</Chip.Label>
                            </Chip>
                        ) : (
                            <Link
                                onPress={() => router.push(data.href)}
                                className="cursor-pointer text-sm text-accent"
                            >
                                {t("overview.weeklyChallenge.tryNow")}
                            </Link>
                        )}
                    </div>

                    {/* total passers */}
                    <Typography type="body-xs" color="muted">
                        {t("overview.weeklyChallenge.passedCount", { count: data.passedCount })}
                    </Typography>

                    {/* recent finishers */}
                    {topRows.length > 0 ? (
                        <div className="flex flex-col gap-2">
                            {topRows.map((entry) => (
                                <div key={entry.username} className="flex items-center gap-2">
                                    <UserAvatar
                                        className="size-6 shrink-0"
                                        username={entry.username}
                                        avatar={entry.avatar}
                                        seed={entry.username}
                                    />
                                    <Typography type="body-sm" className="flex-1 truncate">
                                        {entry.username}
                                    </Typography>
                                    <Typography type="body-xs" color="muted" className="shrink-0">
                                        {formatRelative(entry.passedAt)}
                                    </Typography>
                                </div>
                            ))}
                        </div>
                    ) : null}
                </LabeledCard>
            ) : null}
        </AsyncContent>
    )
}
