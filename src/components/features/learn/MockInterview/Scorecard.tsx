"use client"

import React from "react"
import { Button, Chip, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import type { ScorecardView } from "@/modules/api/rest/mockinterview"
import { VERDICT_COLOR } from "./constants"

/** Props for {@link Scorecard}. */
export interface ScorecardProps {
    scorecard: ScorecardView
    onRetry: () => void
}

/**
 * Graded scorecard: overall score + verdict chip + per-question feedback. The rich fields
 * (strengths/gaps/followUp) are null in the current backend, so those blocks self-hide.
 *
 * @param props - {@link ScorecardProps}
 */
export const Scorecard = ({ scorecard, onRetry }: ScorecardProps) => {
    const t = useTranslations("learn")
    const color = VERDICT_COLOR[scorecard.verdict] ?? "default"

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-default bg-surface p-6">
                <Typography type="body-xs" color="muted">{t("mockInterview.scoreLabel")}</Typography>
                <Typography type="h2" className="tabular-nums">
                    {scorecard.overallScore}
                    <span className="text-muted">/100</span>
                </Typography>
                <Chip color={color} size="sm" variant="soft">
                    {t(`mockInterview.verdict.${scorecard.verdict}`)}
                </Chip>
            </div>

            <div className="flex flex-col gap-3">
                <Typography type="body-sm" weight="semibold">{t("mockInterview.reviewsTitle")}</Typography>
                {scorecard.questionReviews.map((review) => (
                    <div
                        key={review.questionIndex}
                        className="flex flex-col gap-1 rounded-2xl border border-default p-4"
                    >
                        <div className="flex items-center justify-between gap-2">
                            <Typography type="body-xs" color="muted">
                                {t("mockInterview.questionN", { n: review.questionIndex + 1 })}
                            </Typography>
                            <Typography type="body-sm" weight="semibold" className="tabular-nums">
                                {review.score}/100
                            </Typography>
                        </div>
                        <Typography type="body-xs">{review.feedback}</Typography>
                    </div>
                ))}
            </div>

            {scorecard.strengths && scorecard.strengths.length > 0 ? (
                <div className="flex flex-col gap-2">
                    <Typography type="body-sm" weight="semibold">{t("mockInterview.strengths")}</Typography>
                    {scorecard.strengths.map((item, i) => (
                        <Typography key={i} type="body-xs" color="muted">• {item}</Typography>
                    ))}
                </div>
            ) : null}
            {scorecard.followUpQuestion ? (
                <div className="flex flex-col gap-1 rounded-2xl border border-default p-4">
                    <Typography type="body-xs" color="muted">{t("mockInterview.followUp")}</Typography>
                    <Typography type="body-sm">{scorecard.followUpQuestion}</Typography>
                </div>
            ) : null}

            <div>
                <Button variant="primary" onPress={onRetry}>{t("mockInterview.retryPractice")}</Button>
            </div>
        </div>
    )
}

export default Scorecard
