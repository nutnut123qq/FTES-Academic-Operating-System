"use client"

import React from "react"
import { Button, Typography, cn } from "@heroui/react"
import { CheckCircleIcon, XCircleIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"

import { EmptyContent } from "@/components/blocks/async/EmptyContent"
import { ErrorContent } from "@/components/blocks/async/ErrorContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"

import { useQuerySubjectAiSourcesSwr } from "../../hooks/useQuerySubjectAiSourcesSwr"
import { useMutateSubjectAiQuizSwr } from "../../hooks/useMutateSubjectAiQuizSwr"
import { ToolSurfaceHeader } from "../ToolSurfaceHeader"
import { SourcePicker } from "../SourcePicker"

/** Props for {@link SubjectAiQuiz}. */
export interface SubjectAiQuizProps {
    subjectId: string
    subjectCode: string
    onBack: () => void
    onGoResources: () => void
}

/** Question-count options. */
const COUNT_OPTIONS = [3, 5, 10]

/**
 * Quiz tool surface: pick a source + question count → generate a mock MCQ quiz
 * (accessible radio groups), answer, submit → score + per-question marking, with
 * retry / new-quiz actions.
 */
export const SubjectAiQuiz = ({
    subjectId,
    subjectCode,
    onBack,
    onGoResources,
}: SubjectAiQuizProps) => {
    const t = useTranslations()
    const headingRef = React.useRef<HTMLHeadingElement>(null)
    const { sources } = useQuerySubjectAiSourcesSwr(subjectId)
    const quizSwr = useMutateSubjectAiQuizSwr(subjectId)

    const [selectedId, setSelectedId] = React.useState<string | null>(null)
    const [count, setCount] = React.useState(5)
    const [answers, setAnswers] = React.useState<Record<string, number>>({})
    const [submitted, setSubmitted] = React.useState(false)

    React.useEffect(() => {
        headingRef.current?.focus()
    }, [])

    const selected = sources.find((s) => s.id === selectedId) ?? null
    const questions = quizSwr.data ?? []

    const generate = async () => {
        if (!selected) return
        setAnswers({})
        setSubmitted(false)
        try {
            await quizSwr.trigger({
                subjectCode,
                sourceTitle: selected.title,
                count,
            })
        } catch {
            // error rendered from quizSwr.error
        }
    }

    const score = questions.reduce(
        (acc, q) => acc + (answers[q.id] === q.answerIndex ? 1 : 0),
        0,
    )
    const allAnswered =
        questions.length > 0 &&
        questions.every((q) => answers[q.id] !== undefined)

    return (
        <div className="flex flex-col gap-6 p-6">
            <ToolSurfaceHeader
                title={t("subjects.aiTools.tools.quiz.title")}
                onBack={onBack}
                backLabel={t("common.back")}
                headingRef={headingRef}
            />

            {sources.length === 0 ? (
                <EmptyContent
                    title={t("subjects.aiTools.quiz.emptyTitle")}
                    description={t("subjects.aiTools.quiz.emptyDesc")}
                    onRetry={onGoResources}
                    retryLabel={t("subjects.aiTools.goResources")}
                />
            ) : questions.length === 0 && !quizSwr.isMutating ? (
                <>
                    <SourcePicker
                        label={t("subjects.aiTools.pickSource")}
                        sources={sources}
                        selectedId={selectedId}
                        onSelect={setSelectedId}
                    />
                    <div
                        role="radiogroup"
                        aria-label={t("subjects.aiTools.quiz.count")}
                        className="flex flex-col gap-2"
                    >
                        <Typography type="body-sm" weight="medium" color="muted">
                            {t("subjects.aiTools.quiz.count")}
                        </Typography>
                        <div className="flex gap-2">
                            {COUNT_OPTIONS.map((option) => {
                                const isSelected = count === option
                                return (
                                    <button
                                        key={option}
                                        type="button"
                                        role="radio"
                                        aria-checked={isSelected}
                                        onClick={() => setCount(option)}
                                        className={cn(
                                            "rounded-large border px-4 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-focus",
                                            isSelected
                                                ? "border-accent bg-accent/10 text-accent"
                                                : "border-default text-foreground hover:bg-default",
                                        )}
                                    >
                                        {option}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                    {quizSwr.error ? (
                        <ErrorContent
                            title={t("subjects.aiTools.quiz.errorTitle")}
                            description={t("subjects.aiTools.errorRetryHint")}
                            onRetry={generate}
                            retryLabel={t("subjects.aiTools.retry")}
                        />
                    ) : null}
                    <Button
                        variant="primary"
                        className="self-start"
                        isDisabled={!selected}
                        onPress={generate}
                    >
                        {t("subjects.aiTools.quiz.generate")}
                    </Button>
                </>
            ) : quizSwr.isMutating ? (
                <div className="flex flex-col gap-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div
                            key={i}
                            className="flex flex-col gap-2 rounded-3xl border border-separator p-4"
                        >
                            <Skeleton.Typography type="body-sm" width="2/3" />
                            <Skeleton.RadioGroup items={4} />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {submitted ? (
                        <div className="rounded-large border border-accent/40 bg-accent/5 p-4">
                            <Typography type="body" weight="bold">
                                {t("subjects.aiTools.quiz.score", {
                                    score,
                                    total: questions.length,
                                })}
                            </Typography>
                        </div>
                    ) : null}

                    {questions.map((question, qi) => (
                        <fieldset
                            key={question.id}
                            className="flex flex-col gap-2 rounded-3xl border border-separator p-4"
                        >
                            <legend className="text-sm font-medium">
                                {qi + 1}. {question.prompt}
                            </legend>
                            <div
                                role="radiogroup"
                                aria-label={question.prompt}
                                className="flex flex-col gap-2"
                            >
                                {question.options.map((option, oi) => {
                                    const isPicked = answers[question.id] === oi
                                    const isCorrect =
                                        question.answerIndex === oi
                                    const showMark = submitted && (isPicked || isCorrect)
                                    return (
                                        <button
                                            key={oi}
                                            type="button"
                                            role="radio"
                                            aria-checked={isPicked}
                                            disabled={submitted}
                                            onClick={() =>
                                                setAnswers((prev) => ({
                                                    ...prev,
                                                    [question.id]: oi,
                                                }))
                                            }
                                            className={cn(
                                                "flex items-center gap-2 rounded-large border p-3 text-left text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-focus",
                                                showMark && isCorrect
                                                    ? "border-success bg-success/10 text-success"
                                                    : showMark && isPicked
                                                        ? "border-danger bg-danger/10 text-danger"
                                                        : isPicked
                                                            ? "border-accent bg-accent/10 text-accent"
                                                            : "border-default hover:bg-default",
                                            )}
                                        >
                                            {showMark && isCorrect ? (
                                                <CheckCircleIcon
                                                    className="size-5 shrink-0"
                                                    aria-hidden
                                                    focusable="false"
                                                />
                                            ) : showMark && isPicked ? (
                                                <XCircleIcon
                                                    className="size-5 shrink-0"
                                                    aria-hidden
                                                    focusable="false"
                                                />
                                            ) : null}
                                            <span className="min-w-0 flex-1">
                                                {option}
                                            </span>
                                        </button>
                                    )
                                })}
                            </div>
                        </fieldset>
                    ))}

                    <div className="flex gap-2">
                        {submitted ? (
                            <>
                                <Button
                                    variant="secondary"
                                    onPress={() => {
                                        setAnswers({})
                                        setSubmitted(false)
                                    }}
                                >
                                    {t("subjects.aiTools.quiz.retry")}
                                </Button>
                                <Button
                                    variant="primary"
                                    onPress={() => {
                                        quizSwr.reset()
                                        setAnswers({})
                                        setSubmitted(false)
                                    }}
                                >
                                    {t("subjects.aiTools.quiz.newQuiz")}
                                </Button>
                            </>
                        ) : (
                            <Button
                                variant="primary"
                                isDisabled={!allAnswered}
                                onPress={() => setSubmitted(true)}
                            >
                                {t("subjects.aiTools.quiz.submit")}
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
