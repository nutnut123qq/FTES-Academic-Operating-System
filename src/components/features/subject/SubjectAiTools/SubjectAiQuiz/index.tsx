"use client"

import React from "react"
import { Button, Spinner, Typography, cn } from "@heroui/react"
import { CheckCircleIcon, XCircleIcon } from "@phosphor-icons/react"
import { useLocale, useTranslations } from "next-intl"

import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { EmptyContent } from "@/components/blocks/async/EmptyContent"
import { ErrorContent } from "@/components/blocks/async/ErrorContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { useRequireAuth } from "@/hooks/useRequireAuth"

import { useQuerySubjectAiResourceSourcesSwr } from "../../hooks/useQuerySubjectAiResourceSourcesSwr"
import { useMutateSubjectAiQuizSwr } from "../../hooks/useMutateSubjectAiQuizSwr"
import { ToolSurfaceHeader } from "../ToolSurfaceHeader"
import { SourcePicker } from "../SourcePicker"

/** Props for {@link SubjectAiQuiz}. */
export interface SubjectAiQuizProps {
    subjectId: string
    /** Subject code — part of the hub's shared tool-surface prop shape. */
    subjectCode?: string
    onBack: () => void
    onGoResources: () => void
}

/** Question-count options (sent as the BE `questionCount`). */
const COUNT_OPTIONS = [3, 5, 10]

/**
 * Quiz tool surface, wired to the REAL async quiz job.
 *
 * Pick a resource + question count → `POST /ai/learning/quiz` → poll
 * `GET /ai/jobs/{id}` → answer the worker's REAL questions in accessible radio
 * groups. Grading stays client-side against the normalized `answerIndex` (the
 * worker's `correct` may be an index, a letter, or the option text), so nothing is
 * sent back per answer.
 */
