"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { Button, Chip, Typography, cn } from "@heroui/react"
import {
    CheckCircleIcon,
    CheckSquareIcon,
    CircleIcon,
    ClockIcon,
    ListChecksIcon,
    LockSimpleIcon,
    SquareIcon,
    XCircleIcon,
} from "@phosphor-icons/react"
import { useLocale, useTranslations } from "next-intl"
import { mutate as globalMutate } from "swr"
import { useRestWithToast } from "@/modules/toast/hooks"
import { RestError } from "@/modules/api/rest/client"
import { useGetLessonQuizzesSwr } from "@/hooks/swr/api/rest/queries/useGetLessonQuizzesSwr"
import { useGetMyQuizAttemptsSwr } from "@/hooks/swr/api/rest/queries/useGetMyQuizAttemptsSwr"
import { usePostStartQuizAttemptSwr } from "@/hooks/swr/api/rest/mutations/usePostStartQuizAttemptSwr"
import { usePostSubmitQuizAttemptSwr } from "@/hooks/swr/api/rest/mutations/usePostSubmitQuizAttemptSwr"
import { useRouter } from "@/i18n/navigation"
import type {
    QuizAttemptHistoryView,
    QuizAttemptResultView,
    QuizAttemptStartView,
    QuizQuestionTakerView,
    QuizSummaryView,
} from "@/modules/api/rest/course"

/** Props for {@link LessonQuizBlock}. */
export interface LessonQuizBlockProps {
    /** The lesson (route `contentId`) whose quizzes to load. */
    lessonId: string
    /** Owning course id — the enroll CTA routes here when access is denied. */
    courseId: string
    /** Extra classes on the section root (e.g. the reading-width cap). */
    className?: string
}

/** Question types whose answer is a single choice (radio); everything else is multi. */
const isSingleChoice = (type: string): boolean => type !== "MULTIPLE_CHOICE"

