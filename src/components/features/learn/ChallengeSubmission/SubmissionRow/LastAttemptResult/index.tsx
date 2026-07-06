"use client"

import React from "react"
import { Chip, Typography, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import type { FeedbackSeverity, SubmissionFeedback } from "../../../hooks/useQueryChallengeSubmissionSwr"

/** Severity dot colour. */
const SEVERITY_DOT: Record<FeedbackSeverity, string> = {
    high: "bg-danger",
    medium: "bg-warning",
    low: "bg-muted",
}

/** Props for {@link LastAttemptResult}. */
export interface LastAttemptResultProps {
    earnedScore: number
    maxScore: number
    /** Fraction of max needed to pass (e.g. 0.8). */
    passThreshold: number
    feedbacks?: Array<SubmissionFeedback>
    className?: string
}

/**
 * The last graded attempt's result inline under a submission row (StarCI port):
 * a pass/fail chip + the earned/required score, then the structured findings with
 * severity dots (message + location + suggestion).
 *
 * @param props - {@link LastAttemptResultProps}
 */
export const LastAttemptResult = ({
    earnedScore,
    maxScore,
    passThreshold,
    feedbacks = [],
    className,
}: LastAttemptResultProps) => {
    const t = useTranslations("learn")
    const requiredScore = Math.ceil(maxScore * passThreshold)
    const isPassed = earnedScore >= requiredScore
    return (
        <div className={cn("mt-4 flex flex-col gap-3 border-t border-default pt-4", className)}>
            <div className="flex flex-wrap items-center gap-2">
                <Chip color={isPassed ? "success" : "danger"} size="sm" variant="soft">
                    {t(isPassed ? "submission.pass" : "submission.fail")}
                </Chip>
                <Typography type="body-xs" color="muted">
                    {t("submission.score", { score: earnedScore, total: maxScore })} · {t("submission.passNeeded", { score: requiredScore })}
                </Typography>
            </div>

            {feedbacks.length > 0 ? (
                <div className="flex flex-col gap-2">
                    <Typography type="body-xs" weight="semibold" color="muted">
                        {t("submission.lastFeedback")}
                    </Typography>
                    {feedbacks.map((feedback) => (
                        <div key={feedback.id} className="flex gap-2">
                            <span
                                aria-label={t(`submission.severity.${feedback.severity}`)}
                                className={cn("mt-1.5 size-2 shrink-0 rounded-full", SEVERITY_DOT[feedback.severity])}
                            />
                            <div className="flex min-w-0 flex-col gap-0.5">
                                <Typography type="body-xs">{feedback.message}</Typography>
                                {feedback.location ? (
                                    <Typography type="body-xs" className="font-mono text-muted">
                                        {feedback.location}
                                    </Typography>
                                ) : null}
                                {feedback.suggestion ? (
                                    <Typography type="body-xs" color="muted">
                                        {t("submission.suggestion")}: {feedback.suggestion}
                                    </Typography>
                                ) : null}
                            </div>
                        </div>
                    ))}
                </div>
            ) : null}
        </div>
    )
}

export default LastAttemptResult
