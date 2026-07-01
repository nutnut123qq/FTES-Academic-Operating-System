"use client"

import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
    useRef,
} from "react"
import useSWR from "swr"
import Editor from "@monaco-editor/react"
import {
    Button,
    Chip,
} from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import { useTheme } from "next-themes"
import { useParams } from "next/navigation"
import { MarkdownContent } from "@/components/reuseable/MarkdownContent"
import { AIProcessingText } from "@/components/reuseable/AIProcessingText"
import { PracticeProblemSkeleton } from "./PracticeProblemSkeleton"
import { queryCodingProblem } from "@/modules/api/graphql/queries/query-coding-problem"
import { queryCodingProblemHint } from "@/modules/api/graphql/queries/query-coding-problem-hint"
import { queryMyCodingSubmissions } from "@/modules/api/graphql/queries/query-my-coding-submissions"
import { mutateSubmitCodingSolution } from "@/modules/api/graphql/mutations/mutation-submit-coding-solution"
import { mutateRevealCodingSolution } from "@/modules/api/graphql/mutations/mutation-reveal-coding-solution"
import { CodingDifficulty, CodingLanguage, CodingVerdict, type CodingProblem, type CodingProblemSolution, type CodingSubmission } from "@/modules/api/graphql/queries/types/coding"
import { useJobNotificationsSocketIo } from "@/hooks/socketio/useJobNotificationsSocketIo"
import { PublicationEvent } from "@/hooks/socketio/enums/publication-event"
import { JobCategory } from "@/modules/types/enums/job-category"
import { JobStatus } from "@/modules/types/enums/job-status"
import { useAppSelector } from "@/redux/hooks"

/** Props for {@link PracticeProblem}. */
export type PracticeProblemProps = Record<string, never>

/** Seniority level i18n key per difficulty (easy=junior, medium=mid, hard=senior). */
const LEVEL_KEY: Record<CodingDifficulty, string> = {
    [CodingDifficulty.Easy]: "junior",
    [CodingDifficulty.Medium]: "mid",
    [CodingDifficulty.Hard]: "senior",
}

/** Map a coding language to its Monaco editor language id. */
const MONACO_LANGUAGE: Record<CodingLanguage, string> = {
    [CodingLanguage.Python]: "python",
    [CodingLanguage.JavaScript]: "javascript",
    [CodingLanguage.TypeScript]: "typescript",
    [CodingLanguage.Java]: "java",
    [CodingLanguage.Cpp]: "cpp",
}

/** Chip color per verdict. */
const VERDICT_COLOR: Record<CodingVerdict, "success" | "danger" | "warning" | "default"> = {
    [CodingVerdict.Accepted]: "success",
    [CodingVerdict.WrongAnswer]: "danger",
    [CodingVerdict.TimeLimitExceeded]: "danger",
    [CodingVerdict.MemoryLimitExceeded]: "danger",
    [CodingVerdict.RuntimeError]: "danger",
    [CodingVerdict.CompileError]: "danger",
    [CodingVerdict.InternalError]: "warning",
    [CodingVerdict.Pending]: "default",
    [CodingVerdict.Judging]: "default",
}

/** Terminal job statuses — judging has finished (success or failure). */
const isTerminalStatus = (status: JobStatus | undefined): boolean =>
    status === JobStatus.Completed || status === JobStatus.Failed

/**
 * Coding-problem detail + editor. Two-pane layout separated by a single border
 * line (matching the course-learn page pattern): left = statement + samples +
 * hint; right = language selector + Monaco editor + submit + result + history.
 */
