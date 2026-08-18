"use client"

import React, { useMemo, useState } from "react"
import {
    Button,
    Chip,
    Typography,
    cn,
} from "@heroui/react"
import {
    CaretDownIcon,
    CheckSquareIcon,
    HammerIcon,
    LockSimpleIcon,
    PuzzlePieceIcon,
    SquareIcon,
    WarningCircleIcon,
} from "@phosphor-icons/react"
import { useLocale, useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { revalidateLearnData } from "@/components/features/learn/hooks/revalidateLearnData"
import { PageHeader } from "@/components/blocks/layout/PageHeader"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { MarkdownContent } from "@/components/reuseable/MarkdownContent"
import { useRouter } from "@/i18n/navigation"
import { RestError } from "@/modules/api/rest/client"
import type { ChallengeView, McqQuestionView, SubmissionView, SubmitRequest } from "@/modules/api/rest/challenges"
import { useRestWithToast } from "@/modules/toast/hooks"
import { usePostSubmitChallengeSwr } from "@/hooks/swr/api/rest/mutations/usePostSubmitChallengeSwr"
import { useGetMyCourseAccessSwr } from "@/hooks/swr/api/rest/queries/useGetMyCourseAccessSwr"
import { PackageGateModal } from "@/components/features/course/PackageGateModal"
import { useQueryCoursePackagesSwr } from "@/components/features/course/hooks/useQueryCoursePackagesSwr"
import { resolveTierColor, resolveTierLabel } from "@/components/features/course/tierLabels"
import { GradeCodePanel } from "@/components/features/challenge/ChallengeView/GradeCodePanel"
import { GradeResultCard } from "@/components/features/challenge/ChallengeView/GradeCodePanel/GradeResultCard"
import { UiUxChallengeEditor } from "@/components/features/challenge/ChallengeView/UiUxChallengeEditor"
import { mapChallengeType } from "@/components/features/challenge/hooks/useQueryChallengesSwr"
import type { ChallengeDetail } from "@/components/features/challenge/hooks/useQueryChallengeSwr"
import { normalizeExerciseType } from "../exerciseType"
import {
    hasSubmissionMethod,
    parseGradingConfigFileExtension,
    parseGradingConfigStarterCode,
    runnableLanguageFromFileExtension,
} from "../submissionMethods"
import { useQueryLearnCourseSwr } from "../hooks/useQueryLearnCourseSwr"
import {
    isChallengeSubmissionPending,
    useQueryChallengeSubmissionSwr,
} from "../hooks/useQueryChallengeSubmissionSwr"
import { useQueryChallengeSubmissionResultsSwr } from "../hooks/useQueryChallengeSubmissionResultsSwr"
import { resolveAiFeedbackAllowance } from "./challenge-limits"
import { ChallengeMethodSolver } from "./ChallengeMethodSolver"
import { ChallengeProblemAside } from "./ChallengeProblemAside"
import { ProjectReviewResult } from "./ProjectReviewResult"
import { TestCaseResultTable } from "./TestCaseResultTable"

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
    challengeUuid: view.id,
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
    // Learner-safe starter (grading_config.starterCode) + the SAMPLE (non-hidden) test
    // cases exposed on the view — drive the sandbox prefill + "Chạy test" / "Ví dụ".
    starterCode: parseGradingConfigStarterCode(view.gradingConfig),
    sampleTestCases: view.sampleTestCases ?? undefined,
    tags: view.tags ?? [],
    // An exam paper is a challenge-bank thing (a PE paper read on /challenges/{id}), not
    // a lesson exercise — the lesson solver never renders one, so it stays null here.
    paperUrl: null,
    paperMime: null,
    paperFiles: null,
    // The uploader card only surfaces on the paper surface (`ChallengePaper`), which this
    // lesson solver never reaches; passed through anyway so the two mappers agree on the
    // BE field rather than one of them quietly dropping it. Same for the posted instant,
    // which no BE build sends yet (see `ChallengeDetailView.createdAt`).
    author: view.author ?? null,
    createdAt: view.createdAt ?? null,
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
 * A code challenge also surfaces the two budgets the BE now reports
 * (`challenge-testcase-samples`): the challenge's time/memory limits, shown with the problem
 * statement ({@link ChallengeProblemAside}), and the learner's remaining AI-feedback attempts,
 * shown beside the attempts chip. The AI allowance NEVER gates submitting — this flow is
 * GRADE = SUBMIT and the score comes from the test cases, so running out only means the
 * submission lands without FrosTES comments.
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
    // Learner-picked AI grading model — lifted so the GradeCodePanel toolbar picker drives
    // the model of the formal CODE "Nộp bài", not just the in-panel practice grade (pinned
    // contract §2: a CODE submission carries an optional model). Null → the BE default.
    const [model, setModel] = useState<string | null>(null)

    const type = challenge?.type ?? ""
    /** Unified solver kind — the single dispatch key across both BE type vocabularies. */
    const kind = normalizeExerciseType(type)
    // A CODE challenge that carries a real `submissionMethod` (GITHUB|FILE|BOTH) is solved
    // via the github-URL + file-upload solver; absent/unknown → the inline code editor.
    const usesSubmissionMethod = hasSubmissionMethod(challenge?.submissionMethod)
    const detail = useMemo(() => (challenge ? toChallengeDetail(challenge) : null), [challenge])
    // EVERY code challenge (inline editor OR github/file/sandbox solver) renders as the
    // unified 2-column split — work area LEFT, problem ("Đề bài") + SQL dataset RIGHT — so it
    // needs the wider surface, and the standalone description card is suppressed (the problem
    // lives once in the right column via ChallengeProblemAside). MCQ/ESSAY/UI-UX keep the
    // narrow reading column with the description card above.
    const isSplitLayout = kind === "code"
    // The seed schema/ERD in the right column shows for a SQL-typed challenge AND for a
    // CODE/CODING challenge whose runnable `fileExtension` is `.sql` (its sandbox runs SQL,
    // so the seeded dataset is what the learner queries) — mirroring how the method solver
    // derives its sandbox language, so the schema isn't missing for that edge case.
    const isSqlChallenge =
        detail?.type === "sql" ||
        runnableLanguageFromFileExtension(
            challenge?.fileExtension ?? parseGradingConfigFileExtension(challenge?.gradingConfig),
        ) === "sql"
    // BE chấm theo test case cho CODING/SQL (ChallengeType.isCodingFamily) và bằng LLM cho
    // CODE/ESSAY — hai đường loại trừ nhau. `detail.type` KHÔNG dùng được để phân biệt vì
    // mapChallengeType gộp cả CODE lẫn CODING thành "coding"; phải soi raw type của BE.
    const isTestCaseGraded = ["CODING", "SQL"].includes(
        (challenge?.type ?? "").toUpperCase().replace(/[\s_-]/g, ""),
    )
    // Lượt FrosTES NHẬN XÉT (BE challenge-testcase-samples) — khác hẳn "lượt nộp": mentor đặt
    // 1..5 lượt/(bài, học viên), BE đếm bền vững từ kết quả đã lưu. Hết lượt thì AI thôi nhận
    // xét, bài VẪN nộp được và VẪN được test case chấm điểm — nên nó không bao giờ khoá nút nộp.
    // `null` khi BE chưa trả (deployment cũ) ⇒ không hiện gì, tránh nói "còn 0 lượt" khi thực ra
    // là "không biết".
    const aiFeedback = resolveAiFeedbackAllowance(
        challenge?.aiFeedbackLimit,
        challenge?.aiFeedbackUsed,
    )
    // SQL grades static-only (no language pick); everything else defaults to python.
    const language = languageOverride ?? (detail?.type === "sql" ? "sql" : "python")
    // Lượt ĐÃ TIÊU phải khớp BE: `countConsumingAttempts` đếm với `status <> 'FAILED'` — bài
    // chết vì lỗi hệ thống (chấm cạn retry → DLQ, không có điểm/nhận xét) KHÔNG tiêu lượt của
    // học viên. Đếm cả FAILED ở FE làm chip hiện thừa lượt và khoá nút sớm dù BE vẫn nhận bài.
    const usedCount = submissions.filter((submission) => submission.status !== "FAILED").length
    const reachedMax = challenge ? usedCount >= challenge.maxSubmissions : false
    // Quyền học FULL trên khoá quyết định cap chấm project: có quyền → chỉ còn `maxSubmissions`
    // của mentor, còn học thử / free-enroll giữ PROJECT_GRADE_LIMIT (chặn chi phí AI với người
    // chưa trả tiền). PHẢI đọc `fullAccess`, KHÔNG phải `purchased`: BE gate bằng
    // `hasEntitledLessonAccess` (FULL access qua entitlement trả phí HOẶC enrollment LEGACY
    // active), trong khi `purchased` theo định nghĩa của `PurchaseFlagService` chỉ true khi có
    // `package_purchases` ACTIVE — người học khoá LEGACY (chỉ có enrollment, không có purchase
    // row) sẽ ra false và bị FE khoá ở 2 lượt dù BE vẫn nhận bài. Keyed theo course UUID; gọi
    // hỏng / thiếu courseId → coi như không có quyền, khớp BE (cũng áp cap khi không phân giải được).
    const { data: courseAccess } = useGetMyCourseAccessSwr(challenge?.courseId || undefined)
    const hasFullAccess = courseAccess?.fullAccess ?? false
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
            return { payloadType: "CODE", code, language: language.trim() || "text", ...(model ? { model } : {}) }
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
                            // the challenge is this surface's own query; the rest of the learn
                            // shell (outline locks, sibling lessons, progress) needs the helper
                            onPurchased={() => {
                                void mutate()
                                void revalidateLearnData(courseId)
                            }}
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
        <div className={cn("mx-auto flex w-full flex-col gap-6", isSplitLayout ? "max-w-6xl" : "max-w-3xl")}>
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

                        {/* A code challenge moves its problem statement into the RIGHT column of
                            the split (ChallengeProblemAside), so the standalone card is only for
                            the narrow-column types (MCQ / ESSAY / UI-UX). */}
                        {challenge.description && !isSplitLayout ? (
                            <div className="rounded-3xl border border-default bg-surface p-6 text-sm">
                                {/* HTML từ rich-text editor của admin — xem ChallengeProblemAside. */}
                                <MarkdownContent reading allowHtml markdown={challenge.description} />
                            </div>
                        ) : null}

                        {/* per-type solver dispatch — one normalizer key routes to the
                            matching existing solver. CODE gets the GradeCodePanel (AI
                            practice) PLUS the formal submission (chip + Nộp bài + attempts);
                            UI-UX gets its dedicated editor; MCQ/ESSAY keep the form. */}
                        {kind === "code" && detail ? (
                            <>
                                {/* "Bài nộp của bạn" + attempts count — ABOVE the split, full width. */}
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <PuzzlePieceIcon aria-hidden focusable="false" className="size-5 text-accent" />
                                        <Typography type="body" weight="semibold">
                                            {t("exercises.challenge.submitTitle")}
                                        </Typography>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        {/* Lượt AI nhận xét còn lại — chip RIÊNG cạnh lượt nộp,
                                            vì hai hạn mức khác nhau: hết lượt AI vẫn nộp được. */}
                                        {aiFeedback ? (
                                            <Chip
                                                size="sm"
                                                variant="soft"
                                                color={aiFeedback.exhausted ? "warning" : undefined}
                                                className="shrink-0"
                                            >
                                                {t("exercises.challenge.aiFeedbackCount", {
                                                    remaining: aiFeedback.remaining,
                                                    limit: aiFeedback.limit,
                                                })}
                                            </Chip>
                                        ) : null}
                                        <Chip size="sm" variant="soft" className="shrink-0">
                                            {t("exercises.challenge.submissionsCount", {
                                                used: usedCount,
                                                max: challenge.maxSubmissions,
                                            })}
                                        </Chip>
                                    </div>
                                </div>

                                {/* Điểm do TEST CASE chấm, AI chỉ nhận xét — nói rõ ngay cạnh
                                    nút nộp. Hết lượt: nêu lý do + khẳng định vẫn nộp được (nút
                                    nộp KHÔNG bị khoá bởi hạn mức này). */}
                                {aiFeedback ? (
                                    aiFeedback.exhausted ? (
                                        <div className="flex items-start gap-2 rounded-2xl border border-warning/40 bg-warning/5 p-3">
                                            <WarningCircleIcon
                                                aria-hidden
                                                focusable="false"
                                                className="mt-0.5 size-4 shrink-0 text-warning"
                                            />
                                            <div className="flex min-w-0 flex-col gap-0">
                                                <Typography type="body-xs" color="muted">
                                                    {t("exercises.challenge.aiFeedbackExhausted", {
                                                        limit: aiFeedback.limit,
                                                    })}
                                                </Typography>
                                                {isTestCaseGraded ? (
                                                    <Typography type="body-xs" color="muted">
                                                        {t("exercises.challenge.aiFeedbackHintTests")}
                                                    </Typography>
                                                ) : null}
                                            </div>
                                        </div>
                                    ) : (
                                        <Typography type="body-xs" color="muted">
                                            {t(isTestCaseGraded
                                                ? "exercises.challenge.aiFeedbackHintTests"
                                                : "exercises.challenge.aiFeedbackHint")}
                                        </Typography>
                                    )
                                ) : null}

                                {/* THE 2-COLUMN SPLIT — one consistent frame for every submission
                                    tab (github / file / code): WORK AREA left (wider), PROBLEM +
                                    SQL dataset right. Mobile (<lg) stacks to one column: work area
                                    first, then problem/dataset. */}
                                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                                    <div className="flex min-w-0 flex-col gap-4">
                                        {usesSubmissionMethod ? (
                                            /* CODE challenge with a submissionMethod → the tabbed
                                               github-URL / file-upload / sandbox work area (honoring
                                               GITHUB|FILE|BOTH + a runnable fileExtension). History +
                                               count chip stay owned here; it revalidates via onSubmitted. */
                                            <ChallengeMethodSolver
                                                challengeId={challenge.id}
                                                submissionMethod={challenge.submissionMethod}
                                                gradingConfig={challenge.gradingConfig}
                                                challengeDetail={detail}
                                                fileExtension={challenge.fileExtension}
                                                seedSql={challenge.seedSql}
                                                maxSubmissions={challenge.maxSubmissions}
                                                purchased={hasFullAccess}
                                                reachedMax={reachedMax}
                                                submissions={submissions}
                                                onSubmitted={() => { void mutate() }}
                                            />
                                        ) : (
                                            <>
                                                {/* Inline "Code trực tiếp" work area. GRADE = SUBMIT:
                                                    the panel's PRIMARY "Nộp & Chấm AI" posts the same
                                                    source it edits/Runs (payloadType CODE, one attempt);
                                                    "Run" stays free. Submit is gated at max via
                                                    submitDisabled, so Run keeps working when locked. */}
                                                <GradeCodePanel
                                                    challenge={detail}
                                                    // The raw REST view's `id` is the challenge
                                                    // UUID (detail.id is the slug) — sent so the
                                                    // BE can enforce the free-trial run/grade caps.
                                                    challengeId={challenge.id}
                                                    code={code}
                                                    language={language}
                                                    onCodeChange={setCode}
                                                    onLanguageChange={setLanguageOverride}
                                                    model={model}
                                                    onModelChange={setModel}
                                                    setupSql={challenge.seedSql ?? undefined}
                                                    // The seed's schema/ERD is rendered once in the
                                                    // right column (ChallengeProblemAside) — suppress
                                                    // the panel's raw-seed block so it isn't shown twice.
                                                    hideSeedNote
                                                    onSubmit={() => void handleSubmit()}
                                                    submitLabel={t(isTestCaseGraded
                                                        ? "exercises.challenge.gradeSubmitTests"
                                                        : "exercises.challenge.gradeSubmit")}
                                                    scoreSource={isTestCaseGraded ? "tests" : "ai"}
                                                    isSubmitting={submit.isMutating}
                                                    submitDisabled={!canSubmit}
                                                />

                                                {reachedMax ? (
                                                    <div className="flex items-center gap-2 rounded-2xl border border-default bg-default/40 p-4">
                                                        <LockSimpleIcon aria-hidden focusable="false" className="size-5 shrink-0 text-muted" />
                                                        <Typography type="body-sm" color="muted">
                                                            {t("exercises.challenge.maxReached", { max: challenge.maxSubmissions })}
                                                        </Typography>
                                                    </div>
                                                ) : null}
                                            </>
                                        )}
                                    </div>

                                    {/* PROBLEM ("Đề bài") + SQL dataset — the RIGHT column, single
                                        source shown for every tab. */}
                                    <ChallengeProblemAside
                                        title={challenge.title}
                                        description={challenge.description}
                                        isSql={Boolean(isSqlChallenge)}
                                        seedSql={challenge.seedSql}
                                        sampleTestCases={challenge.sampleTestCases ?? undefined}
                                        // Ngân sách thời gian/bộ nhớ của bài (BE trả max trong
                                        // bộ test) — hiện cùng đề, ẩn khi BE không trả.
                                        timeLimitMs={challenge.timeLimitMs}
                                        memoryLimitMb={challenge.memoryLimitMb}
                                    />
                                </div>

                                {history.length > 0 ? (
                                    <section className="flex flex-col gap-3">
                                        <Typography type="body" weight="semibold">
                                            {t("exercises.challenge.historyTitle")}
                                        </Typography>
                                        {history.map((attempt) => (
                                            <AttemptRow
                                                key={attempt.id}
                                                attempt={attempt}
                                                challengeId={challenge.id}
                                                locale={locale}
                                                reviewable
                                            />
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
                                            <AttemptRow
                                                key={attempt.id}
                                                attempt={attempt}
                                                challengeId={challenge.id}
                                                locale={locale}
                                            />
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

/**
 * One row in the attempts history — attempt no, status, final/auto score. For a graded
 * ({@link reviewable}) code attempt, a "Xem kết quả" toggle lazily loads the submission's
 * detailed result and renders BOTH parts when present: the deterministic per-test-case table
 * ({@link TestCaseResultTable} — the judge's score, contract `challenge-testcase-judge`) and
 * the AI feedback via the shared {@link GradeResultCard} — the same card the in-panel
 * practice grade uses. A test-case-graded submission carries NO `aiFeedback`, so the empty
 * state must consider `results` too.
 */
const AttemptRow = ({
    attempt,
    challengeId,
    locale,
    reviewable = false,
}: {
    attempt: SubmissionView
    challengeId: string
    locale: string
    reviewable?: boolean
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

    // Re-view is a graded code attempt only, and fetches lazily — the results read fires
    // once expanded, so the list never bulk-loads every attempt's feedback up front.
    const canReview = reviewable && completed
    const [expanded, setExpanded] = useState(false)
    const resultsSwr = useQueryChallengeSubmissionResultsSwr(
        challengeId,
        attempt.id,
        expanded && canReview,
    )
    const aiFeedback = resultsSwr.data?.aiFeedback
    // Deterministic per-test-case rows (challenge-testcase-judge): an inline CODE challenge
    // graded by test cases carries these and NO `aiFeedback` — so the result is "empty" only
    // when BOTH are missing, otherwise a scored submission would render the empty state.
    const testResults = resultsSwr.data?.results ?? []
    const hasTestResults = testResults.length > 0

    return (
        <div className="flex flex-col gap-3 rounded-2xl border border-default bg-surface p-4">
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

            {canReview ? (
                <>
                    <button
                        type="button"
                        onClick={() => setExpanded((open) => !open)}
                        aria-expanded={expanded}
                        className="flex w-fit cursor-pointer items-center gap-1 text-sm font-medium text-accent hover:underline"
                    >
                        {t(expanded ? "exercises.challenge.hideResult" : "exercises.challenge.viewResult")}
                        <CaretDownIcon
                            aria-hidden
                            focusable="false"
                            className={cn("size-4 transition-transform", expanded ? "rotate-180" : "")}
                        />
                    </button>
                    {expanded ? (
                        <AsyncContent
                            isLoading={resultsSwr.isLoading && !resultsSwr.data}
                            skeleton={<Skeleton className="h-40 w-full rounded-3xl" />}
                            isEmpty={Boolean(resultsSwr.data) && !aiFeedback && !hasTestResults}
                            emptyContent={{ title: t("exercises.challenge.resultEmpty") }}
                            error={!resultsSwr.data ? resultsSwr.error : undefined}
                            errorContent={{
                                title: t("exercises.challenge.resultError"),
                                onRetry: () => { void resultsSwr.mutate() },
                                retryLabel: t("common.retry"),
                            }}
                        >
                            {/* A submission can carry BOTH: the deterministic test-case table
                                (the score) AND the AI feedback (now feedback-only for inline
                                CODE). The judge result leads; the AI notes follow. */}
                            <div className="flex flex-col gap-3">
                                {hasTestResults ? <TestCaseResultTable results={testResults} /> : null}
                                {aiFeedback ? (
                                    // OFF_TOPIC submission → the per-line project review is meaningless,
                                    // so show ONLY the flat score card (with a note). A missing
                                    // `relevance` reads as RELATED (backward-compatible — older grades
                                    // keep the existing review). Otherwise a project grade carries
                                    // `changes` (agentic per-line review) → the VS Code tree + inline
                                    // before/after diff; a plain code/URL grade keeps the flat card.
                                    aiFeedback.relevance === "OFF_TOPIC" ? (
                                        <div className="flex flex-col gap-3">
                                            <div className="flex items-start gap-2 rounded-2xl border border-warning/40 bg-warning/5 p-3">
                                                <WarningCircleIcon aria-hidden focusable="false" className="mt-0.5 size-4 shrink-0 text-warning" />
                                                <div className="flex min-w-0 flex-col gap-1">
                                                    <Typography type="body-sm" weight="semibold" className="text-warning">
                                                        {t("exercises.challenge.offTopicTitle")}
                                                    </Typography>
                                                    {aiFeedback.relevanceReason ? (
                                                        <Typography type="body-xs" color="muted">
                                                            {aiFeedback.relevanceReason}
                                                        </Typography>
                                                    ) : null}
                                                </div>
                                            </div>
                                            <GradeResultCard result={aiFeedback} scoreOwnedByTests={hasTestResults} />
                                        </div>
                                    ) : Array.isArray(aiFeedback.changes) ? (
                                        <ProjectReviewResult
                                            challengeId={challengeId}
                                            submissionId={attempt.id}
                                            aiFeedback={aiFeedback}
                                        />
                                    ) : (
                                        <GradeResultCard result={aiFeedback} scoreOwnedByTests={hasTestResults} />
                                    )
                                ) : null}
                            </div>
                        </AsyncContent>
                    ) : null}
                </>
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
