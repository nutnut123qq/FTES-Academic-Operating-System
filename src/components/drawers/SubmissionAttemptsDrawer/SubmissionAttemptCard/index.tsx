"use client"

import React, { useCallback, useMemo } from "react"
import { Button, Card, Chip, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { dayjs, getTimeAgoLabel, getTimeAgoMessage } from "@/modules/dayjs"
import { Spacer } from "@/components/reuseable/Spacer"
import type { SubmissionAttemptEntity } from "@/modules/types/entities/submission-attempt"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { setSubmissionAttemptId } from "@/redux/slices/submission-attempt"
import { useFeedbackDetailsOverlayState } from "@/hooks/zustand/overlay/hooks"

/**
 * Props for a single submission-attempt card.
 */
export interface SubmissionAttemptCardProps extends WithClassNames<undefined> {
    /** The grading / attempt record to display. */
    submissionAttempt: SubmissionAttemptEntity
    /** Max points for the requirement (challenge submission), used for `score/max` display. */
    maxScore: number | undefined
}


/**
 * Card showing score, short feedback, and actions (view details / open submission) for one attempt.
 *
 * @param props - Attempt row and max score.
 */
export const SubmissionAttemptCard = (props: SubmissionAttemptCardProps) => {
    const { submissionAttempt, maxScore, className } = props
    const t = useTranslations()
    const dispatch = useAppDispatch()
    const { open: openFeedbackDetails } = useFeedbackDetailsOverlayState()
    const config = useAppSelector((state) => state.system.config)
    const [
        scoreLabel, 
        scoreColor
    ] = useMemo(
        () => {
            const max = maxScore ?? 0
            const requiredScore = (config?.challenge?.passThreshold ?? 0) * max
            // if the score is greater than the required score, return success
            let scoreColor: "danger" | "success" = "danger"
            if ((submissionAttempt.score ?? 0) >= requiredScore) {
                scoreColor = "success"
            }
            // if the score is less than the required score, return danger
            if ((submissionAttempt.score ?? 0) < requiredScore) {
                scoreColor = "danger"
            }
            return [`${submissionAttempt.score}/${max}`, scoreColor]
        }, [config?.challenge?.passThreshold, maxScore, submissionAttempt.score])

    const processedAgo = useMemo(() => {
        if (submissionAttempt.processedAt == null) {
            return null
        }
        return getTimeAgoLabel(getTimeAgoMessage(dayjs(submissionAttempt.processedAt)), t)
    }, [submissionAttempt.processedAt, t])

    /** Bind this attempt in Redux then open the feedback details overlay. */
    const onViewDetails = useCallback(() => {
        dispatch(setSubmissionAttemptId(submissionAttempt.id))
        openFeedbackDetails()
    }, [dispatch, openFeedbackDetails, submissionAttempt.id])

    /** Open this attempt's submission URL in a new browser tab. */
    const onViewSubmission = useCallback(() => {
        window.open(submissionAttempt.submissionUrl, "_blank")
    }, [submissionAttempt.submissionUrl])

    return (
        <Card className={cn("border border-divider bg-transparent shadow-none", className)}>
            <Card.Content>
                <div>
                    <div className="flex items-center justify-between gap-3">
                        <div className="font-semibold text-foreground">
                            {t("submissionAttempts.attemptLine", {
                                number: submissionAttempt.attemptNumber,
                            })}
                            {processedAgo != null ? (
                                <span className="font-normal text-muted">
                                    {" · "}
                                    {processedAgo}
                                </span>
                            ) : null}
                        </div>
                        <Chip
                            color={scoreColor}
                            size="sm"
                            variant="soft"
                        >
                            <Chip.Label>
                                {scoreLabel}
                            </Chip.Label>
                        </Chip>
                    </div>
                    <Spacer y={3} />
                    <div className="text-sm text-muted">
                        {submissionAttempt.shortFeedback ?? ""}
                    </div>
                    <Spacer y={3} />
                    <div className="flex items-center gap-1.5">
                        <Button
                            onPress={onViewDetails}
                        >
                            {t("submissionAttempts.viewDetails")}
                        </Button>
                        <Button
                            variant="secondary"
                            onPress={onViewSubmission}
                        >
                            {t("submissionAttempts.viewSubmission")}
                        </Button>
                    </div>
                </div>
            </Card.Content>
        </Card>
    )
}
