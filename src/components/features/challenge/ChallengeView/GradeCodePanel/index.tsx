"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import {
    Button,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownPopover,
    DropdownTrigger,
    Spinner,
    Typography,
    cn,
} from "@heroui/react"
import {
    CaretDownIcon,
    ListChecksIcon,
    LockSimpleIcon,
    MagicWandIcon,
    PlayIcon,
    SparkleIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { AiModelPicker } from "@/components/reuseable/AiModelPicker"
import { useGetAiCatalogModelsSwr } from "@/hooks/swr/api/rest/queries"
import {
    usePostExecuteCodeSwr,
    usePostExecuteSqlSwr,
    usePostGradeCodeSwr,
    usePostRunTestsSwr,
} from "@/hooks/swr/api/rest/mutations"
import { RestError } from "@/modules/api/rest/client"
import type {
    CodeExecuteResult,
    CodeExecutionSummary,
    CodeGradeResult,
    SqlRunResult,
} from "@/modules/api/rest/ai"
import type { ChallengeDetail } from "../../hooks/useQueryChallengeSwr"
import { ExecutionResultTable } from "./ExecutionResultTable"
import { GradeCodeEditor } from "./GradeCodeEditor"
import type { GradeCodeEditorHandle } from "./GradeCodeEditor"
import { GradeResultCard } from "./GradeResultCard"
import { RunOutputPanel } from "./RunOutputPanel"
import { SqlResultTable } from "./SqlResultTable"

/** Props for {@link GradeCodePanel}. */
export interface GradeCodePanelProps {
    /** The challenge being solved (prefills the exercise question). */
    challenge: ChallengeDetail
    /** Extra classes. */
    className?: string
    /**
     * Controlled code source. When set (with {@link onCodeChange}) the caller owns the
     * editor content — used by the learn challenge surface so the same code the learner
     * edits/AI-tests here is what its "Nộp bài" action posts formally. Omit for the
     * standalone catalog solver (the panel then keeps its own internal state).
     */
    code?: string
    /** Controlled editor language (see {@link code}). Omit for internal state. */
    language?: string
    /** Reports code edits to a controlling caller (pairs with {@link code}). */
    onCodeChange?: (code: string) => void
    /** Reports language changes to a controlling caller (pairs with {@link language}). */
    onLanguageChange?: (language: string) => void
    /**
     * Controlled AI grading model id (pairs with {@link onModelChange}). Set by the learn
     * submission sandbox so the model the learner picks in this panel's toolbar also
     * threads into its formal `CODE` "Nộp bài" — not just the in-panel practice grade.
     * `null` = the BE default. Omit both for the standalone catalog solver (the panel then
     * keeps its own internal model state).
     */
    model?: string | null
    /** Reports model changes to a controlling caller (pairs with {@link model}). */
    onModelChange?: (model: string | null) => void
    /**
     * SQL seed dataset (the challenge's `seedSql`, VISIBLE to the learner). When set on
     * a SQL exercise it is threaded into the sandbox Run path as `setup_sql` — seeded
     * fresh, run in the same rolled-back transaction as the query — and shown to the
     * learner so they know the schema/data to query. Omit for a self-contained SQL
     * scratchpad (the panel keeps its "scalar-only" note).
     */
    setupSql?: string
    /**
     * Suppress the panel's own SQL dataset footer (the raw seed `<pre>` / scalar note).
     * Set by the submission surface, where the seed's schema/ERD is already rendered once
     * in the problem column ({@link ChallengeProblemAside}) — leaving the panel's raw block
     * on would show the same dataset twice. Omit for the standalone catalog solver, which
     * has no problem column and so keeps the raw seed / scalar note here.
     */
    hideSeedNote?: boolean
    /**
     * Lock the language picker to the current {@link language}, rendering a static chip
     * instead of the dropdown. Set by the learn submission sandbox, where the runtime
     * language is fixed by the author's `fileExtension` and the learner must not Run/submit
     * a mismatched language against the rubric. A SQL challenge is always locked regardless
     * (it stays on SQL); omit for the standalone catalog solver's free picker.
     */
    lockLanguage?: boolean
    /**
     * Submission mode. When set, the toolbar's PRIMARY button stops running the in-panel
     * practice grade and instead calls {@link onSubmit} — the formal challenge submission
     * (GRADE = SUBMIT: it consumes an attempt and is AI-graded server-side). The learn
     * challenge surface passes it so a single "Nộp & Chấm AI" replaces the old
     * grade-then-separately-submit two-step. Omit for the standalone catalog solver /
     * subject practice — those keep the inline synchronous practice grade unchanged.
     * The free "Run" button is always available (no attempt consumed) in either mode.
     */
    onSubmit?: () => void
    /** Label for the primary button in submission mode (pairs with {@link onSubmit}). */
    submitLabel?: string
    /** True while {@link onSubmit} is in flight — drives the primary button's spinner. */
    isSubmitting?: boolean
    /** Extra caller gating for the submit button (e.g. attempts exhausted / no challenge). */
    submitDisabled?: boolean
    /**
     * WHERE the submission's score comes from — the BE decides this by challenge type and the
     * two paths are mutually exclusive:
     *
     * - `"ai"` (default) — `CODE`/`ESSAY`: the LLM produces the score, so the picked model
     *   genuinely changes the grade.
     * - `"tests"` — `CODING`/`SQL`: hidden test cases produce the score and the model NEVER
     *   moves it; AI only reviews quality (is the query optimal, not just correct). Saying
     *   "each model grades differently" here would promise something the BE does not do.
     */
    scoreSource?: "ai" | "tests"
}

/**
 * The FE language picker — a safe subset of the Piston runtimes (source of truth) plus
 * `sql`. The BE does not hardcode languages; this list only shapes the picker.
 */
const CODE_LANGUAGES = [
    "python",
    "javascript",
    "typescript",
    "java",
    "cpp",
    "c",
    "go",
    "csharp",
    "php",
    "ruby",
    "sql",
] as const

/**
 * Languages Monaco can actually format on the client. Monaco ships a `formatDocument`
 * provider only for JS/TS/HTML/CSS/JSON out of the box — for every other picker language
 * (python, java, cpp, …, sql) the Format button would be a silent no-op, so it is hidden
 * there rather than shown enabled-but-dead.
 */
const FORMATTABLE_LANGUAGES = new Set(["javascript", "typescript"])

/** FE language key → Monaco language id (mostly identity; kept explicit for safety). */
const MONACO_LANGUAGE: Record<string, string> = {
    python: "python",
    javascript: "javascript",
    typescript: "typescript",
    java: "java",
    cpp: "cpp",
    c: "c",
    go: "go",
    csharp: "csharp",
    php: "php",
    ruby: "ruby",
    sql: "sql",
}

/** Small optional starter, seeded only when the editor is empty (never clobbers work). */
const STARTER_CODE: Record<string, string> = {
    python: 'print("Hello, world!")\n',
    javascript: 'console.log("Hello, world!")\n',
    typescript: 'console.log("Hello, world!")\n',
    java: "public class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Hello, world!\");\n    }\n}\n",
    cpp: "#include <iostream>\n\nint main() {\n    std::cout << \"Hello, world!\" << std::endl;\n    return 0;\n}\n",
    c: '#include <stdio.h>\n\nint main(void) {\n    printf("Hello, world!\\n");\n    return 0;\n}\n',
    go: 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, world!")\n}\n',
    csharp: "using System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine(\"Hello, world!\");\n    }\n}\n",
    php: '<?php\necho "Hello, world!\\n";\n',
    ruby: 'puts "Hello, world!"\n',
    sql: "SELECT 'Hello, world!' AS greeting;\n",
}

/** i18n error key for a failed grade/run call (`learn.codeGrading.errors.*`). */
const toErrorKey = (error: unknown): string => {
    if (error instanceof RestError) {
        if (error.status === 403) return "forbidden"
        switch (error.errorCode) {
        case "AI_EXEC_UNAVAILABLE":
            return "execUnavailable"
        case "AI_SQL_UNAVAILABLE":
            return "sqlUnavailable"
        case "AI_CODE_DOWN":
            return "down"
        case "AI_CODE_GRADING_FAILED":
            return "failed"
        case "AI_CODE_INVALID":
            return "invalid"
        case "AI_MODEL_NOT_ALLOWED":
            return "modelNotAllowed"
        default:
            break
        }
    }
    return "generic"
}

/**
 * In-browser code sandbox (spec §5): a Monaco editor + a language picker, a **Run**
 * button that executes the code (or SQL) in the isolated sandbox and shows its output
 * (`POST /ai/coding/execute-code` → stdout/stderr; `execute-sql` → a result grid), and a
 * **"Chấm bằng AI"** button that sends the code to the LLM grader
 * (`POST /ai/coding/grade-code`, `run_code_execution:false`) → {@link GradeResultCard}.
 * No objective test-case scoring — grading is AI-only. When the sandbox engine is
 * unconfigured BE-side the run 503s with `AI_EXEC_UNAVAILABLE` / `AI_SQL_UNAVAILABLE`
 * and the panel shows a graceful "engine tạm chưa khả dụng" message rather than crashing.
 *
 * Shared by both solve surfaces: the standalone `ChallengeView` (internal state) and the
 * learn-embedded `ChallengeSubmission` (controlled `code`/`language` lifted so the formal
 * "Nộp bài" posts the same source).
 */
export const GradeCodePanel = ({
    challenge,
    className,
    code: controlledCode,
    language: controlledLanguage,
    onCodeChange,
    onLanguageChange,
    model: controlledModel,
    onModelChange,
    setupSql,
    hideSeedNote = false,
    lockLanguage = false,
    onSubmit,
    submitLabel,
    isSubmitting = false,
    submitDisabled = false,
    scoreSource = "ai",
}: GradeCodePanelProps) => {
    const t = useTranslations("learn")
    // Submission mode (GRADE = SUBMIT): the primary button posts the formal submission
    // instead of running the in-panel practice grade. Keys off the callback presence.
    const submitMode = typeof onSubmit === "function"
    const isSqlChallenge = challenge.type === "sql"
    // Render the static locked chip (not the picker) when the language is fixed: a SQL
    // challenge is always SQL, and the learn sandbox locks any exercise to its author
    // `fileExtension` runtime so a learner can't Run/submit a mismatched language.
    const isLanguageLocked = isSqlChallenge || lockLanguage

    // Controlled/uncontrolled: a caller that owns the code (the learn challenge surface,
    // so its formal submission posts exactly this source) passes code + onCodeChange; the
    // standalone catalog solver omits both and the panel keeps its own state.
    const [internalCode, setInternalCode] = useState("")
    const [internalLanguage, setInternalLanguage] = useState<string>(isSqlChallenge ? "sql" : "python")
    const code = controlledCode ?? internalCode
    const setCode = onCodeChange ?? setInternalCode
    const language = controlledLanguage ?? internalLanguage
    const setLanguage = onLanguageChange ?? setInternalLanguage

    // Controlled/uncontrolled model — a caller that threads the picked model into its own
    // formal submission (the learn sandbox) passes model + onModelChange; the standalone
    // catalog solver omits both and the panel keeps its own state. `null` is a valid value
    // (the BE default), so controlled-ness keys off onModelChange, not a nullish model.
    const [internalModel, setInternalModel] = useState<string | null>(null)
    const model = onModelChange ? (controlledModel ?? null) : internalModel
    const setModel = onModelChange ?? setInternalModel
    const [errorKey, setErrorKey] = useState<string | null>(null)
    /** Re-run target for the error card's retry button. */
    const [lastAction, setLastAction] = useState<"run" | "grade" | "test" | null>(null)

    const [runResult, setRunResult] = useState<CodeExecuteResult | null>(null)
    const [sqlResult, setSqlResult] = useState<SqlRunResult | null>(null)
    const [gradeResult, setGradeResult] = useState<CodeGradeResult | null>(null)
    /** Per-case results of the last SAMPLE "Chạy test" run (no LLM). */
    const [testResult, setTestResult] = useState<CodeExecutionSummary | null>(null)

    // The learner-visible SAMPLE (non-hidden) test cases — drive the "Chạy test" action.
    // HIDDEN cases are never in this view (they stay server-side for AI grading).
    const sampleTestCases = challenge.sampleTestCases ?? []
    const hasSampleTests = sampleTestCases.length > 0

    // Prefill/dirty tracking for the starter code. `autofilledRef` holds the exact source we
    // last auto-filled (a starter template); `dirtyRef` flips true the moment the learner
    // edits the editor to anything else. While untouched (empty / still the auto-filled
    // starter) the panel may seed on mount and swap on a language change; once dirty it NEVER
    // overwrites the learner's own code. Seeded from the initial code so a remount that
    // already carries lifted learner code (e.g. re-selecting the sandbox tab) is treated as
    // touched — it is never re-seeded / clobbered.
    const dirtyRef = useRef(code.trim() !== "")
    const autofilledRef = useRef<string | null>(null)

    const [editorReady, setEditorReady] = useState(false)
    // Collapsible terminal — open by default, re-opened on every Run/submit so output is
    // never hidden behind a stale collapse. The learner can fold it away to reclaim height.
    const [resultOpen, setResultOpen] = useState(true)
    const editorRef = useRef<GradeCodeEditorHandle>(null)

    const modelsSwr = useGetAiCatalogModelsSwr()
    const { trigger: triggerGrade, isMutating: isGrading } = usePostGradeCodeSwr()
    const { trigger: triggerExecute, isMutating: isRunningCode } = usePostExecuteCodeSwr()
    const { trigger: triggerExecuteSql, isMutating: isRunningSql } = usePostExecuteSqlSwr()
    const { trigger: triggerRunTests, isMutating: isRunningTests } = usePostRunTestsSwr()
    const isBusy = isGrading || isRunningCode || isRunningSql || isRunningTests

    const isSqlLanguage = language === "sql"
    // A non-empty seed dataset threads into the SQL Run as `setup_sql` (seeded fresh,
    // rolled back after the query) and is shown to the learner as the schema to query.
    const hasSeed = isSqlLanguage && typeof setupSql === "string" && setupSql.trim() !== ""
    // Monaco only formats JS/TS client-side — hide Format for the other picker
    // languages so it is never an enabled-but-dead control.
    const canFormat = FORMATTABLE_LANGUAGES.has(language)

    const exerciseQuestion = [challenge.title, challenge.description]
        .filter(Boolean)
        .join("\n\n")

    // The starter source for a language: the challenge's learner-safe `starterCode` takes
    // precedence over the generic hello-world template; "" when neither exists. The generic
    // fallback is skipped for SQL — a hello-world `SELECT 'Hello, world!'` is unrelated to the
    // seeded dataset the learner queries (and SQL locks the language, so it would only ever
    // be a confusing prefill); a challenge-authored `starterCode.sql` still prefills.
    const starterForLanguage = useCallback(
        (lang: string): string =>
            challenge.starterCode?.[lang] ?? (lang === "sql" ? "" : STARTER_CODE[lang] ?? ""),
        [challenge.starterCode],
    )

    // Prefill the INITIAL empty editor with the selected language's starter (challenge
    // `starterCode` first, generic template fallback). Guarded on an empty editor + a
    // clean dirty flag, so a restored draft / learner code is never replaced; a language
    // switch is handled synchronously in onPickLanguage below. Re-runs cheaply on edits
    // but returns immediately once `code` is non-empty / the learner has typed.
    useEffect(() => {
        if (dirtyRef.current || code.trim() !== "") return
        const starter = starterForLanguage(language)
        if (starter === "") return
        autofilledRef.current = starter
        setCode(starter)
    }, [code, language, starterForLanguage, setCode])

    // Editor edits route through here so the dirty flag flips the moment the learner types
    // anything other than the auto-filled starter. Programmatic writes (prefill / language
    // swap) call setCode directly and never mark dirty.
    const handleEditorChange = (next: string) => {
        if (next !== autofilledRef.current) {
            dirtyRef.current = true
        }
        setCode(next)
    }

    const onPickLanguage = (next: string) => {
        setLanguage(next)
        // Swap the starter only while the editor is untouched (empty / still the auto-filled
        // starter) — never once the learner has written real code (dirty). A language with no
        // starter clears back to empty so the previous language's starter doesn't linger.
        if (!dirtyRef.current) {
            const starter = starterForLanguage(next)
            autofilledRef.current = starter === "" ? null : starter
            setCode(starter)
        }
    }

    // The result pane holds exactly ONE output at a time — a fresh Run/SQL/test/grade
    // replaces the previous one so a stale table never lingers beside a newer result
    // (e.g. yesterday's sample-test grid next to today's AI grade). Each handler calls
    // this before setting its own result.
    const clearResults = () => {
        setRunResult(null)
        setSqlResult(null)
        setTestResult(null)
        setGradeResult(null)
    }

    const onRun = async () => {
        if (code.trim() === "" || isBusy) return
        setResultOpen(true)
        setErrorKey(null)
        setLastAction("run")
        try {
            if (isSqlLanguage) {
                // Thread the challenge seed dataset so the query runs against the seeded
                // tables (fresh per run, rolled back after). Undefined → self-contained.
                const result = await triggerExecuteSql({ query: code, setup_sql: setupSql })
                clearResults()
                setSqlResult(result ?? null)
            } else {
                const result = await triggerExecute({ code, language })
                clearResults()
                setRunResult(result ?? null)
            }
        } catch (error) {
            setErrorKey(toErrorKey(error))
        }
    }

    const onRunTests = async () => {
        if (code.trim() === "" || isBusy || !hasSampleTests) return
        setResultOpen(true)
        setErrorKey(null)
        setLastAction("test")
        try {
            // Only the learner-visible SAMPLE cases are sent (input/expected) — HIDDEN cases
            // stay server-side for AI grading and are never in this view.
            const result = await triggerRunTests({
                code,
                language,
                testCases: sampleTestCases.map((testCase) => ({
                    input: testCase.input,
                    expected: testCase.expected,
                })),
                // SQL runs each case against the challenge's seed dataset (fresh + rolled back
                // per case), exactly like the plain Run threads `setup_sql`. Without it the
                // query hits an empty database and every case fails.
                ...(isSqlLanguage && setupSql ? { setupSql } : {}),
            })
            clearResults()
            setTestResult(result ?? null)
        } catch (error) {
            setErrorKey(toErrorKey(error))
        }
    }

    const onGrade = async () => {
        if (code.trim() === "" || isBusy) return
        // Re-open the (collapsible) terminal so a fresh grade is never hidden behind a
        // stale manual collapse — mirrors onRun / the submit button. In the standalone
        // ChallengeView this is the PRIMARY action, so a folded pane would look inert.
        setResultOpen(true)
        setErrorKey(null)
        setLastAction("grade")
        try {
            const result = await triggerGrade({
                exercise_question: exerciseQuestion,
                code,
                language,
                // AI reads the code to grade — no objective test-case execution (spec §5).
                run_code_execution: false,
                ...(model ? { model } : {}),
            })
            clearResults()
            setGradeResult(result ?? null)
        } catch (error) {
            const key = toErrorKey(error)
            setErrorKey(key)
            // Model rejected by the BE allowlist → fall back to the default model.
            if (key === "modelNotAllowed") setModel(null)
        }
    }

    const retryLast = () => {
        if (lastAction === "grade") void onGrade()
        else if (lastAction === "test") void onRunTests()
        else void onRun()
    }

    const gradingModelLabel = model
        ?? modelsSwr.data?.defaults?.chat
        ?? t("codeGrading.defaultModel")

    const languageLabel = t(`codeGrading.languages.${language}`)

    // Whether the result pane already carries something (a run/SQL/test/grade result). Drives
    // the pane's empty placeholder vs. the actual output.
    const hasAnyResult = Boolean(sqlResult || runResult || testResult || gradeResult)
    const showResultEmpty = !isBusy && !isSubmitting && errorKey === null && !hasAnyResult

    // The editor still holds EXACTLY the seeded starter template (the learner hasn't written
    // anything of their own). Formal submission consumes a limited attempt, so it must not fire
    // on the raw template — `code === ""` is already gated elsewhere; this covers the
    // non-empty-but-untouched starter. Reactive via `code`; `autofilledRef` holds the last
    // auto-filled starter and is cleared to null once the learner edits away from it.
    const isUntouchedStarter =
        autofilledRef.current !== null && code === autofilledRef.current

    return (
        <div className={cn("flex flex-col gap-3", className)}>
            {/* TOP TOOLBAR (IDE): left = language (locked chip | picker) + Format;
                right = model picker + Chấm bằng AI + Run — all above the editor. */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    {isLanguageLocked ? (
                        // The language is fixed (a SQL challenge, or a sandbox locked to the
                        // author's `fileExtension` runtime) — a learner must not switch it and
                        // Run/submit a mismatched language. Render a static locked chip instead
                        // of the picker, with the reason in its label/tooltip.
                        <div
                            className="flex items-center gap-2 rounded-2xl border border-default px-3 py-2"
                            aria-label={t(isSqlChallenge ? "codeGrading.sqlLockedHint" : "codeGrading.languageLockedHint")}
                            title={t(isSqlChallenge ? "codeGrading.sqlLockedHint" : "codeGrading.languageLockedHint")}
                        >
                            <LockSimpleIcon
                                aria-hidden
                                focusable="false"
                                className="size-4 text-muted"
                            />
                            <span className="text-sm font-medium">{languageLabel}</span>
                        </div>
                    ) : (
                        <Dropdown>
                            <DropdownTrigger
                                isDisabled={isBusy}
                                className="cursor-pointer rounded-2xl border border-default px-3 py-2"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">{languageLabel}</span>
                                    <CaretDownIcon aria-hidden focusable="false" className="size-4" />
                                </div>
                            </DropdownTrigger>
                            <DropdownPopover>
                                <DropdownMenu
                                    aria-label={t("codeGrading.pickLanguage")}
                                    onAction={(key) => onPickLanguage(String(key))}
                                >
                                    {CODE_LANGUAGES.map((lang) => (
                                        <DropdownItem
                                            key={lang}
                                            id={lang}
                                            textValue={t(`codeGrading.languages.${lang}`)}
                                        >
                                            {t(`codeGrading.languages.${lang}`)}
                                        </DropdownItem>
                                    ))}
                                </DropdownMenu>
                            </DropdownPopover>
                        </Dropdown>
                    )}
                    {canFormat ? (
                        <Button
                            size="sm"
                            variant="ghost"
                            isDisabled={!editorReady || isBusy}
                            onPress={() => editorRef.current?.format()}
                        >
                            <MagicWandIcon aria-hidden focusable="false" className="size-4" />
                            {t("codeGrading.format")}
                        </Button>
                    ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <AiModelPicker
                        catalog={modelsSwr.data}
                        value={model}
                        onChange={setModel}
                        isDisabled={isBusy}
                    />
                    {!hasSampleTests ? (
                        // Plain "Run" (no stdin) is only meaningful for exercises WITHOUT test
                        // cases — SQL (runs the query on the seeded dataset) or free code. An
                        // algorithm challenge reads its input from stdin (the test case), so a
                        // bare Run gets no input and errors; "Run tests" is the real run there.
                        <Button
                            variant="secondary"
                            isPending={isRunningCode || isRunningSql}
                            isDisabled={code.trim() === "" || isBusy}
                            onPress={() => { void onRun() }}
                        >
                            <PlayIcon aria-hidden focusable="false" className="size-5" />
                            {t("codeGrading.run")}
                        </Button>
                    ) : null}
                    {hasSampleTests ? (
                        // Runs the code against the SAMPLE (non-hidden) test cases in the
                        // sandbox — objective per-case pass/fail, no attempt consumed, no LLM.
                        <Button
                            variant="secondary"
                            isPending={isRunningTests}
                            isDisabled={code.trim() === "" || isBusy}
                            onPress={() => { void onRunTests() }}
                        >
                            <ListChecksIcon aria-hidden focusable="false" className="size-5" />
                            {t("codeGrading.runTests")}
                        </Button>
                    ) : null}
                    {submitMode ? (
                        // GRADE = SUBMIT: the primary action posts the formal submission
                        // (consumes an attempt, AI-graded server-side) rather than the
                        // in-panel practice grade. Free "Run" above stays as a no-attempt test.
                        <Button
                            variant="primary"
                            isPending={isSubmitting}
                            isDisabled={
                                code.trim() === "" || isUntouchedStarter || isBusy || isSubmitting || submitDisabled
                            }
                            onPress={() => {
                                // The formal verdict lands in the attempts list — clear any
                                // stale run/test/grade output so a pre-edit table doesn't
                                // linger beside the submit spinner.
                                clearResults()
                                setErrorKey(null)
                                setResultOpen(true)
                                onSubmit?.()
                            }}
                        >
                            <SparkleIcon aria-hidden focusable="false" className="size-5" />
                            {submitLabel ?? t("codeGrading.gradeWithAi")}
                        </Button>
                    ) : (
                        <Button
                            variant="primary"
                            isPending={isGrading}
                            isDisabled={code.trim() === "" || isBusy}
                            onPress={() => { void onGrade() }}
                        >
                            <SparkleIcon aria-hidden focusable="false" className="size-5" />
                            {gradeResult ? t("codeGrading.regrade") : t("codeGrading.gradeWithAi")}
                        </Button>
                    )}
                </div>
            </div>

            {/* Model hint. On a test-case-graded exercise the model does NOT move the score
                (hidden tests do) — it only shapes the quality review, so the generic
                "each model grades differently" line would be a false promise. */}
            <Typography type="body-xs" color="muted">
                {t(scoreSource === "tests" ? "codeGrading.modelHintReview" : "codeGrading.modelHint")}
            </Typography>

            {/* EDITOR (Monaco). */}
            <div className="rounded-3xl border border-default bg-surface p-3 focus-within:border-accent">
                <GradeCodeEditor
                    ref={editorRef}
                    value={code}
                    onChange={handleEditorChange}
                    language={MONACO_LANGUAGE[language] ?? language}
                    disabled={isBusy}
                    onReadyChange={setEditorReady}
                />
            </div>

            {/* OUTPUT / RESULT pane (terminal / SSMS results): a collapsible titled box docked
                DIRECTLY below the editor, own scroll + min-height, holding progress / error /
                the run or grade output. Auto-opens on Run/submit; foldable to reclaim height. */}
            <div className="flex flex-col gap-2 rounded-3xl border border-default bg-default/40 p-3">
                <button
                    type="button"
                    onClick={() => setResultOpen((open) => !open)}
                    aria-expanded={resultOpen}
                    className="flex cursor-pointer items-center justify-between gap-2 text-left"
                >
                    <Typography type="body-xs" weight="medium" color="muted">
                        {t("codeGrading.resultPaneTitle")}
                    </Typography>
                    <CaretDownIcon
                        aria-hidden
                        focusable="false"
                        className={cn(
                            "size-4 text-muted transition-transform",
                            resultOpen ? "" : "-rotate-90",
                        )}
                    />
                </button>
                {resultOpen ? (
                    <div className="max-h-96 min-h-40 overflow-auto rounded-2xl border border-default bg-surface p-3">
                        {/* progress (sandbox run / sync 10–60s practice grade) */}
                        {isBusy ? (
                            <div className="flex items-center gap-2">
                                <Spinner size="sm" />
                                <Typography type="body-sm" color="muted">
                                    {isRunningSql
                                        ? t("codeGrading.runningSql")
                                        : isRunningCode
                                            ? t("codeGrading.running")
                                            : isRunningTests
                                                ? t("codeGrading.runningTests")
                                                : t("codeGrading.gradingWith", { model: gradingModelLabel })}
                                </Typography>
                            </div>
                        ) : null}

                        {/* submission in flight (GRADE = SUBMIT): the AI verdict lands in the
                            attempts list, so the terminal shows a submitting indicator here. */}
                        {isSubmitting ? (
                            <div className="flex items-center gap-2">
                                <Spinner size="sm" />
                                <Typography type="body-sm" color="muted">
                                    {t("codeGrading.submittingGrade")}
                                </Typography>
                            </div>
                        ) : null}

                        {/* error state — the drafted code stays untouched */}
                        {errorKey !== null ? (
                            <div className="flex flex-col gap-2 rounded-2xl border border-danger/40 bg-danger/5 p-4">
                                <Typography type="body-sm" className="text-danger">
                                    {t(`codeGrading.errors.${errorKey}`)}
                                </Typography>
                                {errorKey !== "forbidden" ? (
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        className="w-fit"
                                        onPress={retryLast}
                                    >
                                        {t("codeGrading.retry")}
                                    </Button>
                                ) : null}
                            </div>
                        ) : null}

                        {/* sandbox run output: SQL grid, code stdout/stderr, or per-case tests */}
                        {sqlResult ? <SqlResultTable result={sqlResult} /> : null}
                        {runResult ? <RunOutputPanel result={runResult} /> : null}
                        {testResult ? <ExecutionResultTable summary={testResult} /> : null}

                        {/* LLM grade (model-dependent) */}
                        {gradeResult ? (
                            <div className="flex flex-col gap-2">
                                <GradeResultCard result={gradeResult} />
                                <Typography type="body-xs" color="muted">
                                    {t("codeGrading.regradeHint")}
                                </Typography>
                            </div>
                        ) : null}

                        {/* nothing run yet — the pane keeps its shape with a hint */}
                        {showResultEmpty ? (
                            <Typography type="body-sm" color="muted">
                                {t("codeGrading.resultPaneEmpty")}
                            </Typography>
                        ) : null}
                    </div>
                ) : null}
            </div>

            {/* SQL sandbox scope note — below the terminal, a contextual reference to the
                dataset the query runs against. On the submission surface the schema/ERD lives
                in the problem column (hideSeedNote), so this raw seed / scalar note is
                suppressed there and kept only for the standalone solver. */}
            {isSqlLanguage && !hideSeedNote ? (
                hasSeed ? (
                    <div className="flex flex-col gap-2 rounded-2xl border border-default bg-default/40 p-3">
                        <Typography type="body-xs" weight="medium">
                            {t("codeGrading.sqlSeedTitle")}
                        </Typography>
                        <Typography type="body-xs" color="muted">
                            {t("codeGrading.sqlSeedNote")}
                        </Typography>
                        <pre className="max-h-48 overflow-auto rounded-xl border border-default bg-surface p-3 text-xs">
                            <code>{setupSql}</code>
                        </pre>
                    </div>
                ) : (
                    <Typography type="body-xs" color="muted">
                        {t("codeGrading.sqlScalarNote")}
                    </Typography>
                )
            ) : null}
        </div>
    )
}
