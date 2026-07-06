"use client"

import React from "react"
import { Chip, Typography, cn } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import { FireIcon } from "@phosphor-icons/react"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { useQueryWeeklyStreakSwr } from "../../hooks/useQueryWeeklyStreakSwr"

/** Props for {@link StreakStrip}. */
export type StreakStripProps = WithClassNames<undefined>

/**
 * "Weekly streak" content — a 7-day strip (a cell per day, active days filled)
 * plus the current streak count. Content only (the parent frames it).
 * Self-fetches its own mock leaf query through {@link AsyncContent}.
 * @param props - optional root class name (placement only)
 */
export const StreakStrip = ({ className }: StreakStripProps) => {
    const t = useTranslations("analytics")
    const locale = useLocale()
    const { data, isLoading, error, mutate } = useQueryWeeklyStreakSwr()

    return (
        <AsyncContent
            isLoading={isLoading || !data}
            error={!data ? error : undefined}
            errorContent={{
                title: t("overview.loadError"),
                onRetry: () => { void mutate() },
                retryLabel: t("overview.retry"),
            }}
            skeleton={(
                <div className="flex items-center gap-2">
                    {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="flex flex-1 flex-col items-center gap-2">
                            <Skeleton className="h-8 w-full rounded-medium" />
                            <Skeleton.Typography type="body-xs" width="full" />
                        </div>
                    ))}
                </div>
            )}
        >
            {data ? (
                <div className={cn("flex flex-col gap-3", className)}>
                    <div className="flex items-center gap-2">
                        {data.days.map((day) => {
                            const date = new Date(`${day.date}T00:00:00Z`)
                            return (
                                <div key={day.date} className="flex flex-1 flex-col items-center gap-2">
                                    <div
                                        title={date.toLocaleDateString(locale)}
                                        className={cn(
                                            "flex h-8 w-full items-center justify-center rounded-medium",
                                            day.active ? "bg-accent/80 text-white" : "bg-default",
                                        )}
                                    >
                                        {day.active ? (
                                            <FireIcon aria-hidden focusable="false" className="size-4" />
                                        ) : null}
                                    </div>
                                    <Typography type="body-xs" color="muted">
                                        {date.toLocaleDateString(locale, { weekday: "narrow" })}
                                    </Typography>
                                </div>
                            )
                        })}
                    </div>
                    <Chip color="warning" variant="soft" size="sm" className="self-start">
                        <FireIcon aria-hidden focusable="false" className="size-4" />
                        <Chip.Label>{t("overview.streakCurrent", { count: data.streak })}</Chip.Label>
                    </Chip>
                </div>
            ) : null}
        </AsyncContent>
    )
}
