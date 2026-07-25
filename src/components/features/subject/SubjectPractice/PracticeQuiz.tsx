"use client"

import React, { useState } from "react"
import { Button, Chip, Typography, cn } from "@heroui/react"
import {
    ArrowLeftIcon,
    CheckCircleIcon,
    CheckSquareIcon,
    CircleIcon,
    InfoIcon,
    SparkleIcon,
    SquareIcon,
    TargetIcon,
    XCircleIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"

import { EmptyContent } from "@/components/blocks/async/EmptyContent"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import type { PracticeQuestionView } from "@/modules/api/rest/subject/types"
import {
    useMutateDrawPracticeQuizSwr,
    useMutateSubmitPracticeQuizSwr,
} from "../hooks/useMutateSubjectPracticeQuizSwr"
import {
    isSingleChoiceQuestion,
    resolvePracticeErrorKey,
    toggleSelection,
    type PracticeOptionState,
    type PracticeQuizResult,
    type PracticeResultQuestion,
} from "./practiceQuizLogic"

/** Question-count presets offered before a run (BE default 10, hard cap 50). */
const COUNT_OPTIONS = [5, 10, 20] as const

/** Props for {@link PracticeQuiz}. */
export interface PracticeQuizProps {
    /** The `[subjectId]` route segment (a subject code). */
    subjectId: string
    /** Return to the practice hub. */
    onBack: () => void
    /** Opens the subject's AI tools tab — offered when the bank is still empty. */
    onOpenAiTools: () => void
}

/** The three in-panel phases of a practice run. */
type QuizPhase = "intro" | "taking" | "result"

/**
 * Practice quiz for a subject — the real thing, backed by
 * `GET /api/v1/subjects/{code}/practice/quiz` + `POST …/quiz/submit`.
 *
 * Draw a random set from the subject's question bank (the served payload carries NO
 * answers), answer with radios (`SINGLE_CHOICE` / `TRUE_FALSE`) or checkboxes
 * (`MULTIPLE_CHOICE`), then submit: the score, the correct keys and the explanations
 * all come from the grading response — nothing is graded on the client. Practice is
 * ephemeral (no attempt row), so retaking is free.
 *
 * A subject whose bank has no ready questions answers `questions: []`; that renders an
 * empty state that hands the learner to the AI Quiz generator instead of an error.
 */
export const PracticeQuiz = ({ subjectId, onBack, onOpenAiTools }: PracticeQuizProps) => {
    const t = useTranslations("subjects")
    const code = subjectId ? subjectId.toUpperCase() : ""
    const { guard } = useRequireAuth()

    const draw = useMutateDrawPracticeQuizSwr()
    const submit = useMutateSubmitPracticeQuizSwr()

    const [phase, setPhase] = useState<QuizPhase>("intro")
    const [count, setCount] = useState<number>(10)
    const [questions, setQuestions] = useState<Array<PracticeQuestionView>>([])
    const [selections, setSelections] = useState<Record<string, Array<string>>>({})
    const [result, setResult] = useState<PracticeQuizResult | null>(null)
    const [errorKey, setErrorKey] = useState<string | null>(null)
    const [bankEmpty, setBankEmpty] = useState(false)

    const answeredCount = questions.filter(
        (question) => (selections[question.id] ?? []).length > 0,
    ).length

    /** Draws a set and enters the taking phase (or the empty state when the bank is dry). */
    const startRun = async (nextCount: number) => {
        setErrorKey(null)
        try {
            const view = await draw.trigger({ code, count: nextCount })
            const drawn = view?.questions ?? []
            setQuestions(drawn)
            setSelections({})
            setResult(null)
            setBankEmpty(drawn.length === 0)
            setPhase(drawn.length === 0 ? "intro" : "taking")
        } catch (error) {
            setErrorKey(resolvePracticeErrorKey(error))
        }
    }

    /** Submits every drawn question (blank ones included) and shows the graded sheet. */
    const submitRun = async () => {
        setErrorKey(null)
        try {
            const graded = await submit.trigger({ code, questions, selections })
            if (graded) {
                setResult(graded)
                setPhase("result")
            }
        } catch (error) {
            setErrorKey(resolvePracticeErrorKey(error))
        }
    }

    const onToggle = (question: PracticeQuestionView, key: string) => {
        setSelections((prev) => ({
            ...prev,
            [question.id]: toggleSelection(prev[question.id] ?? [], key, question.type),
        }))
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center gap-2">
                <Button
                    size="sm"
                    variant="tertiary"
                    isIconOnly
                    aria-label={t("practice.backToHub")}
                    onPress={onBack}
                >
                    <ArrowLeftIcon className="size-5" aria-hidden focusable="false" />
                </Button>
                <Typography type="h5" weight="bold" className="flex-1">
                    {t("practice.modules.quiz.title")}
                </Typography>
                {phase === "taking" ? (
                    <Chip size="sm" variant="soft" color="accent">
                        {t("practice.quiz.answeredProgress", {
                            answered: answeredCount,
                            total: questions.length,
                        })}
                    </Chip>
                ) : null}
            </div>

            {errorKey ? (
                <div className="flex items-center gap-2 rounded-2xl border border-danger/40 bg-danger/5 p-4">
                    <InfoIcon aria-hidden focusable="false" className="size-5 shrink-0 text-danger" />
                    <Typography type="body-sm" className="flex-1 text-danger">
                        {t(`practice.errors.${errorKey}`)}
                    </Typography>
                </div>
            ) : null}

            {phase === "intro" ? (
                bankEmpty ? (
                    <EmptyContent
                        icon={<TargetIcon aria-hidden focusable="false" className="size-8 text-muted" />}
                        title={t("practice.quiz.empty")}
                        description={t("practice.quiz.emptyDesc")}
                        action={
                            <div className="flex flex-wrap items-center justify-center gap-2">
                                <Button size="sm" variant="secondary" onPress={guard(() => void startRun(count))}>
                                    {t("practice.quiz.retry")}
                                </Button>
                                <Button size="sm" variant="primary" onPress={onOpenAiTools}>
                                    <SparkleIcon aria-hidden focusable="false" className="size-4" />
                                    {t("practice.quizHandoff.cta")}
                                </Button>
                            </div>
                        }
                    />
                ) : (
                    <div className="mx-auto flex w-full max-w-xl flex-col gap-4 rounded-3xl border border-separator p-6">
                        <Typography type="body-sm" color="muted">
                            {t("practice.quiz.intro")}
                        </Typography>
                        <div className="flex flex-col gap-2">
                            <Typography type="body-sm" weight="medium">
                                {t("practice.quiz.countLabel")}
                            </Typography>
                            <div className="flex flex-wrap gap-2">
                                {COUNT_OPTIONS.map((option) => (
                                    <Button
                                        key={option}
                                        size="sm"
                                        variant={option === count ? "primary" : "secondary"}
                                        aria-pressed={option === count}
                                        onPress={() => setCount(option)}
                                    >
                                        {t("practice.quiz.countOption", { count: option })}
                                    </Button>
                                ))}
                            </div>
                        </div>
                        <Button
                            variant="primary"
                            className="self-start"
                            isPending={draw.isMutating}
                            isDisabled={draw.isMutating}
                            onPress={guard(() => void startRun(count))}
                        >
                            {t(draw.isMutating ? "practice.quiz.drawing" : "practice.quiz.start")}
                        </Button>
                        <Typography type="body-xs" color="muted">
                            {t("practice.quiz.ephemeralNote")}
                        </Typography>
                    </div>
                )
            ) : null}

            {phase === "taking" ? (
                <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
                    {questions.map((question, index) => {
                        const selected = selections[question.id] ?? []
                        const multiple = !isSingleChoiceQuestion(question.type)
                        return (
                            <div
                                key={question.id}
                                className="flex flex-col gap-3 rounded-2xl border border-separator p-4"
                            >
                                <div className="flex flex-col gap-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Typography type="body-xs" color="muted">
                                            {t("practice.quiz.questionLine", { number: index + 1 })}
                                        </Typography>
                                        {question.difficulty ? (
                                            <Chip size="sm" variant="soft">
                                                {question.difficulty}
                                            </Chip>
                                        ) : null}
                                    </div>
                                    <Typography type="body-sm" weight="medium">
                                        {question.question}
                                    </Typography>
                                    {multiple ? (
                                        <Typography type="body-xs" color="muted">
                                            {t("practice.quiz.multipleHint")}
                                        </Typography>
                                    ) : null}
                                </div>
                                <div className="flex flex-col gap-2">
                                    {question.options.map((option) => {
                                        const isSelected = selected.includes(option.key)
                                        const Indicator = multiple
                                            ? isSelected
                                                ? CheckSquareIcon
                                                : SquareIcon
                                            : isSelected
                                                ? CheckCircleIcon
                                                : CircleIcon
                                        return (
                                            <button
                                                key={option.key}
                                                type="button"
                                                aria-pressed={isSelected}
                                                onClick={() => onToggle(question, option.key)}
                                                className={cn(
                                                    "flex items-center gap-2 rounded-xl border p-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-focus",
                                                    isSelected
                                                        ? "border-accent bg-accent/10"
                                                        : "border-separator hover:border-accent/50",
                                                )}
                                            >
                                                <Indicator
                                                    aria-hidden
                                                    focusable="false"
                                                    weight={isSelected ? "fill" : "regular"}
                                                    className={cn(
                                                        "size-5 shrink-0",
                                                        isSelected ? "text-accent" : "text-muted",
                                                    )}
                                                />
                                                <Typography type="body-sm">{option.text}</Typography>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}
                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            variant="primary"
                            isPending={submit.isMutating}
                            isDisabled={submit.isMutating}
                            onPress={guard(() => void submitRun())}
                        >
                            {t(submit.isMutating ? "practice.quiz.submitting" : "practice.quiz.submit")}
                        </Button>
                        <Typography type="body-xs" color="muted">
                            {t("practice.quiz.ephemeralNote")}
                        </Typography>
                    </div>
                </div>
            ) : null}

            {phase === "result" && result ? (
                <PracticeQuizAnswerSheet
                    result={result}
                    isDrawing={draw.isMutating}
                    onRetake={guard(() => void startRun(count))}
                    onBack={onBack}
                />
            ) : null}
        </div>
    )
}

/** Colour classes per option verdict on the reviewed sheet. */
const OPTION_STATE_CLASS: Record<PracticeOptionState, string> = {
    correct: "border-success bg-success/10",
    incorrect: "border-danger bg-danger/10",
    missed: "border-success/50 bg-success/5",
    neutral: "border-separator",
}

/** Graded sheet — score header + every question with its correct keys and explanation. */
const PracticeQuizAnswerSheet = ({
    result,
    isDrawing,
    onRetake,
    onBack,
}: {
    result: PracticeQuizResult
    isDrawing: boolean
    onRetake: () => void
    onBack: () => void
}) => {
    const t = useTranslations("subjects")
    const skipped = Math.max(result.totalQuestions - result.answeredQuestions, 0)

    return (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
            <div className="flex flex-col items-center gap-2 rounded-3xl border border-separator p-6 text-center">
                <Typography type="body-sm" color="muted">
                    {t("practice.quiz.resultTitle")}
                </Typography>
                <Typography type="h4" weight="bold">
                    {t("practice.quiz.scoreLine", { percent: result.scorePercent })}
                </Typography>
                <div className="flex flex-wrap items-center justify-center gap-2">
                    <Chip size="sm" variant="soft" color="accent">
                        {t("practice.quiz.correctSummary", {
                            correct: result.correctCount,
                            total: result.totalQuestions,
                        })}
                    </Chip>
                    <Chip size="sm" variant="soft">
                        {t("practice.quiz.pointsSummary", {
                            earned: result.earnedPoints,
                            total: result.totalPoints,
                        })}
                    </Chip>
                    {skipped > 0 ? (
                        <Chip size="sm" variant="soft" color="warning">
                            {t("practice.quiz.skippedSummary", { count: skipped })}
                        </Chip>
                    ) : null}
                </div>
            </div>

            {result.questions.map((question, index) => (
                <PracticeQuizReviewedQuestion key={question.id} question={question} index={index} />
            ))}

            <div className="flex flex-wrap items-center gap-2">
                <Button
                    variant="primary"
                    isPending={isDrawing}
                    isDisabled={isDrawing}
                    onPress={onRetake}
                >
                    {t("practice.quiz.retake")}
                </Button>
                <Button variant="secondary" onPress={onBack}>
                    {t("practice.backToHub")}
                </Button>
            </div>
        </div>
    )
}

/** One reviewed question: verdict chip, option states, correct keys and explanation. */
const PracticeQuizReviewedQuestion = ({
    question,
    index,
}: {
    question: PracticeResultQuestion
    index: number
}) => {
    const t = useTranslations("subjects")
    const verdict = !question.answered ? "skipped" : question.correct ? "correct" : "incorrect"

    return (
        <div className="flex flex-col gap-3 rounded-2xl border border-separator p-4">
            <div className="flex flex-wrap items-center gap-2">
                <Typography type="body-xs" color="muted" className="flex-1">
                    {t("practice.quiz.questionLine", { number: index + 1 })}
                </Typography>
                <Chip
                    size="sm"
                    variant="soft"
                    color={verdict === "correct" ? "success" : verdict === "incorrect" ? "danger" : "warning"}
                >
                    <span className="flex items-center gap-1">
                        {verdict === "correct" ? (
                            <CheckCircleIcon aria-hidden focusable="false" className="size-3" weight="fill" />
                        ) : verdict === "incorrect" ? (
                            <XCircleIcon aria-hidden focusable="false" className="size-3" weight="fill" />
                        ) : null}
                        {t(`practice.quiz.${verdict}`)}
                    </span>
                </Chip>
                <Chip size="sm" variant="soft">
                    {t("practice.quiz.pointsSummary", {
                        earned: question.earnedPoints,
                        total: question.points,
                    })}
                </Chip>
            </div>

            <Typography type="body-sm" weight="medium">
                {question.question}
            </Typography>

            <div className="flex flex-col gap-2">
                {question.options.map((option) => (
                    <div
                        key={option.key}
                        className={cn(
                            "flex items-start gap-2 rounded-xl border p-3",
                            OPTION_STATE_CLASS[option.state],
                        )}
                    >
                        {option.isCorrect ? (
                            <CheckCircleIcon
                                aria-hidden
                                focusable="false"
                                weight="fill"
                                className="size-5 shrink-0 text-success"
                            />
                        ) : option.selected ? (
                            <XCircleIcon
                                aria-hidden
                                focusable="false"
                                weight="fill"
                                className="size-5 shrink-0 text-danger"
                            />
                        ) : (
                            <CircleIcon aria-hidden focusable="false" className="size-5 shrink-0 text-muted" />
                        )}
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                            <Typography type="body-sm">{option.text}</Typography>
                            <div className="flex flex-wrap gap-1">
                                {option.selected ? (
                                    <Chip size="sm" variant="soft">
                                        {t("practice.quiz.yourAnswer")}
                                    </Chip>
                                ) : null}
                                {option.isCorrect ? (
                                    <Chip size="sm" variant="soft" color="success">
                                        {t("practice.quiz.correctAnswer")}
                                    </Chip>
                                ) : null}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {question.explanation ? (
                <div className="flex flex-col gap-1 rounded-xl bg-default/40 p-3">
                    <Typography type="body-xs" weight="semibold">
                        {t("practice.quiz.explanation")}
                    </Typography>
                    <Typography type="body-sm" color="muted">
                        {question.explanation}
                    </Typography>
                </div>
            ) : null}
        </div>
    )
}
