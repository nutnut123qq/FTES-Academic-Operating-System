"use client"

import React from "react"
import { Chip, Typography } from "@heroui/react"
import { useFormatter, useTranslations } from "next-intl"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { useGetMockInterviewAttemptsSwr } from "@/hooks/swr/api/rest/queries/useGetMockInterviewAttemptsSwr"
import { COURSE_UNRESOLVED, VERDICT_COLOR } from "./constants"

/** Props for {@link HistoryPanel}. */
export interface HistoryPanelProps {
    courseRef: string
}

/**
 * Graded-attempt history for the course, newest-first, with score + verdict.
 *
 * @param props - {@link HistoryPanelProps}
 */
export const HistoryPanel = ({ courseRef }: HistoryPanelProps) => {
    const t = useTranslations("learn")
    const format = useFormatter()
    const swr = useGetMockInterviewAttemptsSwr(courseRef)
    const items = swr.data?.items ?? []

    return (
        <AsyncContent
            // `courseRef` blank = the course detail has not resolved, so the SWR key is null and
            // NEITHER `data` nor `error` will ever arrive. Without this the panel would spin
            // forever whenever that detail request fails; surface it as an error instead.
            isLoading={Boolean(courseRef) && !swr.data && !swr.error}
            skeleton={
                <div className="flex flex-col gap-3">
                    {[0, 1, 2].map((i) => (
                        <Skeleton key={i} className="h-16 w-full rounded-2xl" />
                    ))}
                </div>
            }
            isEmpty={items.length === 0}
            emptyContent={{ title: t("mockInterview.historyEmpty") }}
            error={courseRef ? (!swr.data ? swr.error : undefined) : COURSE_UNRESOLVED}
            errorContent={{
                title: t("mockInterview.errorTitle"),
                onRetry: () => { void swr.mutate() },
                retryLabel: t("mockInterview.retry"),
            }}
        >
            <div className="flex flex-col gap-3">
                {items.map((attempt) => (
                    <div
                        key={attempt.attemptId}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-default p-4"
                    >
                        <div className="flex min-w-0 flex-col gap-1">
                            <Typography type="body-sm" weight="semibold" className="tabular-nums">
                                {attempt.overallScore}/100
                            </Typography>
                            <Typography type="body-xs" color="muted">
                                {format.dateTime(new Date(attempt.createdAt), {
                                    dateStyle: "medium",
                                    timeStyle: "short",
                                })}
                            </Typography>
                        </div>
                        <Chip color={VERDICT_COLOR[attempt.verdict] ?? "default"} size="sm" variant="soft">
                            {t(`mockInterview.verdict.${attempt.verdict}`)}
                        </Chip>
                    </div>
                ))}
            </div>
        </AsyncContent>
    )
}

export default HistoryPanel
