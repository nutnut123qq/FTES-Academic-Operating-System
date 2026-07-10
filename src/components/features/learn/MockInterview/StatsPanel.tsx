"use client"

import React from "react"
import { Typography, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { useGetMockInterviewStatsSwr } from "@/hooks/swr/api/rest/queries/useGetMockInterviewStatsSwr"
import { VERDICT_BAR, VERDICT_ORDER } from "./constants"

/** Props for {@link StatsPanel}. */
export interface StatsPanelProps {
    courseRef: string
}

/**
 * Progress stats: average score, attempt count, and a pass/borderline/fail breakdown.
 *
 * @param props - {@link StatsPanelProps}
 */
export const StatsPanel = ({ courseRef }: StatsPanelProps) => {
    const t = useTranslations("learn")
    const swr = useGetMockInterviewStatsSwr(courseRef)
    const stats = swr.data
    const insufficient = !stats || stats.insufficientData

    return (
        <AsyncContent
            isLoading={!swr.data && !swr.error}
            skeleton={<Skeleton className="h-40 w-full rounded-2xl" />}
            isEmpty={insufficient}
            emptyContent={{ title: t("mockInterview.statsEmpty") }}
            error={!swr.data ? swr.error : undefined}
            errorContent={{
                title: t("mockInterview.errorTitle"),
                onRetry: () => { void swr.mutate() },
                retryLabel: t("mockInterview.retry"),
            }}
        >
            {stats ? (
                <div className="flex flex-col gap-6">
                    <div className="flex gap-4">
                        <div className="flex flex-1 flex-col gap-1 rounded-2xl border border-default p-4">
                            <Typography type="body-xs" color="muted">{t("mockInterview.avgScore")}</Typography>
                            <Typography type="h4" className="tabular-nums">
                                {Math.round(stats.avgScore)}
                            </Typography>
                        </div>
                        <div className="flex flex-1 flex-col gap-1 rounded-2xl border border-default p-4">
                            <Typography type="body-xs" color="muted">{t("mockInterview.attemptCount")}</Typography>
                            <Typography type="h4" className="tabular-nums">
                                {stats.attemptCount}
                            </Typography>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <Typography type="body-sm" weight="semibold">{t("mockInterview.verdictBreakdown")}</Typography>
                        {VERDICT_ORDER.map((verdict) => {
                            const value = stats.verdictCounts[verdict] ?? 0
                            const percent = stats.attemptCount > 0
                                ? Math.round((value / stats.attemptCount) * 100)
                                : 0
                            return (
                                <div key={verdict} className="flex items-center gap-3">
                                    <Typography type="body-xs" color="muted" className="w-24 shrink-0">
                                        {t(`mockInterview.verdict.${verdict}`)}
                                    </Typography>
                                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-default">
                                        <div
                                            className={cn("h-full rounded-full", VERDICT_BAR[verdict])}
                                            style={{ width: `${percent}%` }}
                                        />
                                    </div>
                                    <Typography type="body-xs" color="muted" className="w-8 shrink-0 text-right tabular-nums">
                                        {value}
                                    </Typography>
                                </div>
                            )
                        })}
                    </div>
                </div>
            ) : null}
        </AsyncContent>
    )
}

export default StatsPanel
