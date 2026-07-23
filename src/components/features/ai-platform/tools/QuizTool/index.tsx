"use client"

import React, { useState } from "react"
import { Button, Typography, cn } from "@heroui/react"
import { CheckCircleIcon, XCircleIcon } from "@phosphor-icons/react"
import { useLocale, useTranslations } from "next-intl"
import { submitQuizJob } from "@/modules/api/rest/ai"
import { useAiToolJob } from "../../hooks/useAiToolJob"
import { AiToolShell, AiToolModelNote } from "../AiToolShell"
import { AiJobFeedback } from "../AiToolResult"
import {
    LearningInput,
    emptyLearningInput,
    resolveLearningInputRef,
    isLearningInputReady,
    type LearningInputValue,
} from "../LearningInput"
import { isCorrectQuizOption, type QuizQuestion, type QuizResult } from "../types"

/** Selectable question counts. */
const QUESTION_COUNTS = [5, 10] as const
/** Selectable difficulty levels (i18n label under `quiz.difficulties.*`). */
const DIFFICULTIES = ["easy", "medium", "hard"] as const

/**
 * `/ai/tools/quiz` — generate a practice quiz from a passage or a studied lesson.
 * Questions are answered in place: picking an option grades it locally against the
 * result's `correct` field and reveals the explanation — no further BE call.
 */
export const QuizTool = () => {
    const t = useTranslations("aiPlatform.toolPages")
    const locale = useLocale()
    const [input, setInput] = useState<LearningInputValue>(emptyLearningInput)
    const [questionCount, setQuestionCount] = useState<number>(5)
    const [difficulty, setDifficulty] = useState<string>("medium")
    const job = useAiToolJob<QuizResult>()

    const submit = () =>
        void job.run(async () => {
            const ref = await resolveLearningInputRef(input)
            return submitQuizJob({
                ...ref,
                questionCount,
                difficulty,
                language: locale,
            })
        })

    const questions = job.poll.result?.questions ?? []
    const ready = isLearningInputReady(input) && !job.isBusy

    return (
        <AiToolShell toolKey="quiz">
            <LearningInput value={input} onChange={setInput} isDisabled={job.isBusy} />

            <div className="flex flex-wrap gap-6">
                <div className="flex flex-col gap-2">
                    <Typography type="body-sm" weight="medium">
                        {t("quiz.count")}
                    </Typography>
                    <div className="flex gap-2">
                        {QUESTION_COUNTS.map((count) => (
                            <Button
                                key={count}
                                size="sm"
                                variant={questionCount === count ? "primary" : "secondary"}
                                onPress={() => setQuestionCount(count)}
                                isDisabled={job.isBusy}
                            >
                                {count}
                            </Button>
                        ))}
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    <Typography type="body-sm" weight="medium">
                        {t("quiz.difficulty")}
                    </Typography>
                    <div className="flex gap-2">
                        {DIFFICULTIES.map((level) => (
                            <Button
                                key={level}
                                size="sm"
                                variant={difficulty === level ? "primary" : "secondary"}
                                onPress={() => setDifficulty(level)}
                                isDisabled={job.isBusy}
                            >
                                {t(`quiz.difficulties.${level}`)}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            <Button variant="primary" onPress={submit} isDisabled={!ready} isPending={job.isBusy}>
                {job.isBusy ? t("running") : t("run")}
            </Button>

            <AiJobFeedback job={job} onRetry={submit} />

            {questions.length ? (
                <Quiz questions={questions} model={job.poll.result?.model} />
            ) : null}
        </AiToolShell>
    )
}

/** The answerable quiz body — owns per-question selection + a running score. */
const Quiz = ({ questions, model }: { questions: Array<QuizQuestion>, model?: string }) => {
    const t = useTranslations("aiPlatform.toolPages.quiz")
    // questionIndex → chosen option index.
    const [answers, setAnswers] = useState<Record<number, number>>({})

    const answeredCount = Object.keys(answers).length
    const correctCount = Object.entries(answers).filter(([qIndex, chosen]) => {
        const question = questions[Number(qIndex)]
        return isCorrectQuizOption(question.correct, chosen, question.options[chosen] ?? "")
    }).length

    return (
        <div className="flex flex-col gap-5">
            {answeredCount === questions.length ? (
                <div className="rounded-2xl border border-accent/40 bg-accent/5 p-4">
                    <Typography type="body" weight="semibold" className="text-accent">
                        {t("score", { correct: correctCount, total: questions.length })}
                    </Typography>
                </div>
            ) : null}

            {questions.map((question, qIndex) => {
                const chosen = answers[qIndex]
                const answered = chosen !== undefined
                return (
                    <section key={qIndex} className="flex flex-col gap-3 rounded-2xl border border-separator p-4">
                        <Typography type="body-sm" weight="semibold">
                            {qIndex + 1}. {question.question}
                        </Typography>
                        <div className="flex flex-col gap-2">
                            {question.options.map((option, oIndex) => {
                                const isThisCorrect = isCorrectQuizOption(question.correct, oIndex, option)
                                const isChosen = chosen === oIndex
                                // Reveal correctness only after the learner answers.
                                const tone = !answered
                                    ? "idle"
                                    : isThisCorrect
                                        ? "correct"
                                        : isChosen
                                            ? "wrong"
                                            : "idle"
                                return (
                                    <button
                                        key={oIndex}
                                        type="button"
                                        disabled={answered}
                                        onClick={() => setAnswers((prev) => ({ ...prev, [qIndex]: oIndex }))}
                                        className={cn(
                                            "flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-colors",
                                            tone === "idle" && "border-separator",
                                            tone === "idle" && !answered && "hover:border-default hover:bg-default/40",
                                            tone === "correct" && "border-success/50 bg-success/10",
                                            tone === "wrong" && "border-danger/50 bg-danger/10",
                                            answered && "cursor-default",
                                        )}
                                    >
                                        {answered && isThisCorrect ? (
                                            <CheckCircleIcon aria-hidden focusable="false" className="size-4 shrink-0 text-success" />
                                        ) : answered && isChosen ? (
                                            <XCircleIcon aria-hidden focusable="false" className="size-4 shrink-0 text-danger" />
                                        ) : null}
                                        <span className="min-w-0">{option}</span>
                                    </button>
                                )
                            })}
                        </div>
                        {answered ? (
                            <div className="flex flex-col gap-1 rounded-xl bg-default/40 p-3">
                                <Typography type="body-xs" weight="semibold">
                                    {isCorrectQuizOption(question.correct, chosen, question.options[chosen] ?? "")
                                        ? t("correct")
                                        : t("incorrect")}
                                </Typography>
                                {question.explanation ? (
                                    <Typography type="body-sm" color="muted">
                                        {question.explanation}
                                    </Typography>
                                ) : null}
                            </div>
                        ) : null}
                    </section>
                )
            })}

            <AiToolModelNote model={model} />
        </div>
    )
}