/** Formats a seconds count as `M:SS` for the time-limit chip / countdown. */
const formatClock = (totalSeconds: number): string => {
    const safe = Math.max(0, Math.floor(totalSeconds))
    const minutes = Math.floor(safe / 60)
    const seconds = safe % 60
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

/**
 * Quiz block for the lesson reader (learn-quiz-taking). Loads the lesson's PUBLISHED
 * quizzes and renders one card per quiz that moves through three phases in place:
 * resting (title + question count + best score + attempt count → "Start quiz") →
 * taking (taker-safe questions + a `timeLimitSeconds` countdown that auto-submits at
 * zero) → result (score %, pass/fail + the caller's attempt history).
 *
 * The caller renders this only when `lesson.hasQuiz` is true, so no request is made on
 * a quiz-less lesson. A `COURSE_ACCESS_DENIED` (403 — no FULL access) surfaces an
 * enroll CTA (enroll the course, never "VIP"); any other empty/error renders nothing.
 */
export const LessonQuizBlock = ({ lessonId, courseId, className }: LessonQuizBlockProps) => {
    const t = useTranslations("learn")
    const router = useRouter()
    const { data: quizzes, error } = useGetLessonQuizzesSwr(lessonId)

    // No FULL access → the taker list 403s; invite the learner to enroll (not "VIP").
    const accessDenied = error instanceof RestError && error.errorCode === "COURSE_ACCESS_DENIED"
    if (accessDenied) {
        return (
            <section className={cn("flex flex-col gap-4", className)}>
                <div className="flex flex-col items-start gap-3 rounded-3xl border border-default bg-surface p-6">
                    <LockSimpleIcon aria-hidden focusable="false" className="size-8 text-accent" />
                    <Typography type="body" weight="semibold">
                        {t("exercises.quiz.lockedTitle")}
                    </Typography>
                    <Typography type="body-sm" color="muted">
                        {t("exercises.quiz.lockedBody")}
                    </Typography>
                    <Button variant="primary" onPress={() => router.push(`/courses/${courseId}`)}>
                        {t("reader.enrollCta")}
                    </Button>
                </div>
            </section>
        )
    }

    // Only surface once a real, non-empty list is in — no skeleton, silent on empty/error.
    if (!quizzes || quizzes.length === 0) {
        return null
    }

    return (
        <section className={cn("flex flex-col gap-4", className)}>
            <div className="flex items-center gap-2">
                <ListChecksIcon aria-hidden focusable="false" className="size-5 text-accent" />
                <Typography type="body" weight="semibold">
                    {t("exercises.quiz.title")}
                </Typography>
            </div>
            <div className="flex flex-col gap-4">
                {quizzes.map((quiz) => (
                    <QuizCard key={quiz.id} quiz={quiz} lessonId={lessonId} />
                ))}
            </div>
        </section>
    )
}

/** The three phases of a single quiz card. */
type QuizPhase = "resting" | "taking" | "result"

/** One quiz: resting summary → in-place taking view → result + history. */
const QuizCard = ({ quiz, lessonId }: { quiz: QuizSummaryView; lessonId: string }) => {
    const runRest = useRestWithToast()
    const start = usePostStartQuizAttemptSwr()
    const submit = usePostSubmitQuizAttemptSwr()
    const attemptsSwr = useGetMyQuizAttemptsSwr(quiz.id)

    const [phase, setPhase] = useState<QuizPhase>("resting")
    const [attempt, setAttempt] = useState<QuizAttemptStartView | null>(null)
    const [answers, setAnswers] = useState<Record<string, Array<string>>>({})
    const [result, setResult] = useState<QuizAttemptResultView | null>(null)
    const [remaining, setRemaining] = useState<number | null>(null)
    const [autoSubmitted, setAutoSubmitted] = useState(false)

    // Refs so the timer's auto-submit reads the latest answers/attempt without
    // re-subscribing the interval each keystroke, and never double-fires.
    const answersRef = useRef(answers)
    answersRef.current = answers
    const attemptRef = useRef(attempt)
    attemptRef.current = attempt
    const submittingRef = useRef(false)

    const reachedMax =
        quiz.maxAttempts !== null && (quiz.myAttemptCount ?? 0) >= quiz.maxAttempts
    const hasAttempted = (quiz.myAttemptCount ?? 0) > 0

    const doSubmit = useCallback(
        async (auto: boolean) => {
            const current = attemptRef.current
            if (!current || submittingRef.current) {
                return
            }
            submittingRef.current = true
            setRemaining(null) // stop the countdown
            const res = await runRest(() =>
                submit.trigger({
                    attemptId: current.attemptId,
                    request: { answers: answersRef.current },
                }),
            )
            submittingRef.current = false
            if (res !== null) {
                setResult(res)
                setAutoSubmitted(auto)
                setPhase("result")
                // Revalidate history + the summary card (best/attempt count) after submit.
                void attemptsSwr.mutate()
                void globalMutate(["LESSON_QUIZZES_SWR", lessonId])
            }
        },
        [runRest, submit, attemptsSwr, lessonId],
    )

    // Countdown: re-schedules a 1s tick each second; auto-submits when it hits zero.
    const doSubmitRef = useRef(doSubmit)
    doSubmitRef.current = doSubmit
    useEffect(() => {
        if (phase !== "taking" || remaining === null) {
            return
        }
        if (remaining <= 0) {
            void doSubmitRef.current(true)
            return
        }
        const id = setTimeout(() => {
            setRemaining((value) => (value === null ? null : value - 1))
        }, 1000)
        return () => clearTimeout(id)
    }, [phase, remaining])

    const handleStart = async () => {
        const res = await runRest(() => start.trigger(quiz.id))
        if (res !== null) {
            setAttempt(res)
            setAnswers({})
            setResult(null)
            setAutoSubmitted(false)
            // Treat null / 0 / negative as "no limit" — a 0 would auto-submit instantly.
            setRemaining(res.timeLimitSeconds && res.timeLimitSeconds > 0 ? res.timeLimitSeconds : null)
            setPhase("taking")
        }
    }

    const toggleAnswer = (question: QuizQuestionTakerView, key: string) => {
        setAnswers((prev) => {
            const current = prev[question.id] ?? []
            const next = isSingleChoice(question.type)
                ? [key]
                : current.includes(key)
                    ? current.filter((existing) => existing !== key)
                    : [...current, key]
            return { ...prev, [question.id]: next }
        })
    }

    return (
        <div className="flex flex-col gap-4 rounded-3xl border border-default bg-surface p-6">
            {phase === "resting" ? (
                <QuizResting
                    quiz={quiz}
                    reachedMax={reachedMax}
                    hasAttempted={hasAttempted}
                    isStarting={start.isMutating}
                    onStart={() => void handleStart()}
                />
            ) : phase === "taking" && attempt ? (
                <QuizTaking
                    quiz={quiz}
                    attempt={attempt}
                    answers={answers}
                    remaining={remaining}
                    isSubmitting={submit.isMutating}
                    onToggle={toggleAnswer}
                    onSubmit={() => void doSubmit(false)}
                />
            ) : phase === "result" && result ? (
                <QuizResult
                    result={result}
                    autoSubmitted={autoSubmitted}
                    attempts={attemptsSwr.data ?? []}
                    onDone={() => setPhase("resting")}
                />
            ) : null}
        </div>
    )
}

/** Resting summary — meta chips + a start/retake CTA. */
const QuizResting = ({
    quiz,
    reachedMax,
    hasAttempted,
    isStarting,
    onStart,
}: {
    quiz: QuizSummaryView
    reachedMax: boolean
    hasAttempted: boolean
    isStarting: boolean
    onStart: () => void
}) => {
    const t = useTranslations("learn")
    return (
        <>
            <div className="flex flex-wrap items-start justify-between gap-2">
                <Typography type="body" weight="semibold" className="min-w-0">
                    {quiz.title}
                </Typography>
                {quiz.myPassed !== null ? (
                    <Chip size="sm" variant="soft" color={quiz.myPassed ? "success" : "danger"} className="shrink-0">
                        {t(quiz.myPassed ? "exercises.quiz.passed" : "exercises.quiz.notPassed")}
                    </Chip>
                ) : null}
            </div>

            {quiz.description ? (
                <Typography type="body-sm" color="muted">
                    {quiz.description}
                </Typography>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
                <Chip size="sm" variant="soft">
                    {t("exercises.quiz.questionsCount", { count: quiz.questionCount })}
                </Chip>
                <Chip size="sm" variant="soft">
                    {t("exercises.quiz.passScore", { percent: quiz.passScorePercent })}
                </Chip>
                {quiz.timeLimitSeconds ? (
                    <Chip size="sm" variant="soft">
                        <span className="flex items-center gap-1">
                            <ClockIcon aria-hidden focusable="false" className="size-3" />
                            {t("exercises.quiz.timeLimit", { value: formatClock(quiz.timeLimitSeconds) })}
                        </span>
                    </Chip>
                ) : null}
                {quiz.myBestPercent !== null ? (
                    <Chip size="sm" variant="soft" color="accent">
                        {t("exercises.quiz.bestScore", { percent: Math.round(Number(quiz.myBestPercent)) })}
                    </Chip>
                ) : null}
                {quiz.myAttemptCount ? (
                    <Chip size="sm" variant="soft">
                        {t("exercises.quiz.attemptsUsed", { count: quiz.myAttemptCount })}
                    </Chip>
                ) : null}
            </div>

            {reachedMax ? (
                <div className="flex items-center gap-2 rounded-2xl border border-default bg-default/40 p-4">
                    <LockSimpleIcon aria-hidden focusable="false" className="size-5 shrink-0 text-muted" />
                    <Typography type="body-sm" color="muted">
                        {t("exercises.quiz.maxReached", { max: quiz.maxAttempts ?? 0 })}
                    </Typography>
                </div>
            ) : (
                <div>
                    <Button variant="primary" isPending={isStarting} isDisabled={isStarting} onPress={onStart}>
                        {t(hasAttempted ? "exercises.quiz.retake" : "exercises.quiz.start")}
                    </Button>
                </div>
            )}
        </>
    )
}

/** Taking view — countdown header + taker-safe questions + submit. */
const QuizTaking = ({
    quiz,
    attempt,
    answers,
    remaining,
    isSubmitting,
    onToggle,
    onSubmit,
}: {
    quiz: QuizSummaryView
    attempt: QuizAttemptStartView
    answers: Record<string, Array<string>>
    remaining: number | null
    isSubmitting: boolean
    onToggle: (question: QuizQuestionTakerView, key: string) => void
    onSubmit: () => void
}) => {
    const t = useTranslations("learn")
    const lowTime = remaining !== null && remaining <= 10
    return (
        <>
            <div className="flex flex-wrap items-center justify-between gap-2">
                <Typography type="body" weight="semibold" className="min-w-0">
                    {quiz.title}
                </Typography>
                {remaining !== null ? (
                    <Chip size="sm" variant="soft" color={lowTime ? "danger" : "accent"} className="shrink-0">
                        <span className="flex items-center gap-1 tabular-nums">
                            <ClockIcon aria-hidden focusable="false" className="size-3" />
                            {t("exercises.quiz.timeRemaining", { value: formatClock(remaining) })}
                        </span>
                    </Chip>
                ) : null}
            </div>

            <div className="flex flex-col gap-4">
                {attempt.questions.map((question, index) => {
                    const selected = answers[question.id] ?? []
                    const multiple = !isSingleChoice(question.type)
                    return (
                        <div key={question.id} className="flex flex-col gap-3 rounded-2xl border border-default bg-default/40 p-4">
                            <div className="flex flex-col gap-1">
                                <Typography type="body-xs" color="muted">
                                    {t("exercises.quiz.questionLine", { number: index + 1 })}
                                </Typography>
                                <Typography type="body-sm" weight="medium">
                                    {question.question}
                                </Typography>
                                {multiple ? (
                                    <Typography type="body-xs" color="muted">
                                        {t("exercises.quiz.multipleHint")}
                                    </Typography>
                                ) : null}
                            </div>
                            <div className="flex flex-col gap-2">
                                {question.options.map((option) => {
                                    const isSelected = selected.includes(option.key)
                                    const Indicator = multiple
                                        ? isSelected ? CheckSquareIcon : SquareIcon
                                        : isSelected ? CheckCircleIcon : CircleIcon
                                    return (
                                        <button
                                            key={option.key}
                                            type="button"
                                            onClick={() => onToggle(question, option.key)}
                                            className={cn(
                                                "flex items-center gap-2 rounded-xl border p-3 text-left transition-colors",
                                                isSelected
                                                    ? "border-accent bg-accent/10"
                                                    : "border-default bg-surface hover:border-accent/50",
                                            )}
                                            aria-pressed={isSelected}
                                        >
                                            <Indicator
                                                aria-hidden
                                                focusable="false"
                                                weight={isSelected ? "fill" : "regular"}
                                                className={cn("size-5 shrink-0", isSelected ? "text-accent" : "text-muted")}
                                            />
                                            <Typography type="body-sm">{option.text}</Typography>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
            </div>

            <div>
                <Button variant="primary" isPending={isSubmitting} isDisabled={isSubmitting} onPress={onSubmit}>
                    {t(isSubmitting ? "exercises.quiz.submitting" : "exercises.quiz.submit")}
                </Button>
            </div>
        </>
    )
}

/** Result view — score + pass state + attempt history. */
const QuizResult = ({
    result,
    autoSubmitted,
    attempts,
    onDone,
}: {
    result: QuizAttemptResultView
    autoSubmitted: boolean
    attempts: Array<QuizAttemptHistoryView>
    onDone: () => void
}) => {
    const t = useTranslations("learn")
    const locale = useLocale()
    const percent = Math.round(Number(result.scorePercent))
    return (
        <>
            <div className="flex flex-col items-center gap-2 py-2 text-center">
                {result.passed ? (
                    <CheckCircleIcon aria-hidden focusable="false" weight="fill" className="size-10 text-success" />
                ) : (
                    <XCircleIcon aria-hidden focusable="false" weight="fill" className="size-10 text-danger" />
                )}
                <Typography type="body-sm" color="muted">
                    {t("exercises.quiz.resultTitle")}
                </Typography>
                <Typography.Heading level={2} weight="bold" className="text-3xl">
                    {t("exercises.quiz.scoreLine", { percent })}
                </Typography.Heading>
                <Typography type="body-sm" weight="medium" className={result.passed ? "text-success" : "text-danger"}>
                    {t(result.passed ? "exercises.quiz.passedResult" : "exercises.quiz.failedResult")}
                </Typography>
                {autoSubmitted ? (
                    <Typography type="body-xs" color="muted">
                        {t("exercises.quiz.autoSubmitted")}
                    </Typography>
                ) : null}
            </div>

            {attempts.length > 0 ? (
                <div className="flex flex-col gap-3 border-t border-default pt-4">
                    <Typography type="body-sm" weight="semibold">
                        {t("exercises.quiz.historyTitle")}
                    </Typography>
                    {attempts.map((row) => (
                        <div
                            key={row.attemptId}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-default bg-default/40 p-4"
                        >
                            <div className="flex items-center gap-2">
                                <Typography type="body-sm" weight="medium">
                                    {t("exercises.quiz.attemptLine", { number: row.attemptNo })}
                                </Typography>
                                {row.submittedAt === null ? (
                                    <Chip size="sm" variant="soft">
                                        {t("exercises.quiz.inProgress")}
                                    </Chip>
                                ) : (
                                    <>
                                        {row.scorePercent !== null ? (
                                            <Chip size="sm" variant="soft" color="accent">
                                                {t("exercises.quiz.scoreLine", { percent: Math.round(Number(row.scorePercent)) })}
                                            </Chip>
                                        ) : null}
                                        {row.passed !== null ? (
                                            <Chip size="sm" variant="soft" color={row.passed ? "success" : "danger"}>
                                                {t(row.passed ? "exercises.quiz.passed" : "exercises.quiz.notPassed")}
                                            </Chip>
                                        ) : null}
                                    </>
                                )}
                            </div>
                            {row.submittedAt !== null ? (
                                <Typography type="body-xs" color="muted">
                                    {new Date(row.submittedAt).toLocaleString(locale)}
                                </Typography>
                            ) : null}
                        </div>
                    ))}
                </div>
            ) : null}

            <div>
                <Button variant="secondary" onPress={onDone}>
                    {t("exercises.quiz.done")}
                </Button>
            </div>
        </>
    )
}
