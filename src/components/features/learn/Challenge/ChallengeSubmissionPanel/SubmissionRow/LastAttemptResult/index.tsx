"use client"

import React from "react"
import {
    cn,
    Chip,
    Typography,
} from "@heroui/react"
import {
    useTranslations,
} from "next-intl"
import { SubmissionFeedbackSeverity } from "@/modules/types/enums/submission-feedback-severity"
import type { SubmissionFeedbackEntity } from "@/modules/types/entities/submission-feedback"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link LastAttemptResult}. */
export interface LastAttemptResultProps extends WithClassNames<undefined> {
    /** Score earned on the most recent grading attempt. */
    earnedScore: number
    /** Maximum score the requirement is worth. */
    maxScore: number
    /** Fraction of the max score required to pass (0..1). */
    passThreshold: number
    /** Structured feedback items from the last attempt (severity / location / suggestion). */
    feedbacks?: Array<SubmissionFeedbackEntity>
}

/** Dot colour per feedback severity (high = danger, medium = warning, low = info). */
const SEVERITY_DOT: Record<SubmissionFeedbackSeverity, string> = {
    [SubmissionFeedbackSeverity.High]: "bg-danger",
    [SubmissionFeedbackSeverity.Medium]: "bg-warning",
    [SubmissionFeedbackSeverity.Low]: "bg-info",
}

/**
 * The last grading attempt's result: a pass/fail chip + earned-vs-required score line,
 * then the structured AI feedback (one row per item: a severity dot + message, with an
 * optional source location and suggested fix). The feedback is the whole point of the
 * AI grade — the learner reads WHY they passed/failed, not just the number.
 *
 * Presentational: derives pass state + renders the supplied feedback; no logic.
 * @param props - {@link LastAttemptResultProps}
 */
export const LastAttemptResult = ({
    earnedScore,
    maxScore,
    passThreshold,
    feedbacks,
    className,
}: LastAttemptResultProps) => {
    const t = useTranslations()
    const requiredScore = maxScore * passThreshold
    const isPassed = earnedScore >= requiredScore
    const items = [...(feedbacks ?? [])].sort((prev, next) => prev.sortIndex - next.sortIndex)
    return (
        <div className={cn("mt-4 flex flex-col gap-3 border-t border-divider pt-4", className)}>
            <div className="flex items-center gap-2">
                <Chip color={isPassed ? "success" : "danger"} size="sm" variant="soft">
                    <Chip.Label>
                        {t(isPassed ? "challenge.pass" : "challenge.fail")}
                    </Chip.Label>
                </Chip>
                <Typography type="body-xs" className="text-muted">
                    {t.rich("challenge.submissionModal.lastAttemptScoreWithRequirement", {
                        earned: earnedScore,
                        max: maxScore,
                        required: requiredScore,
                        n: (chunks) => (
                            <span className="text-foreground">{chunks}</span>
                        ),
                    })}
                </Typography>
            </div>

            {items.length > 0 ? (
                <div className="flex flex-col gap-2">
                    <Typography type="body-xs" weight="semibold" color="muted">
                        {t("challenge.lastFeedback")}
                    </Typography>
                    {items.map((feedback) => (
                        <div key={feedback.id} className="flex gap-2">
                            <span
                                aria-label={feedback.severity}
                                className={cn("mt-1.5 size-2 shrink-0 rounded-full", SEVERITY_DOT[feedback.severity])}
                            />
                            <div className="flex min-w-0 flex-col gap-0.5">
                                <Typography type="body-xs" className="text-foreground">
                                    {feedback.message}
                                </Typography>
                                {feedback.location ? (
                                    <Typography type="body-xs" className="font-mono text-muted">
                                        {feedback.location}
                                    </Typography>
                                ) : null}
                                {feedback.suggestion ? (
                                    <Typography type="body-xs" color="muted">
                                        {t("feedback.suggestion")}: {feedback.suggestion}
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
