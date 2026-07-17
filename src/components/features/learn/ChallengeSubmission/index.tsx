"use client"

import React, { useMemo, useState } from "react"
import {
    Button,
    Chip,
    Input,
    TextField,
    Typography,
    cn,
} from "@heroui/react"
import {
    CheckSquareIcon,
    LockSimpleIcon,
    PuzzlePieceIcon,
    SquareIcon,
} from "@phosphor-icons/react"
import { useLocale, useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { PageHeader } from "@/components/blocks/layout/PageHeader"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { MarkdownContent } from "@/components/reuseable/MarkdownContent"
import { useRouter } from "@/i18n/navigation"
import { RestError } from "@/modules/api/rest/client"
import type { McqQuestionView, SubmissionView, SubmitRequest } from "@/modules/api/rest/challenges"
import { useRestWithToast } from "@/modules/toast/hooks"
import { usePostSubmitChallengeSwr } from "@/hooks/swr/api/rest/mutations/usePostSubmitChallengeSwr"
import {
    isChallengeSubmissionPending,
    useQueryChallengeSubmissionSwr,
} from "../hooks/useQueryChallengeSubmissionSwr"

/**
 * Auto-grading challenge submission surface (learn-challenge-submission). Loads the
 * real challenge linked to the lesson (`getChallengeBySlug` — BE by-id fallback) and
 * renders a submit form by `ChallengeView.type`:
 *   - `MULTIPLE_CHOICE` → pick option keys per taker-safe `mcqQuestions` → `{payloadType:"MCQ", answers}`
 *   - `CODE` → source + language → `{payloadType:"CODE", code, language}`
 *   - `ESSAY` → essay body → `{payloadType:"ESSAY", essayText}`
 *
 * Grading is async (auto-grade / ftes-ai-service); the attempts list self-polls until
 * every submission is terminal. The form locks once `maxSubmissions` is reached. A
 * course-bank `CHALLENGE_COURSE_ACCESS_DENIED` (403) renders an enroll CTA (enroll the
 * course — never "VIP") instead of a generic error.
 */
export const ChallengeSubmission = () => {
    const t = useTranslations("learn")
    const locale = useLocale()
    const router = useRouter()
    const { courseId, moduleId, contentId, challengeId } = useParams<{
        courseId: string
        moduleId: string
        contentId: string
        challengeId: string
    }>()
    const { challenge, submissions, isLoading, error, mutate } = useQueryChallengeSubmissionSwr(challengeId)
    const runRest = useRestWithToast()
    const submit = usePostSubmitChallengeSwr()

    // MCQ selections (questionId → option keys), CODE / ESSAY bodies.
    const [answers, setAnswers] = useState<Record<string, Array<string>>>({})
    const [code, setCode] = useState("")
    const [language, setLanguage] = useState("python")
    const [essayText, setEssayText] = useState("")

    const type = challenge?.type ?? ""
    const usedCount = submissions.length
    const reachedMax = challenge ? usedCount >= challenge.maxSubmissions : false
    // newest attempt first
    const history = useMemo(
        () => [...submissions].sort((a, b) => b.attemptNo - a.attemptNo),
        [submissions],
    )

    // course-bank challenge, viewer not enrolled → enroll CTA (never "VIP")
    const accessDenied =
        error instanceof RestError && error.errorCode === "CHALLENGE_COURSE_ACCESS_DENIED"

    const toggleAnswer = (questionId: string, key: string) => {
        setAnswers((prev) => {
            const selected = prev[questionId] ?? []
            return {
                ...prev,
                [questionId]: selected.includes(key)
                    ? selected.filter((entry) => entry !== key)
                    : [...selected, key],
            }
        })
    }

    /** Builds the type-specific submit body, or null when the input is incomplete. */
    const buildRequest = (): SubmitRequest | null => {
        if (type === "MULTIPLE_CHOICE") {
            const answered = Object.values(answers).some((keys) => keys.length > 0)
            if (!answered) {
                return null
            }
            return { payloadType: "MCQ", answers }
        }
        if (type === "ESSAY") {
            if (essayText.trim() === "") {
                return null
            }
            return { payloadType: "ESSAY", essayText: essayText.trim() }
        }
        // CODE (default)
        if (code.trim() === "") {
            return null
        }
        return { payloadType: "CODE", code, language: language.trim() || "text" }
    }

    const request = buildRequest()
    const canSubmit = Boolean(challenge) && !reachedMax && request !== null && !submit.isMutating

    const handleSubmit = async () => {
        if (!challenge || !request || reachedMax || submit.isMutating) {
            return
        }
        const ok = await runRest(
            () => submit.trigger({ id: challenge.id, request }),
            { successMessage: t("exercises.challenge.submitted") },
        )
        if (ok !== null) {
            setAnswers({})
            setCode("")
            setEssayText("")
            void mutate()
        }
    }

    if (accessDenied) {
        return (
            <div className="mx-auto flex w-full max-w-3xl flex-col items-start gap-3 rounded-3xl border border-default bg-surface p-6">
                <LockSimpleIcon aria-hidden focusable="false" className="size-8 text-accent" />
                <Typography type="body" weight="semibold">
                    {t("exercises.challenge.lockedTitle")}
                </Typography>
                <Typography type="body-sm" color="muted">
                    {t("exercises.challenge.lockedBody")}
                </Typography>
                <Button variant="primary" onPress={() => router.push(`/courses/${courseId}`)}>
                    {t("reader.enrollCta")}
                </Button>
            </div>
        )
    }

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
            <AsyncContent
                isLoading={isLoading && !challenge}
                skeleton={<SubmissionSkeleton />}
                error={!challenge ? error : undefined}
                errorContent={{
                    title: t("exercises.challenge.error"),
                    onRetry: () => { void mutate() },
                    retryLabel: t("common.retry"),
                }}
            >
                {challenge ? (
                    <>
                        <PageHeader
                            title={challenge.title}
                            description={t("exercises.challenge.subtitle")}
                            actions={(
                                <button
                                    type="button"
                                    className="flex cursor-pointer items-center gap-2 rounded-2xl px-3 py-2 text-sm text-muted transition-colors hover:bg-default/60"
                                    onClick={() =>
                                        router.push(
                                            `/courses/${courseId}/learn/content/modules/${moduleId}/contents/${contentId}`,
                                        )
                                    }
                                >
                                    {t("exercises.challenge.back")}
                                </button>
                            )}
                        />

                        {challenge.description ? (
                            <div className="rounded-3xl border border-default bg-surface p-6 text-sm">
                                <MarkdownContent reading markdown={challenge.description} />
                            </div>
                        ) : null}

                        {/* submit form — locked once every attempt is used */}
                        <section className="flex flex-col gap-4 rounded-3xl border border-default bg-surface p-6">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <PuzzlePieceIcon aria-hidden focusable="false" className="size-5 text-accent" />
                                    <Typography type="body" weight="semibold">
                                        {t("exercises.challenge.submitTitle")}
                                    </Typography>
                                </div>
                                <Chip size="sm" variant="soft" className="shrink-0">
                                    {t("exercises.challenge.submissionsCount", {
                                        used: usedCount,
                                        max: challenge.maxSubmissions,
                                    })}
                                </Chip>
                            </div>

                            {reachedMax ? (
                                <div className="flex items-center gap-2 rounded-2xl border border-default bg-default/40 p-4">
                                    <LockSimpleIcon aria-hidden focusable="false" className="size-5 shrink-0 text-muted" />
                                    <Typography type="body-sm" color="muted">
                                        {t("exercises.challenge.maxReached", { max: challenge.maxSubmissions })}
                                    </Typography>
                                </div>
                            ) : (
                                <>
                                    {type === "MULTIPLE_CHOICE" ? (
                                        <McqForm
                                            questions={challenge.mcqQuestions ?? []}
                                            answers={answers}
                                            onToggle={toggleAnswer}
                                        />
                                    ) : type === "ESSAY" ? (
                                        <div className="flex flex-col gap-2">
                                            <Typography type="body-sm" weight="medium">
                                                {t("exercises.challenge.essayLabel")}
                                            </Typography>
                                            <textarea
                                                value={essayText}
                                                onChange={(event) => setEssayText(event.target.value)}
                                                rows={8}
                                                placeholder={t("exercises.challenge.essayPlaceholder")}
                                                aria-label={t("exercises.challenge.essayLabel")}
                                                className="w-full resize-y rounded-2xl border border-default bg-transparent p-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent"
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-3">
                                            <div className="flex flex-col gap-2 sm:max-w-xs">
                                                <Typography type="body-sm" weight="medium">
                                                    {t("exercises.challenge.languageLabel")}
                                                </Typography>
                                                <TextField variant="secondary" className="w-full">
                                                    <Input
                                                        variant="secondary"
                                                        value={language}
                                                        onChange={(event) => setLanguage(event.target.value)}
                                                        placeholder="python"
                                                        aria-label={t("exercises.challenge.languageLabel")}
                                                    />
                                                </TextField>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <Typography type="body-sm" weight="medium">
                                                    {t("exercises.challenge.codeLabel")}
                                                </Typography>
                                                <textarea
                                                    value={code}
                                                    onChange={(event) => setCode(event.target.value)}
                                                    rows={12}
                                                    spellCheck={false}
                                                    placeholder={t("exercises.challenge.codePlaceholder")}
                                                    aria-label={t("exercises.challenge.codeLabel")}
                                                    className="w-full resize-y rounded-2xl border border-default bg-transparent p-3 font-mono text-sm text-foreground outline-none placeholder:text-muted focus:border-accent"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <Button
                                            variant="primary"
                                            isPending={submit.isMutating}
                                            isDisabled={!canSubmit}
                                            onPress={() => void handleSubmit()}
                                        >
                                            {t(submit.isMutating ? "exercises.challenge.submitting" : "exercises.challenge.submit")}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </section>

                        {/* attempts history */}
                        {history.length > 0 ? (
                            <section className="flex flex-col gap-3">
                                <Typography type="body" weight="semibold">
                                    {t("exercises.challenge.historyTitle")}
                                </Typography>
                                {history.map((attempt) => (
                                    <AttemptRow key={attempt.id} attempt={attempt} locale={locale} />
                                ))}
                            </section>
                        ) : null}
                    </>
                ) : null}
            </AsyncContent>
        </div>
    )
}

/** MCQ form — taker-safe questions with multi-select option toggles. */
const McqForm = ({
    questions,
    answers,
    onToggle,
}: {
    questions: Array<McqQuestionView>
    answers: Record<string, Array<string>>
    onToggle: (questionId: string, key: string) => void
}) => {
    const t = useTranslations("learn")
    if (questions.length === 0) {
        return (
            <Typography type="body-sm" color="muted">
                {t("exercises.challenge.noQuestions")}
            </Typography>
        )
    }
    const ordered = [...questions].sort((a, b) => a.orderNo - b.orderNo)
    return (
        <div className="flex flex-col gap-4">
            {ordered.map((question, index) => {
                const selected = answers[question.id] ?? []
                return (
                    <div key={question.id} className="flex flex-col gap-3 rounded-2xl border border-default bg-default/40 p-4">
                        <div className="flex flex-col gap-1">
                            <Typography type="body-xs" color="muted">
                                {t("exercises.challenge.questionLine", { number: index + 1 })}
                            </Typography>
                            <Typography type="body-sm" weight="medium">
                                {question.question}
                            </Typography>
                            <Typography type="body-xs" color="muted">
                                {t("exercises.challenge.multipleHint")}
                            </Typography>
                        </div>
                        <div className="flex flex-col gap-2">
                            {question.options.map((option) => {
                                const isSelected = selected.includes(option.key)
                                const Indicator = isSelected ? CheckSquareIcon : SquareIcon
                                return (
                                    <button
                                        key={option.key}
                                        type="button"
                                        onClick={() => onToggle(question.id, option.key)}
                                        aria-pressed={isSelected}
                                        className={cn(
                                            "flex items-center gap-2 rounded-xl border p-3 text-left transition-colors",
                                            isSelected
                                                ? "border-accent bg-accent/10"
                                                : "border-default bg-surface hover:border-accent/50",
                                        )}
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
    )
}

/** One row in the attempts history — attempt no, status, final/auto score. */
const AttemptRow = ({
    attempt,
    locale,
}: {
    attempt: SubmissionView
    locale: string
}) => {
    const t = useTranslations("learn")
    const pending = isChallengeSubmissionPending(attempt)
    const completed = attempt.status === "COMPLETED"
    const failed = attempt.status === "FAILED"
    const score = attempt.finalScore ?? attempt.autoScore ?? attempt.manualScore

    const statusColor = pending ? undefined : completed ? "success" : failed ? "danger" : undefined
    const statusKey = pending
        ? (attempt.status === "GRADING" ? "grading" : "pending")
        : completed ? "completed" : failed ? "failed" : "pending"

    return (
        <div className="flex flex-col gap-2 rounded-2xl border border-default bg-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <Typography type="body-sm" weight="medium">
                        {t("exercises.challenge.attemptLine", { number: attempt.attemptNo })}
                    </Typography>
                    <Chip size="sm" variant="soft" color={statusColor}>
                        {t(`exercises.challenge.status.${statusKey}`)}
                    </Chip>
                    {completed && score !== null ? (
                        <Chip size="sm" variant="soft" color="accent">
                            {t("exercises.challenge.score", { score })}
                        </Chip>
                    ) : null}
                </div>
                <Typography type="body-xs" color="muted">
                    {new Date(attempt.submittedAt).toLocaleString(locale)}
                </Typography>
            </div>
            {pending ? (
                <Typography type="body-xs" color="muted">
                    {t("exercises.challenge.pendingHint")}
                </Typography>
            ) : null}
        </div>
    )
}

/** Submission skeleton — header + description + form. */
const SubmissionSkeleton = () => (
    <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-1/2 rounded-large" />
        <Skeleton className="h-24 w-full rounded-3xl" />
        <Skeleton className="h-48 w-full rounded-3xl" />
    </div>
)
