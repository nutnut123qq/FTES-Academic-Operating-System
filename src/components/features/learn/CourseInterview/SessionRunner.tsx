"use client"

import React, { useMemo, useState } from "react"
import { Button, Radio, RadioGroup, TextArea, TextField, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { ProgressMeter } from "@/components/blocks/stats/ProgressMeter"
import {
    usePostSubmitInterviewAnswerSwr,
    usePostFinishInterviewAttemptSwr,
} from "@/hooks/swr/api/rest/mutations"
import type {
    FinishAttemptView,
    InterviewQuestionType,
    InterviewQuestionView,
    SubmitAnswerView,
} from "@/modules/api/rest/interview"
import { OralVivaPanel } from "./OralVivaPanel"

/** Local answer state for one question. */
interface LocalAnswer {
    type: InterviewQuestionType
    answer?: string
    selectedOption?: number
}

/** Props for {@link SessionRunner}. */
export interface SessionRunnerProps {
    attemptId: string
    questionSetId: string
    questions: InterviewQuestionView[]
    onGraded: (scorecard: FinishAttemptView, results: Record<string, SubmitAnswerView>) => void
    onCancel: () => void
}

/**
 * Runs the interview attempt one question at a time. Renders MCQ radio options,
 * ESSAY textarea, or the interactive ORAL viva panel. Persists answers as the
 * learner navigates and finishes the attempt on the last question.
 */
export const SessionRunner = ({
    attemptId,
    questionSetId,
    questions,
    onGraded,
    onCancel,
}: SessionRunnerProps) => {
    const t = useTranslations("learn")
    const submitAnswer = usePostSubmitInterviewAnswerSwr()
    const finish = usePostFinishInterviewAttemptSwr()

    const [index, setIndex] = useState(0)
    const [answers, setAnswers] = useState<Record<string, LocalAnswer>>({})
    const [results, setResults] = useState<Record<string, SubmitAnswerView>>({})
    const [failed, setFailed] = useState(false)

    const total = questions.length
    const question = questions[index] ?? null
    const isLast = index === total - 1
    const busy = submitAnswer.isMutating || finish.isMutating

    const currentAnswer = question ? answers[question.id] : undefined

    const setCurrentAnswer = (patch: Partial<LocalAnswer>) => {
        if (!question) return
        setAnswers((prev) => ({
            ...prev,
            [question.id]: {
                ...(prev[question.id] ?? { type: question.type, answer: "", selectedOption: undefined }),
                type: question.type,
                ...patch,
            },
        }))
    }

    const persist = async (targetId: string) => {
        const local = answers[targetId]
        const target = questions.find((q) => q.id === targetId)
        if (!target || !local) return

        // ORAL answers are persisted by the viva panel on each turn.
        if (local.type === "ORAL") return

        try {
            const result = await submitAnswer.trigger({
                attemptId,
                request: {
                    questionId: targetId,
                    type: local.type,
                    answer: local.answer,
                    selectedOption: local.selectedOption,
                },
            })
            setResults((prev) => ({ ...prev, [targetId]: result }))
        } catch {
            // navigation will surface the failure via the failed banner
        }
    }

    const goTo = async (next: number) => {
        if (!question) return
        await persist(question.id)
        setIndex(next)
    }

    const submit = async () => {
        if (!question) return
        setFailed(false)
        try {
            await persist(question.id)
            const card = await finish.trigger(attemptId)
            onGraded(card, results)
        } catch {
            setFailed(true)
        }
    }

    const handleOralPersisted = (result: SubmitAnswerView) => {
        setResults((prev) => ({ ...prev, [result.questionId]: result }))
    }

    if (!question) {
        return (
            <div className="flex flex-col gap-4 rounded-2xl border border-default bg-surface p-6">
                <Typography type="body-sm" color="muted">{t("courseInterview.emptyQuestions")}</Typography>
                <Button variant="tertiary" size="sm" onPress={onCancel}>{t("courseInterview.cancel")}</Button>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            <ProgressMeter
                value={index + 1}
                max={total}
                label={t("courseInterview.questionProgress", { index: index + 1, total })}
                showValue
            />

            <div className="flex flex-col gap-2 rounded-2xl border border-default bg-surface p-4">
                <Typography type="body-xs" color="muted">{t(`courseInterview.type.${question.type}`)}</Typography>
                <Typography type="body">{question.prompt}</Typography>
            </div>

            {question.type === "MCQ" ? (
                <RadioGroup
                    aria-label={question.prompt}
                    value={currentAnswer?.selectedOption?.toString() ?? ""}
                    onChange={(next) => setCurrentAnswer({ selectedOption: Number(next) })}
                    className="flex flex-col gap-2"
                >
                    {(question.options ?? []).map((option, optionIndex) => (
                        <Radio key={optionIndex} value={String(optionIndex)} className="w-full">
                            {({ isSelected }) => (
                                <div
                                    className={`flex w-full items-center gap-2 rounded-xl border px-3 py-3 text-sm transition-colors ${
                                        isSelected
                                            ? "border-accent bg-accent/10 font-medium"
                                            : "border-default bg-surface hover:bg-default"
                                    }`}
                                >
                                    <span className="tabular-nums text-muted">{optionIndex + 1}.</span>
                                    <span>{option}</span>
                                </div>
                            )}
                        </Radio>
                    ))}
                </RadioGroup>
            ) : question.type === "ESSAY" ? (
                <TextField variant="primary" className="w-full">
                    <TextArea
                        rows={8}
                        value={currentAnswer?.answer ?? ""}
                        onChange={(event) => setCurrentAnswer({ answer: event.target.value })}
                        placeholder={t("courseInterview.answerPlaceholder")}
                        aria-label={t("courseInterview.answerPlaceholder")}
                        className="resize-none"
                    />
                </TextField>
            ) : question.type === "ORAL" ? (
                <OralVivaPanel
                    attemptId={attemptId}
                    questionSetId={questionSetId}
                    questionId={question.id}
                    prompt={question.prompt}
                    onPersisted={handleOralPersisted}
                />
            ) : null}

            {failed ? (
                <Typography type="body-xs" className="text-danger">{t("courseInterview.gradeFailed")}</Typography>
            ) : null}

            <div className="flex items-center justify-between gap-2">
                <Button variant="tertiary" size="sm" onPress={onCancel} isDisabled={busy}>
                    {t("courseInterview.cancel")}
                </Button>
                <div className="flex gap-2">
                    {index > 0 ? (
                        <Button
                            variant="secondary"
                            size="sm"
                            onPress={() => void goTo(index - 1)}
                            isDisabled={busy}
                        >
                            {t("courseInterview.prev")}
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
                            {t("courseInterview.submit")}
                        </Button>
                    ) : (
                        <Button
                            variant="primary"
                            size="sm"
                            onPress={() => void goTo(index + 1)}
                            isDisabled={busy}
                        >
                            {t("courseInterview.next")}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