export const SubjectAiQuiz = ({
    subjectId,
    onBack,
    onGoResources,
}: SubjectAiQuizProps) => {
    const t = useTranslations()
    const locale = useLocale()
    const { guard } = useRequireAuth()
    const headingRef = React.useRef<HTMLHeadingElement>(null)
    const {
        sources,
        isLoading: isSourcesLoading,
        error: sourcesError,
        mutate: reloadSources,
    } = useQuerySubjectAiResourceSourcesSwr(subjectId)
    const quiz = useMutateSubjectAiQuizSwr()

    const [selectedId, setSelectedId] = React.useState<string | null>(null)
    const [count, setCount] = React.useState(5)
    const [answers, setAnswers] = React.useState<Record<string, number>>({})
    const [submitted, setSubmitted] = React.useState(false)

    React.useEffect(() => {
        headingRef.current?.focus()
    }, [])

    const selected = sources.find((source) => source.id === selectedId) ?? null
    const questions = quiz.questions

    const generate = guard(() => {
        if (!selected || quiz.isBusy) return
        setAnswers({})
        setSubmitted(false)
        quiz.generate({ resourceId: selected.id, count, language: locale })
    })

    /** Back to the picker with a clean slate (keeps the picked source). */
    const startOver = () => {
        setAnswers({})
        setSubmitted(false)
        quiz.reset()
    }

    const score = questions.reduce(
        (total, question) =>
            total + (answers[question.id] === question.answerIndex ? 1 : 0),
        0,
    )
    const allAnswered =
        questions.length > 0 &&
        questions.every((question) => answers[question.id] !== undefined)

    return (
        <div className="flex flex-col gap-6 p-6">
            <ToolSurfaceHeader
                title={t("subjects.aiTools.tools.quiz.title")}
                onBack={onBack}
                backLabel={t("common.back")}
                headingRef={headingRef}
            />

            <AsyncContent
                isLoading={isSourcesLoading && sources.length === 0}
                skeleton={
                    <div className="flex flex-col gap-2">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <Skeleton key={index} className="h-12 w-full rounded-2xl" />
                        ))}
                    </div>
                }
                error={!sources.length ? sourcesError : undefined}
                errorContent={{
                    title: t("subjects.aiTools.sourcesErrorTitle"),
                    onRetry: () => {
                        void reloadSources()
                    },
                    retryLabel: t("subjects.aiTools.retry"),
                }}
            >
                {sources.length === 0 ? (
                    <EmptyContent
                        title={t("subjects.aiTools.quiz.emptyTitle")}
                        description={t("subjects.aiTools.quiz.emptyDesc")}
                        onRetry={onGoResources}
                        retryLabel={t("subjects.aiTools.goResources")}
                    />
                ) : quiz.isBusy ? (
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col items-center gap-3 rounded-2xl border border-separator p-8 text-center">
                            <Spinner size="lg" />
                            <Typography type="body-sm" color="muted">
                                {t("subjects.aiTools.job.running")}
                            </Typography>
                            {quiz.isStale ? (
                                <div className="flex flex-col items-center gap-2">
                                    <Typography type="body-xs" color="muted">
                                        {t("subjects.aiTools.job.stale")}
                                    </Typography>
                                    <Button
                                        size="sm"
                                        variant="tertiary"
                                        onPress={() => quiz.refresh()}
                                    >
                                        {t("subjects.aiTools.job.refresh")}
                                    </Button>
                                </div>
                            ) : null}
                        </div>
                        {Array.from({ length: 2 }).map((_, index) => (
                            <div
                                key={index}
                                className="flex flex-col gap-2 rounded-2xl border border-separator p-4"
                            >
                                <Skeleton.Typography type="body-sm" width="2/3" />
                                <Skeleton.RadioGroup items={4} />
                            </div>
                        ))}
                    </div>
                ) : questions.length === 0 ? (
                    <div className="flex flex-col gap-6">
                        <SourcePicker
                            label={t("subjects.aiTools.pickSource")}
                            sources={sources}
                            selectedId={selectedId}
                            onSelect={setSelectedId}
                        />
                        <div className="flex flex-col gap-2">
                            <Typography type="body-sm" weight="medium" color="muted">
                                {t("subjects.aiTools.quiz.count")}
                            </Typography>
                            <div
                                role="radiogroup"
                                aria-label={t("subjects.aiTools.quiz.count")}
                                className="flex gap-2"
                            >
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

                        {quiz.errorKey ? (
                            <ErrorContent
                                title={t(`subjects.aiTools.job.${quiz.errorKey}`)}
                                description={
                                    quiz.failureMessage ??
                                    t("subjects.aiTools.errorRetryHint")
                                }
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
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {submitted ? (
                            <div className="rounded-2xl border border-accent/40 bg-accent/5 p-4">
                                <Typography type="body" weight="bold">
                                    {t("subjects.aiTools.quiz.score", {
                                        score,
                                        total: questions.length,
                                    })}
                                </Typography>
                            </div>
                        ) : null}

                        {questions.map((question, questionIndex) => (
                            <fieldset
                                key={question.id}
                                className="flex flex-col gap-2 rounded-2xl border border-separator p-4"
                            >
                                <legend className="text-sm font-medium">
                                    {questionIndex + 1}. {question.prompt}
                                </legend>
                                <div
                                    role="radiogroup"
                                    aria-label={question.prompt}
                                    className="flex flex-col gap-2"
                                >
                                    {question.options.map((option, optionIndex) => {
                                        const isPicked = answers[question.id] === optionIndex
                                        const isCorrect = question.answerIndex === optionIndex
                                        const showMark = submitted && (isPicked || isCorrect)
                                        return (
                                            <button
                                                key={optionIndex}
                                                type="button"
                                                role="radio"
                                                aria-checked={isPicked}
                                                disabled={submitted}
                                                onClick={() =>
                                                    setAnswers((prev) => ({
                                                        ...prev,
                                                        [question.id]: optionIndex,
                                                    }))
                                                }
                                                className={cn(
                                                    "flex items-center gap-2 rounded-2xl border p-3 text-left text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-focus",
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
                                                <span className="min-w-0 flex-1">{option}</span>
                                            </button>
                                        )
                                    })}
                                </div>

                                {/* A generation whose `correct` matched no option: say so instead of
                                    marking an arbitrary answer right. */}
                                {submitted && question.answerIndex < 0 ? (
                                    <Typography type="body-xs" color="muted">
                                        {t("subjects.aiTools.quiz.unknownAnswer")}
                                    </Typography>
                                ) : null}

                                {submitted && question.explanation ? (
                                    <div className="flex flex-col gap-1 rounded-xl bg-default/40 p-3">
                                        <Typography type="body-xs" weight="semibold">
                                            {t("subjects.aiTools.quiz.explanation")}
                                        </Typography>
                                        <Typography type="body-sm" color="muted">
                                            {question.explanation}
                                        </Typography>
                                    </div>
                                ) : null}
                            </fieldset>
                        ))}

                        {quiz.model ? (
                            <Typography type="body-xs" color="muted">
                                {t("subjects.aiTools.job.model", { model: quiz.model })}
                            </Typography>
                        ) : null}

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
                                    <Button variant="primary" onPress={startOver}>
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
            </AsyncContent>
        </div>
    )
}
