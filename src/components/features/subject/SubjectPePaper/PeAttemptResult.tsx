"use client"

import React, { useMemo } from "react"
import { Chip, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"

import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { GradeResultCard } from "@/components/features/challenge/ChallengeView/GradeCodePanel/GradeResultCard"
import { useQueryPeResultSwr } from "@/components/features/resource/hooks/useQueryPeResultSwr"
import type { CodeGradeResult } from "@/modules/api/rest/ai"
import type { PeResultView } from "@/modules/api/rest/resource"

/**
 * Maps a PE grade onto the shared {@link CodeGradeResult} shape so the house
 * {@link GradeResultCard} renders it — same score/verdict header, rubric table, feedback
 * and improvement bullets the challenge grader uses.
 *
 * `model_note` is left empty on purpose: the card prints it as the model's own caveat,
 * and the PE payload has no equivalent field. The grader's relevance judgement is a
 * different statement about the ANSWER, so it is rendered separately above the card.
 *
 * @param result - The BE grade payload.
 * @returns The card's input.
 */
const toGradeResult = (result: PeResultView): CodeGradeResult => ({
    score: result.score,
    max: result.maxScore,
    verdict: result.verdict,
    criteria: result.criteria,
    feedback: result.feedback,
    improvements: result.improvements,
    model: result.submission.gradingModel,
})

/** Relevance verdict → chip tone; an unknown value keeps the neutral chip. */
const relevanceColor = (relevance: string): "success" | "warning" | "danger" | undefined => {
    switch (relevance.toUpperCase()) {
    case "RELEVANT":
    case "ON_TOPIC":
        return "success"
    case "PARTIAL":
    case "PARTIALLY_RELEVANT":
        return "warning"
    case "IRRELEVANT":
    case "OFF_TOPIC":
        return "danger"
    default:
        return undefined
    }
}

/** Props for {@link PeAttemptResult}. */
export interface PeAttemptResultProps {
    /** The PE resource the attempt belongs to. */
    resourceId: string
    /** The attempt to render. */
    submissionId: string
}

/**
 * The AI grade of ONE scored PE attempt
 * (`GET /resources/{id}/pe-submissions/{submissionId}/results`).
 *
 * Mounted only for an attempt the list already reports as `SCORED` — the results
 * endpoint has nothing to answer before that, and asking early would surface a 404 as a
 * failure the student cannot act on.
 *
 * @param props - {@link PeAttemptResultProps}
 */
export const PeAttemptResult = ({ resourceId, submissionId }: PeAttemptResultProps) => {
    const t = useTranslations("subjects")
    const resultSwr = useQueryPeResultSwr(resourceId, submissionId, true)

    const grade = useMemo(
        () => (resultSwr.data ? toGradeResult(resultSwr.data) : null),
        [resultSwr.data],
    )

    return (
        <AsyncContent
            isLoading={!resultSwr.data && !resultSwr.error}
            skeleton={<Skeleton className="h-48 w-full rounded-3xl" />}
            error={!resultSwr.data ? resultSwr.error : undefined}
            errorContent={{
                title: t("practice.pe.resultError"),
                onRetry: () => {
                    void resultSwr.mutate()
                },
                retryLabel: t("practice.exam.retry"),
            }}
        >
            {grade && resultSwr.data ? (
                <div className="flex flex-col gap-3">
                    {resultSwr.data.relevance ? (
                        <div className="flex flex-col gap-1">
                            <Chip
                                size="sm"
                                variant="soft"
                                color={relevanceColor(resultSwr.data.relevance)}
                                className="w-fit"
                            >
                                {t("practice.pe.relevance", {
                                    relevance: resultSwr.data.relevance,
                                })}
                            </Chip>
                            {resultSwr.data.relevanceReason ? (
                                <Typography type="body-xs" color="muted">
                                    {resultSwr.data.relevanceReason}
                                </Typography>
                            ) : null}
                        </div>
                    ) : null}
                    <GradeResultCard result={grade} />
                </div>
            ) : null}
        </AsyncContent>
    )
}
