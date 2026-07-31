"use client"

import React, { useMemo, useState } from "react"
import {
    Button,
    Chip,
    Typography,
    cn,
} from "@heroui/react"
import {
    CheckSquareIcon,
    HammerIcon,
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
import type { ChallengeView, McqQuestionView, SubmissionView, SubmitRequest } from "@/modules/api/rest/challenges"
import { useRestWithToast } from "@/modules/toast/hooks"
import { usePostSubmitChallengeSwr } from "@/hooks/swr/api/rest/mutations/usePostSubmitChallengeSwr"
import { PackageGateModal } from "@/components/features/course/PackageGateModal"
import { useQueryCoursePackagesSwr } from "@/components/features/course/hooks/useQueryCoursePackagesSwr"
import { resolveTierColor, resolveTierLabel } from "@/components/features/course/tierLabels"
import { GradeCodePanel } from "@/components/features/challenge/ChallengeView/GradeCodePanel"
import { UiUxChallengeEditor } from "@/components/features/challenge/ChallengeView/UiUxChallengeEditor"
import { mapChallengeType } from "@/components/features/challenge/hooks/useQueryChallengesSwr"
import type { ChallengeDetail } from "@/components/features/challenge/hooks/useQueryChallengeSwr"
import { normalizeExerciseType } from "../exerciseType"
import { hasSubmissionMethod } from "../submissionMethods"
import { useQueryLearnCourseSwr } from "../hooks/useQueryLearnCourseSwr"
import {
    isChallengeSubmissionPending,
    useQueryChallengeSubmissionSwr,
} from "../hooks/useQueryChallengeSubmissionSwr"
import { ChallengeMethodSolver } from "./ChallengeMethodSolver"

/**
 * Adapts the REST challenge-submission view onto the richer `ChallengeDetail` the
 * catalog solvers (GradeCodePanel / UiUxChallengeEditor) consume. The submission
 * view carries only title/type/description, so the editor-specific fields
 * (requirements/steps/hints/starter/targetImageUrl) degrade to empty — the UI/UX
 * editor needs a real target asset, so it stays behind the coming-soon fallback
 * until the BE exposes one. `type` is normalized to the catalog union via the shared
 * mapper (so `SQL` grades static-only and `CODE`/`CODING` run executable).
 */
const toChallengeDetail = (view: ChallengeView): ChallengeDetail => ({
    id: view.slug,
    title: view.title,
    type: mapChallengeType(view.type),
    status: view.status,
    description: view.description ?? "",
    requirements: [],
    steps: [],
    hints: [],
    starter: { html: "", css: "", js: "" },
    targetImageUrl: "",
    isLocked: false,
    courseId: view.courseId ?? "",
})

/**
 * Auto-grading challenge submission surface (learn-challenge-submission). Loads the
 * real challenge linked to the lesson (`getChallengeBySlug` — BE by-id fallback) and
 * dispatches to the right solver by the unified exercise type
 * ({@link normalizeExerciseType}), reusing the existing solvers:
 *   - `mcq` (`MULTIPLE_CHOICE`/`QUIZ`) → pick option keys → `{payloadType:"MCQ", answers}`
 *   - `essay` (`ESSAY`) → essay body → `{payloadType:"ESSAY", essayText}`
 *   - `code` (`CODE`/`CODING`/`SQL`) → the AI code-grading panel (GradeCodePanel)
 *   - `uiux` (`UI_UX`) → the live HTML/CSS/JS editor when a target asset exists, else coming-soon
 *   - anything else → coming-soon (no reachable solver yet)
 *
 * MCQ/ESSAY grading is async (auto-grade / ftes-ai-service); the attempts list self-polls until
 * every submission is terminal. The form locks once `maxSubmissions` is reached. A
 * course-bank `CHALLENGE_COURSE_ACCESS_DENIED` (403) renders an access-gate card
 * (challenge-lesson-level-access-gate): when the error body carries
 * `requiredPackageSlugs` (viewer already enrolled but their tier does not cover the
 * attached lesson) the CTA is "Nâng cấp gói" and opens the shared PackageGateModal
 * scoped to exactly those packages; otherwise it keeps the enroll CTA (enroll the
 * course — never "VIP").
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

    // MCQ selections (questionId → option keys) + the ESSAY body. CODE lifts its
    // editor state here so the GradeCodePanel (AI practice) and the formal "Nộp bài"
    // submission share one source; UI-UX keeps its own dedicated solver.
    const [answers, setAnswers] = useState<Record<string, Array<string>>>({})
    const [essayText, setEssayText] = useState("")
    const [code, setCode] = useState("")
    /** Learner-picked language; null → derive the default from the challenge type. */
    const [languageOverride, setLanguageOverride] = useState<string | null>(null)

    const type = challenge?.type ?? ""
    /** Unified solver kind — the single dispatch key across both BE type vocabularies. */
    const kind = normalizeExerciseType(type)
    // A CODE challenge that carries a real `submissionMethod` (GITHUB|FILE|BOTH) is solved
    // via the github-URL + file-upload solver; absent/unknown → the inline code editor.
    const usesSubmissionMethod = hasSubmissionMethod(challenge?.submissionMethod)
    const detail = useMemo(() => (challenge ? toChallengeDetail(challenge) : null), [challenge])
    // SQL grades static-only (no language pick); everything else defaults to python.
    const language = languageOverride ?? (detail?.type === "sql" ? "sql" : "python")
    const usedCount = submissions.length
    const reachedMax = challenge ? usedCount >= challenge.maxSubmissions : false
    // newest attempt first
    const history = useMemo(
        () => [...submissions].sort((a, b) => b.attemptNo - a.attemptNo),
        [submissions],
    )

    // course-bank challenge denied (403). BE contract (challenge-lesson-level-access-gate):
    // the error body carries `courseId` (course UUID) and — when the viewer already holds a
    // purchase whose tier does not cover the attached lesson — `requiredPackageSlugs`, the
    // packages that DO unlock it. Both are defensive-optional (older BE builds omit them).
    const deniedError =
        error instanceof RestError && error.errorCode === "CHALLENGE_COURSE_ACCESS_DENIED"
            ? error
            : undefined
    const accessDenied = deniedError !== undefined
    const requiredPackageSlugs = useMemo(() => {
        const raw = deniedError?.body?.requiredPackageSlugs
        if (!Array.isArray(raw)) return []
        return raw.filter((slug): slug is string => typeof slug === "string" && slug.length > 0)
    }, [deniedError])
    // Course title (modal header / payment summary) + rawId fallback come from the learn
    // tree — same SWR key the learn rail uses, so this is a cache hit; gated off entirely
    // on the happy path.
    const { course: learnCourse, header: learnHeader } = useQueryLearnCourseSwr(
        accessDenied ? courseId : "",
    )
    const deniedBodyCourseId = deniedError?.body?.courseId
    const courseRawId =
        (typeof deniedBodyCourseId === "string" && deniedBodyCourseId.length > 0
            ? deniedBodyCourseId
            : undefined) ?? learnCourse?.id
    // Upgrade path only when the BE told us WHICH packages unlock the lesson AND we can
    // resolve the course UUID the gate modal needs; anything missing → old enroll CTA.
    const canUpgrade = requiredPackageSlugs.length > 0 && courseRawId !== undefined
    const [isGateOpen, setIsGateOpen] = useState(false)
    // Real package names for the tier chips (lesson-tier-badge labels); the gate modal
    // reuses the same SWR key when opened, so this fetch is shared, and it only fires on
    // the denied-with-slugs branch.
    const { packages } = useQueryCoursePackagesSwr(courseRawId, { enabled: canUpgrade })
    const packageNameBySlug = useMemo(
        () => new Map(packages.map((pkg) => [pkg.slug, pkg.name])),
        [packages],
    )

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

    /** Builds the MCQ/ESSAY/CODE submit body, or null when the input is incomplete. */
    const buildRequest = (): SubmitRequest | null => {
        if (kind === "mcq") {
            const answered = Object.values(answers).some((keys) => keys.length > 0)
            if (!answered) {
                return null
            }
            return { payloadType: "MCQ", answers }
        }
        if (kind === "essay") {
            if (essayText.trim() === "") {
                return null
            }
            return { payloadType: "ESSAY", essayText: essayText.trim() }
        }
        if (kind === "code") {
            if (code.trim() === "") {
                return null
            }
            return { payloadType: "CODE", code, language: language.trim() || "text" }
        }
        return null
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
            setEssayText("")
            void mutate()
        }
    }

    if (accessDenied) {
        return (
            <div className="mx-auto flex w-full max-w-3xl flex-col items-start gap-3 rounded-3xl border border-default bg-surface p-6">
                <LockSimpleIcon aria-hidden focusable="false" className="size-8 text-accent" />
                <Typography type="body" weight="semibold">
                    {t(canUpgrade ? "exercises.challenge.upgradeTitle" : "exercises.challenge.lockedTitle")}
                </Typography>
                <Typography type="body-sm" color="muted">
                    {t(canUpgrade ? "exercises.challenge.upgradeBody" : "exercises.challenge.lockedBody")}
                </Typography>
                {canUpgrade ? (
                    <>
                        <div className="flex flex-wrap items-center gap-2">
                            <Typography type="body-xs" color="muted">
                                {t("exercises.challenge.upgradeTiersHint")}
                            </Typography>
                            {requiredPackageSlugs.map((slug) => (
                                <Chip key={slug} size="sm" variant="soft" color={resolveTierColor(slug)} className="shrink-0">
                                    {resolveTierLabel(slug, packageNameBySlug)}
                                </Chip>
                            ))}
                        </div>
                        <Button variant="primary" onPress={() => setIsGateOpen(true)}>
                            {t("exercises.challenge.upgradeCta")}
                        </Button>
                        <PackageGateModal
                            isOpen={isGateOpen}
                            onClose={() => setIsGateOpen(false)}
                            courseId={courseId}
                            courseRawId={courseRawId as string}
                            courseTitle={learnHeader?.title ?? ""}
                            lessonId={contentId}
                            packageSlugs={requiredPackageSlugs}
                            context="challenge"
                            onPurchased={() => { void mutate() }}
                        />
                    </>
                ) : (
                    <Button variant="primary" onPress={() => router.push(`/courses/${courseId}`)}>
                        {t("reader.enrollCta")}
                    </Button>
                )}
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

                        {/* per-type solver dispatch — one normalizer key routes to the
                            matching existing solver. CODE gets the GradeCodePanel (AI
                            practice) PLUS the formal submission (chip + Nộp bài + attempts);
                            UI-UX gets its dedicated editor; MCQ/ESSAY keep the form. */}
                        {kind === "code" && detail ? (
                            <>
                                <section className="flex flex-col gap-4">
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

                                    {usesSubmissionMethod ? (
                                        /* CODE challenge with a submissionMethod → the github-URL +
                                           file-upload solver (ported from the lesson assignment card),
                                           honoring GITHUB|FILE|BOTH. History + count chip stay owned
                                           here; the solver revalidates via onSubmitted. */
                                        <ChallengeMethodSolver
                                            challengeId={challenge.id}
                                            submissionMethod={challenge.submissionMethod}
                                            gradingConfig={challenge.gradingConfig}
                                            maxSubmissions={challenge.maxSubmissions}
                                            reachedMax={reachedMax}
                                            onSubmitted={() => { void mutate() }}
                                        />
                                    ) : (
                                        <>
                                            {/* AI code-editing / feedback surface; its code + language
                                                are lifted so the formal submission below posts the same
                                                source (payloadType CODE). */}
                                            <GradeCodePanel
                                                challenge={detail}
                                                code={code}
                                                language={language}
                                                onCodeChange={setCode}
                                                onLanguageChange={setLanguageOverride}
                                            />

                                            {reachedMax ? (
                                                <div className="flex items-center gap-2 rounded-2xl border border-default bg-default/40 p-4">
                                                    <LockSimpleIcon aria-hidden focusable="false" className="size-5 shrink-0 text-muted" />
                                                    <Typography type="body-sm" color="muted">
                                                        {t("exercises.challenge.maxReached", { max: challenge.maxSubmissions })}
                                                    </Typography>
                                                </div>
                                            ) : (
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
                                            )}
                                        </>
                                    )}
                                </section>

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
                        ) : kind === "uiux" ? (
                            detail?.targetImageUrl ? (
                                <UiUxChallengeEditor challenge={detail} />
                            ) : (
                                <ComingSoonPanel />
                            )
                        ) : kind === "mcq" || kind === "essay" ? (
                            <>
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
                                            {kind === "mcq" ? (
                                                <McqForm
                                                    questions={challenge.mcqQuestions ?? []}
                                                    answers={answers}
                                                    onToggle={toggleAnswer}
                                                />
                                            ) : (
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
                        ) : (
                            <ComingSoonPanel />
                        )}
                    </>
                ) : null}
            </AsyncContent>
        </div>
    )
}

/** Coming-soon fallback for a solver kind with no reachable surface yet (UI/UX w/o a
 *  target asset, or an unmapped type like AI/Business). Mirrors the catalog view. */
const ComingSoonPanel = () => {
    const t = useTranslations("learn")
    return (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-default bg-surface p-6 py-16 text-center">
            <HammerIcon className="size-8 text-muted" aria-hidden focusable="false" />
            <Typography type="body-sm" weight="semibold">
                {t("exercises.challenge.comingSoonTitle")}
            </Typography>
            <Typography type="body-sm" color="muted">
                {t("exercises.challenge.comingSoonBody")}
            </Typography>
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
