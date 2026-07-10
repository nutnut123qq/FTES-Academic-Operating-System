"use client"

import React, { useMemo, useState } from "react"
import { Button, TextArea, TextField, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { ProgressMeter } from "@/components/blocks/stats/ProgressMeter"
import { usePostSaveMockInterviewAnswerSwr } from "@/hooks/swr/api/rest/mutations/usePostSaveMockInterviewAnswerSwr"
import { usePostSyncMockInterviewTurnsSwr } from "@/hooks/swr/api/rest/mutations/usePostSyncMockInterviewTurnsSwr"
import { usePostGradeMockInterviewSessionSwr } from "@/hooks/swr/api/rest/mutations/usePostGradeMockInterviewSessionSwr"
import type { ScorecardView } from "@/modules/api/rest/mockinterview"
import type { ActiveSession } from "./index"

/** Props for {@link SessionRunner}. */
export interface SessionRunnerProps {
    session: ActiveSession
    onGraded: (scorecard: ScorecardView) => void
    onCancel: () => void
}

/**
 * Runs a drawn/resumed session: shows one question at a time with a text answer, persists each
 * answer + syncs the transcript for resume, and on the last question grades the whole transcript.
 *
 * @param props - {@link SessionRunnerProps}
 */
export const SessionRunner = ({ session, onGraded, onCancel }: SessionRunnerProps) => {
    const t = useTranslations("learn")
    const save = usePostSaveMockInterviewAnswerSwr()
    const sync = usePostSyncMockInterviewTurnsSwr()
    const grade = usePostGradeMockInterviewSessionSwr()

    const initialAnswers = useMemo(() => {
        const map: Record<number, string> = {}
        session.initialTurns.forEach((turn) => {
            map[turn.questionIndex] = turn.answer
        })
        return map
    }, [session])

    const total = session.seedTopics.length
    const [answers, setAnswers] = useState<Record<number, string>>(initialAnswers)
    const [index, setIndex] = useState<number>(Math.min(Math.max(session.initialIndex, 0), total - 1))
    const [failed, setFailed] = useState(false)

    const topic = session.seedTopics[index]
    const isLast = index === total - 1
    const busy = grade.isMutating || sync.isMutating

    const persist = async (target: number) => {
        try {
            await save.trigger({
                sessionId: session.sessionId,
                request: { questionIndex: target, answer: answers[target] ?? "" },
            })
        } catch {
            // best-effort per-answer save; the full transcript is synced before grade
        }
    }

    const goTo = async (next: number) => {
        await persist(index)
        setIndex(next)
    }

    const submit = async () => {
        setFailed(false)
        try {
            const turns = session.seedTopics.map((_, i) => ({
                questionIndex: i,
                answer: answers[i] ?? "",
            }))
            await sync.trigger({ sessionId: session.sessionId, request: { turns, questionIndex: index } })
            const card = await grade.trigger(session.sessionId)
            onGraded(card)
        } catch {
            setFailed(true)
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <ProgressMeter
                value={index + 1}
                max={total}
                label={t("mockInterview.questionProgress", { index: index + 1, total })}
                showValue
            />

            <div className="flex flex-col gap-2 rounded-2xl border border-default bg-surface p-4">
                <Typography type="body-xs" color="muted">{topic.title}</Typography>
                <Typography type="body">{topic.prompt}</Typography>
            </div>

            <TextField variant="primary" className="w-full">
                <TextArea
                    rows={6}
                    value={answers[index] ?? ""}
                    onChange={(event) =>
                        setAnswers((prev) => ({ ...prev, [index]: event.target.value }))
                    }
                    placeholder={t("mockInterview.answerPlaceholder")}
                    aria-label={t("mockInterview.answerPlaceholder")}
                    className="resize-none"
                />
            </TextField>

            {failed ? (
                <Typography type="body-xs" className="text-danger">{t("mockInterview.gradeFailed")}</Typography>
            ) : null}

            <div className="flex items-center justify-between gap-2">
                <Button variant="tertiary" size="sm" onPress={onCancel} isDisabled={busy}>
                    {t("mockInterview.cancel")}
                </Button>
                <div className="flex gap-2">
                    {index > 0 ? (
                        <Button variant="secondary" size="sm" onPress={() => void goTo(index - 1)} isDisabled={busy}>
                            {t("mockInterview.prev")}
                        </Button>
                    ) : null}
                    {isLast ? (
                        <Button
                            variant="primary"
                            size="sm"
                            onPress={() => void submit()}
                            isDisabled={busy}
                            isPending={busy}
                        >
                            {t("mockInterview.submit")}
                        </Button>
                    ) : (
                        <Button variant="primary" size="sm" onPress={() => void goTo(index + 1)}>
                            {t("mockInterview.next")}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}

export default SessionRunner
