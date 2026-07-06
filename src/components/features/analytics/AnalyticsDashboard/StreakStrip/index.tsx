"use client"

import React from "react"
import { Button, Chip, Typography, cn } from "@heroui/react"
import { FireIcon } from "@phosphor-icons/react"
import { useLocale, useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { InfoTooltip } from "@/components/blocks/feedback/InfoTooltip"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { useQueryWeeklyStreakSwr } from "../../hooks/useQueryWeeklyStreakSwr"

/** Props for {@link StreakStrip}. */
export type StreakStripProps = WithClassNames<undefined>

/**
 * "Đà học" content — the last-7-days streak strip + current/longest streak, and a
 * daily-goal nudge when today is still idle. Content only (the parent `LabeledCard`
 * frames it). Faithful port of StarCI's StreakStrip. Self-fetches its own mock
 * weekly-stats leaf query through {@link AsyncContent}.
 * @param props - optional root class name (placement only)
 */
export const StreakStrip = ({ className }: StreakStripProps) => {
    const t = useTranslations("analytics")
    const locale = useLocale()
    const router = useRouter()
    const { data: weekly, isLoading, error, mutate } = useQueryWeeklyStreakSwr()

    const streak = weekly?.streak ?? 0
    const longest = weekly?.longestStreak ?? 0
    const days = weekly?.days ?? []
    const hasAny = streak > 0 || days.some((day) => day.active)
    const activeToday = days.at(-1)?.active === true

    return (
        <AsyncContent
            isLoading={isLoading || !weekly}
            error={!weekly ? error : undefined}
            errorContent={{
                title: t("overview.loadError"),
                onRetry: () => { void mutate() },
                retryLabel: t("overview.retry"),
            }}
            skeleton={(
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                            <Skeleton key={i} className="size-6 rounded-full" />
                        ))}
                    </div>
                    <Skeleton.Typography type="body-sm" width="1/3" />
                </div>
            )}
        >
            <div className={cn("flex flex-col gap-3", className)}>
                {/* last 7 days + current/longest */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        {days.map((day) => {
                            const date = new Date(`${day.date}T00:00:00Z`)
                            return (
                                <div key={day.date} className="flex flex-col items-center gap-2">
                                    <div
                                        title={date.toLocaleDateString(locale)}
                                        className={cn(
                                            "size-6 rounded-full",
                                            day.active ? "bg-accent/80" : "bg-muted/20",
                                        )}
                                    />
                                    <Typography type="body-xs" color="muted">
                                        {date.toLocaleDateString(locale, { weekday: "narrow" })}
                                    </Typography>
                                </div>
                            )
                        })}
                    </div>
                    {hasAny ? (
                        <div className="flex items-center gap-2">
                            <FireIcon aria-hidden focusable="false" className="size-5 shrink-0 text-accent" />
                            <InfoTooltip
                                className="text-sm font-medium"
                                title={t("overview.streak.label")}
                                description={t("overview.streak.help")}
                            >
                                {t("overview.streak.current", { count: streak })}
                            </InfoTooltip>
                            <Chip color="accent" variant="soft" size="sm">
                                <Chip.Label>{t("overview.streak.longest", { count: longest })}</Chip.Label>
                            </Chip>
                        </div>
                    ) : (
                        <Typography type="body-sm" color="muted">
                            {t("overview.streak.empty")}
                        </Typography>
                    )}
                </div>

                {/* daily-goal nudge — only when today is still idle (actionable) */}
                {hasAny && !activeToday ? (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <Typography type="body-sm" weight="medium">
                            {t("overview.dailyGoal.nudge")}
                        </Typography>
                        <Button variant="primary" size="sm" onPress={() => router.push("/courses")}>
                            {t("overview.dailyGoal.cta")}
                        </Button>
                    </div>
                ) : null}
            </div>
        </AsyncContent>
    )
}
