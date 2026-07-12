"use client"

import React, { useState } from "react"
import { Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import type { FinishAttemptView, StartAttemptView, SubmitAnswerView } from "@/modules/api/rest/interview"
import { GreenRoom } from "./GreenRoom"
import { SessionRunner } from "./SessionRunner"
import { Scorecard } from "./Scorecard"

type Phase = "greenroom" | "session" | "scorecard"

/** Active attempt context passed from the green room into the runner. */
export interface ActiveAttempt {
    attemptId: string
    questionSetId: string
    questions: StartAttemptView["questions"]
}

/**
 * Course AI interview surface (feature root) — green room → question runner →
 * scorecard. Reads `courseId` from the route; enrollment is enforced by the
 * backend.
 */
export const CourseInterview = () => {
    const t = useTranslations("learn")
    const { courseId } = useParams<{ courseId: string }>()
    const [phase, setPhase] = useState<Phase>("greenroom")
    const [active, setActive] = useState<ActiveAttempt | null>(null)
    const [scorecard, setScorecard] = useState<FinishAttemptView | null>(null)
    const [results, setResults] = useState<Record<string, SubmitAnswerView>>({})

    const handleStarted = (attempt: StartAttemptView, questionSetId: string) => {
        setActive({
            attemptId: attempt.attemptId,
            questionSetId,
            questions: attempt.questions ?? [],
        })
        setScorecard(null)
        setResults({})
        setPhase("session")
    }

    const handleGraded = (card: FinishAttemptView, sessionResults: Record<string, SubmitAnswerView>) => {
        setScorecard(card)
        setResults(sessionResults)
        setPhase("scorecard")
    }

    const restart = () => {
        setActive(null)
        setScorecard(null)
        setResults({})
        setPhase("greenroom")
    }

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
            <div className="flex flex-col gap-2">
                <Typography type="h4">{t("courseInterview.title")}</Typography>
                <Typography type="body-sm" color="muted">{t("courseInterview.subtitle")}</Typography>
            </div>

            {phase === "greenroom" ? (
                <GreenRoom courseId={courseId} onStarted={handleStarted} />
            ) : phase === "session" && active ? (
                <SessionRunner
                    attemptId={active.attemptId}
                    questionSetId={active.questionSetId}
                    questions={active.questions}
                    onGraded={handleGraded}
                    onCancel={restart}
                />
            ) : phase === "scorecard" && scorecard ? (
                <Scorecard scorecard={scorecard} results={results} onRetry={restart} />
            ) : null}
        </div>
    )
}

export default CourseInterview
