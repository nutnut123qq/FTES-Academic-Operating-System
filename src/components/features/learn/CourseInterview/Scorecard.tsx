"use client"

import React from "react"
import { Button, Chip, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import type { FinishAttemptView, SubmitAnswerView } from "@/modules/api/rest/interview"

/** Props for {@link Scorecard}. */
export interface ScorecardProps {
    scorecard: FinishAttemptView
    results: Record<string, SubmitAnswerView>
    onRetry: () => void
}

/** A rough verdict derived from the score ratio. */
const deriveVerdict = (score: number, maxScore: number): "PASS" | "BORDERLINE" | "FAIL" => {
    if (maxScore <= 0) return "FAIL"
    const ratio = score / maxScore
    if (ratio >= 0.75) return "PASS"
    if (ratio >= 0.5) return "BORDERLINE"
    return "FAIL"
}

/** Verdict → HeroUI Chip color. */
const VERDICT_COLOR: Record<string, "success" | "warning" | "danger" | "default"> = {
    PASS: "success",
    BORDERLINE: "warning",
    FAIL: "danger",
}

/**
 * Graded scorecard for a course interview attempt: overall score, feedback, and
 * any per-question feedback collected during the session.
 */
export const Scorecard = ({ scorecard, results, onRetry }: ScorecardProps) => {
    const t = useTranslations("learn")
    const verdict = deriveVerdict(scorecard.score, scorecard.maxScore)
    const color = VERDICT_COLOR[verdict] ?? "default"
    const resultList = Object.values(results)

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-default bg-surface p-6">
                <Typography type="body-xs" color="muted">{t("courseInterview.scoreLabel")}</Typography>
                <Typography type="h2" className="tabular-nums">
                    {scorecard.score}
                    <span className="text-muted">/{scorecard.maxScore}</span>
                </Typography>
                <Chip color={color} size="sm" variant="soft">
                    {t(`courseInterview.verdict.${verdict}`)}
                </Chip>
                {scorecard.feedback ? (
                    <Typography type="body-sm" className="text-center">{scorecard.feedback}</Typography>
                ) : null}
            </div>

            {resultList.length > 0 ? (
                <div className="flex flex-col gap-3">
                    <Typography type="body-sm" weight="semibold">{t("courseInterview.reviewsTitle")}</Typography>
                    {resultList.map((result, index) => (
                        <div
                            key={result.questionId}
                            className="flex flex-col gap-1 rounded-2xl border border-default p-4"
                        >
                            <div className="flex items-center justify-between gap-2">
                                <Typography type="body-xs" color="muted">
                                    {t("courseInterview.questionN", { n: index + 1 })}
                                </Typography>
                                {result.graded ? (
                                    <Typography type="body-sm" weight="semibold" className="tabular-nums">
                                        {result.score ?? 0}/{result.max ?? scorecard.maxScore}
                                    </Typography>
                                ) : (
                                    <Typography type="body-xs" color="muted">{t("courseInterview.pendingGrade")}</Typography>
                                )}
                            </div>
                            {result.feedback ? (
                                <Typography type="body-xs">{result.feedback}</Typography>
                            ) : null}
                        </div>
                    ))}
                </div>
            ) : null}

            <div>
                <Button variant="primary" onPress={onRetry}>{t("courseInterview.retryPractice")}</Button>
            </div>
        </div>
    )
}
