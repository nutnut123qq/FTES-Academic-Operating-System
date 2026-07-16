"use client"

import React from "react"
import { Chip, Typography, cn } from "@heroui/react"
import { ArrowRightIcon, CheckCircleIcon, CircleIcon, CoinsIcon } from "@phosphor-icons/react"
import { useLocale, useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { pathConfig } from "@/resources/path"
import { dailyQuestIcon } from "./map"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { useQueryDailyQuestSwr } from "../../hooks/useQueryDailyQuestSwr"

/** Props for {@link DailyQuest}. */
export type DailyQuestProps = WithClassNames<undefined>

/** How many quest rows the compact overview widget shows before "view all". */
const PREVIEW_ROWS = 4

/**
 * "Nhiệm vụ hôm nay" content — today's live quests from the quest board
 * (`useGetMyQuestsSwr`, the SAME cache the `/quests` page reads), each row showing
 * its progress toward the day's ceiling and a done marker, plus today's coin total
 * and a link to the full board. Content only (the parent `LabeledCard` frames it).
 * No mock and no local claim — coins auto-credit on the backend worker.
 * @param props - optional root class name (placement only)
 */
export const DailyQuest = ({ className }: DailyQuestProps) => {
    const t = useTranslations("analytics")
    const locale = useLocale()
    const { data, isLoading, error, mutate } = useQueryDailyQuestSwr()
    const questsHref = pathConfig().locale(locale).quests().build()

    return (
        <AsyncContent
            isLoading={isLoading && !data}
            isEmpty={data ? data.rows.length === 0 : false}
            emptyContent={{ title: t("overview.quest.empty") }}
            error={!data ? error : undefined}
            errorContent={{
                title: t("overview.loadError"),
                onRetry: () => { void mutate() },
                retryLabel: t("overview.retry"),
            }}
            skeleton={(
                <div className="flex flex-col gap-3">
                    {[0, 1, 2].map((row) => (
                        <div key={row} className="flex items-center gap-2">
                            <Skeleton className="size-5 shrink-0 rounded-full" />
                            <Skeleton.Typography type="body-sm" width="1/2" />
                        </div>
                    ))}
                </div>
            )}
        >
            {data ? (
                <div className={cn("flex flex-col gap-3", className)}>
                    <div className="flex items-center justify-between gap-2">
                        <Typography type="body-sm" weight="medium">
                            {t("overview.quest.summary", { done: data.doneCount, total: data.totalCount })}
                        </Typography>
                        <Chip color="warning" variant="soft" size="sm" className="shrink-0">
                            <CoinsIcon className="size-4" weight="fill" aria-hidden focusable="false" />
                            <Chip.Label>{t("overview.quest.coinToday", { coin: data.totalCoinToday })}</Chip.Label>
                        </Chip>
                    </div>

                    {data.rows.slice(0, PREVIEW_ROWS).map((row) => (
                        <div key={row.code} className="flex items-center gap-2">
                            {row.isDone ? (
                                <CheckCircleIcon aria-hidden focusable="false" className="size-5 shrink-0 text-success" />
                            ) : (
                                <CircleIcon aria-hidden focusable="false" className="size-5 shrink-0 text-muted" />
                            )}
                            {dailyQuestIcon(row.code)}
                            <Typography type="body-sm" className="flex-1 truncate">
                                {row.title}
                            </Typography>
                            <Typography type="body-xs" color="muted">
                                {row.current}/{row.total}
                            </Typography>
                        </div>
                    ))}

                    <Link
                        href={questsHref}
                        className="inline-flex items-center gap-1 self-start text-sm font-medium text-accent no-underline hover:underline"
                    >
                        {t("overview.quest.viewAll")}
                        <ArrowRightIcon className="size-4" aria-hidden focusable="false" />
                    </Link>
                </div>
            ) : null}
        </AsyncContent>
    )
}