export const PracticeProblem = () => {
    const t = useTranslations()
    const locale = useLocale()
    const params = useParams()
    const slug = String(params.slug ?? "")
    const { theme } = useTheme()
    const socket = useJobNotificationsSocketIo()

    const [language, setLanguage] = useState<CodingLanguage>(CodingLanguage.Python)
    const [code, setCode] = useState<string>("")
    const [pendingJobId, setPendingJobId] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)
    // Live job status mirrored from Redux — the global /job_notifications lifecycle
    // dispatches every subscribed job's status into socketIo.jobStatusByJobId, the same
    // single source the challenge panel reads (no per-component EventEmitter listener).
    const pendingJobMessage = useAppSelector((state) =>
        (pendingJobId ? state.socketIo.jobStatusByJobId[pendingJobId] : undefined))
    const pendingJobStatus = pendingJobMessage?.data?.status
    const pendingJobError = pendingJobMessage?.data?.error
    const [showHint, setShowHint] = useState(false)
    const [showSolution, setShowSolution] = useState(false)
    // reference solutions arrive ONLY from the gated reveal mutation (never the
    // problem detail read) — held here once the learner reveals them
    const [revealedSolutions, setRevealedSolutions] = useState<Array<CodingProblemSolution>>([])
    const [solutionLanguage, setSolutionLanguage] = useState<CodingLanguage>(CodingLanguage.Python)
    const [touchedLanguages, setTouchedLanguages] = useState<Set<CodingLanguage>>(new Set())

    const telemetryRef = useRef({
        pasteCount: 0,
        pasteSizeMax: 0,
        keystrokeCount: 0,
        tabBlurCount: 0,
        timeOpen: Date.now(),
    })

    // Reset telemetry when the slug changes (user selects a new problem)
    useEffect(() => {
        telemetryRef.current = {
            pasteCount: 0,
            pasteSizeMax: 0,
            keystrokeCount: 0,
            tabBlurCount: 0,
            timeOpen: Date.now(),
        }
    }, [slug])

    // Track when window loses focus (user switching browser tabs/windows)
    useEffect(() => {
        const handleBlur = () => {
            telemetryRef.current.tabBlurCount += 1
        }
        window.addEventListener("blur", handleBlur)
        return () => window.removeEventListener("blur", handleBlur)
    }, [])

    const { data: problem, isLoading } = useSWR<CodingProblem | null>(
        ["coding-problem", slug],
        async () => {
            const response = await queryCodingProblem({ request: { slug } })
            return response.data?.codingProblem.data ?? null
        },
    )

    const { data: hint } = useSWR<string | null>(
        ["coding-problem-hint", slug],
        async () => {
            const response = await queryCodingProblemHint({ request: { slug } })
            return response.data?.codingProblemHint.data?.hint ?? null
        },
    )

    const { data: submissionsData, mutate: mutateSubmissions } = useSWR(
        ["my-coding-submissions", slug],
        async () => {
            const response = await queryMyCodingSubmissions({
                request: { slug, page: 1, limit: 20 },
            })
            return response.data?.myCodingSubmissions.data ?? null
        },
    )

    const starterByLanguage = useMemo(() => {
        const map = new Map<CodingLanguage, string>()
        problem?.starterCodes?.forEach((starter) => map.set(starter.language, starter.code))
        return map
    }, [problem?.starterCodes])

    const languages = useMemo<Array<CodingLanguage>>(() => {
        const withStarter = problem?.starterCodes?.map((starter) => starter.language) ?? []
        return withStarter.length > 0 ? withStarter : Object.values(CodingLanguage)
    }, [problem?.starterCodes])

    useEffect(() => {
        if (languages.length > 0 && !languages.includes(language)) {
            setLanguage(languages[0])
        }
    }, [languages, language])

    useEffect(() => {
        if (!touchedLanguages.has(language)) {
            setCode(starterByLanguage.get(language) ?? "")
        }
    }, [language, starterByLanguage, touchedLanguages])

    const latestSubmission = useMemo<CodingSubmission | undefined>(
        () => submissionsData?.submissions[0],
        [submissionsData?.submissions],
    )

    // reference solution code keyed by language (revealed in the "answer" panel)
    const solutionByLanguage = useMemo(() => {
        const map = new Map<CodingLanguage, string>()
        revealedSolutions.forEach((solution) => map.set(solution.language, solution.code))
        return map
    }, [revealedSolutions])

    // languages that actually ship a reference solution
    const solutionLanguages = useMemo<Array<CodingLanguage>>(
        () => revealedSolutions.map((solution) => solution.language),
        [revealedSolutions],
    )

    // keep the solution language switcher pinned to an available language
    useEffect(() => {
        if (solutionLanguages.length > 0 && !solutionLanguages.includes(solutionLanguage)) {
            setSolutionLanguage(solutionLanguages[0])
        }
    }, [solutionLanguages, solutionLanguage])

    // toggle the answer panel; revealing it forfeits the problem's points, so
    // confirm first and record the reveal server-side (best-effort)
    const onToggleSolution = useCallback(async () => {
        if (showSolution) {
            setShowSolution(false)
            return
        }
        if (!window.confirm(t("codingPractice.revealConfirm"))) {
            return
        }
        try {
            // the gated reveal mutation both records the forfeit AND returns the
            // reference solutions — the only path by which they reach the client
            const response = await mutateRevealCodingSolution({ request: { slug } })
            setRevealedSolutions(response.data?.revealCodingSolution.data?.solutions ?? [])
            setShowSolution(true)
        } catch {
            // reveal failed (network/auth) — keep the answer panel closed
        }
    }, [showSolution, slug, t])

    const onSubmit = useCallback(async () => {
        setSubmitting(true)
        try {
            const timeOpenToSubmitMs = Date.now() - telemetryRef.current.timeOpen
            const response = await mutateSubmitCodingSolution({
                request: {
                    slug,
                    language,
                    sourceCode: code,
                    telemetry: {
                        pasteCount: telemetryRef.current.pasteCount,
                        pasteSizeMax: telemetryRef.current.pasteSizeMax,
                        keystrokeCount: telemetryRef.current.keystrokeCount,
                        tabBlurCount: telemetryRef.current.tabBlurCount,
                        timeOpenToSubmitMs,
                    },
                },
            })
            const jobId = response.data?.submitCodingSolution.data?.jobId
            if (!jobId) return
            // Subscribe to the job room BEFORE the refetch so an early socket push is
            // never missed (race-free, like challenge). Status comes from Redux.
            setPendingJobId(jobId)
            socket.emit(PublicationEvent.SubscribeJobNotification, {
                data: { jobId },
                locale,
            })
            void mutateSubmissions()
        } finally {
            setSubmitting(false)
        }
    }, [slug, language, code, mutateSubmissions, socket, locale])

    // When the watched job reaches a terminal status (from Redux), refetch the
    // submissions (verdict now persisted) and stop watching.
    useEffect(() => {
        if (pendingJobId && isTerminalStatus(pendingJobStatus)) {
            void mutateSubmissions()
            setPendingJobId(null)
        }
    }, [pendingJobId, pendingJobStatus, mutateSubmissions])

    const judging = pendingJobId !== null

    if (isLoading || !problem) {
        return <PracticeProblemSkeleton />
    }

    return (
        // two-pane split matching the learn/modules layout: left | right divided by border-r
        <div className="grid h-[calc(100vh-4rem)] grid-cols-1 lg:grid-cols-2">

            {/* ── LEFT: statement + samples + hint ── */}
            <div className="flex flex-col overflow-y-auto border-r">
                {/* problem header */}
                <div className="flex items-center justify-between gap-3 border-b px-6 py-4">
                    <h1 className="text-xl font-bold">{problem.title}</h1>
                    <div className="flex items-center gap-1.5">
                        <Chip size="sm" variant="soft" color="default">
                            {t(`codingPractice.level.${LEVEL_KEY[problem.difficulty]}`)}
                        </Chip>
                        <Chip size="sm" variant="soft" color="success">
                            {t("codingPractice.points", { points: problem.points })}
                        </Chip>
                    </div>
                </div>

                {/* statement body */}
                <div className="flex flex-col gap-6 px-6 py-5">
                    <MarkdownContent markdown={problem.statement ?? ""} />

                    {/* sample testcases */}
                    {(problem.testcases?.length ?? 0) > 0 && (
                        <div className="flex flex-col gap-3">
                            <div className="border-t" />
                            <p className="font-semibold">{t("codingPractice.samples")}</p>
                            {problem.testcases?.map((testcase, index) => (
                                <div key={testcase.id} className="rounded-medium bg-default-100 p-3">
                                    <p className="text-sm font-medium">
                                        {t("codingPractice.example")} {index + 1}
                                    </p>
                                    <pre className="mt-1 whitespace-pre-wrap text-sm">
                                        <span className="text-muted">{t("codingPractice.input")}: </span>
                                        {testcase.input}
                                    </pre>
                                    <pre className="whitespace-pre-wrap text-sm">
                                        <span className="text-muted">{t("codingPractice.output")}: </span>
                                        {testcase.expectedOutput}
                                    </pre>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* approach hint — toggled, sourced from Elasticsearch */}
                    {hint && (
                        <div className="flex flex-col gap-3">
                            <div className="border-t" />
                            <div className="flex items-center justify-between gap-1.5">
                                <p className="font-semibold">{t("codingPractice.hintTitle")}</p>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onPress={() => setShowHint((prev) => !prev)}
                                >
                                    {showHint ? t("codingPractice.hideHint") : t("codingPractice.showHint")}
                                </Button>
                            </div>
                            {showHint && <MarkdownContent markdown={hint} />}
                        </div>
                    )}

                    {/* reference solutions — reveal-gated, one tab per language */}
                    {solutionLanguages.length > 0 && (
                        <div className="flex flex-col gap-3">
                            <div className="border-t" />
                            <div className="flex items-center justify-between gap-1.5">
                                <p className="font-semibold">{t("codingPractice.solutionTitle")}</p>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onPress={onToggleSolution}
                                >
                                    {showSolution
                                        ? t("codingPractice.hideSolution")
                                        : t("codingPractice.showSolution")}
                                </Button>
                            </div>
                            {showSolution && (
                                <div className="flex flex-col gap-3">
                                    {/* language switcher for the revealed solution */}
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        {solutionLanguages.map((option) => (
                                            <Button
                                                key={option}
                                                size="sm"
                                                variant={solutionLanguage === option ? "primary" : "secondary"}
                                                onPress={() => setSolutionLanguage(option)}
                                            >
                                                {t(`codingPractice.language.${option}`)}
                                            </Button>
                                        ))}
                                    </div>
                                    {/* fenced code block → syntax-highlighted by MarkdownContent */}
                                    <MarkdownContent
                                        markdown={`\`\`\`${MONACO_LANGUAGE[solutionLanguage]}\n${
                                            solutionByLanguage.get(solutionLanguage) ?? ""
                                        }\n\`\`\``}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── RIGHT: editor + submit + result + history ── */}
            <div className="flex flex-col overflow-y-auto">
                {/* language selector */}
                <div className="flex flex-wrap items-center gap-1.5 border-b px-6 py-3">
                    {languages.map((option) => (
                        <Button
                            key={option}
                            size="sm"
                            variant={language === option ? "primary" : "secondary"}
                            onPress={() => setLanguage(option)}
                        >
                            {t(`codingPractice.language.${option}`)}
                        </Button>
                    ))}
                </div>

                {/* Monaco editor — fills remaining vertical space */}
                <div className="flex-1 border-b">
                    <Editor
                        height="100%"
                        language={MONACO_LANGUAGE[language]}
                        theme={theme === "dark" ? "vs-dark" : "light"}
                        value={code}
                        onChange={(value) => {
                            setCode(value ?? "")
                            setTouchedLanguages((prev) => new Set(prev).add(language))
                        }}
                        onMount={(editor) => {
                            editor.onDidPaste((e) => {
                                const model = editor.getModel()
                                const pastedText = model ? model.getValueInRange(e.range) : ""
                                const size = pastedText.length
                                telemetryRef.current.pasteCount += 1
                                telemetryRef.current.pasteSizeMax = Math.max(
                                    telemetryRef.current.pasteSizeMax,
                                    size
                                )
                            })
                            editor.onKeyDown(() => {
                                telemetryRef.current.keystrokeCount += 1
                            })
                            editor.onDidBlurEditorText(() => {
                                telemetryRef.current.tabBlurCount += 1
                            })
                        }}
                        options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            scrollBeyondLastLine: false,
                            padding: { top: 12, bottom: 12 },
                        }}
                    />
                </div>

                {/* submit bar */}
                <div className="flex items-center justify-end border-b px-6 py-3">
                    <Button
                        variant="primary"
                        isPending={submitting || judging}
                        isDisabled={code.trim().length === 0}
                        onPress={onSubmit}
                    >
                        {judging ? t("codingPractice.judging") : t("codingPractice.submit")}
                    </Button>
                </div>

                {/* live judging indicator — realtime via /job_notifications socket */}
                {pendingJobId && pendingJobStatus && (
                    <div className="border-b px-6 py-4">
                        <AIProcessingText
                            jobCategory={JobCategory.JudgeCoding}
                            jobStatus={pendingJobStatus}
                            error={pendingJobError}
                        />
                    </div>
                )}

                {/* result panel */}
                {!pendingJobId && latestSubmission && (
                    <div className="flex flex-col gap-1.5 border-b px-6 py-4">
                        <div className="flex items-center justify-between">
                            <p className="font-semibold">{t("codingPractice.result")}</p>
                            <Chip variant="soft" color={VERDICT_COLOR[latestSubmission.verdict]}>
                                {t(`codingPractice.verdict.${latestSubmission.verdict}`)}
                            </Chip>
                        </div>
                        <p className="text-sm text-muted">
                            {t("codingPractice.passed")}: {latestSubmission.passedCount}/{latestSubmission.totalCount}
                            {latestSubmission.runtimeMs !== null && (
                                <> · {latestSubmission.runtimeMs} ms</>
                            )}
                            {latestSubmission.memoryKb !== null && (
                                <> · {latestSubmission.memoryKb} KB</>
                            )}
                        </p>
                        {latestSubmission.compileOutput && (
                            <pre className="whitespace-pre-wrap rounded-medium bg-danger-50 p-2 text-xs text-danger">
                                {latestSubmission.compileOutput}
                            </pre>
                        )}
                    </div>
                )}

                {/* submission history */}
                {(submissionsData?.submissions.length ?? 0) > 0 && (
                    <div className="flex flex-col gap-1.5 px-6 py-4">
                        <p className="font-semibold">{t("codingPractice.history")}</p>
                        <div className="flex flex-col gap-1.5">
                            {submissionsData?.submissions.map((submission: CodingSubmission) => (
                                <div
                                    key={submission.id}
                                    className="flex items-center justify-between py-1 text-sm"
                                >
                                    <span className="text-muted">
                                        {new Date(submission.createdAt).toLocaleString()}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Chip size="sm" variant="soft" color="default">
                                            {t(`codingPractice.language.${submission.language}`)}
                                        </Chip>
                                        <Chip size="sm" variant="soft" color={VERDICT_COLOR[submission.verdict]}>
                                            {t(`codingPractice.verdict.${submission.verdict}`)}
                                        </Chip>
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
