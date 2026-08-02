"use client"

import React, { useRef, useState } from "react"
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
} from "@/hooks/swr/api/rest/mutations"
import { RestError } from "@/modules/api/rest/client"
import type { CodeExecuteResult, CodeGradeResult, SqlRunResult } from "@/modules/api/rest/ai"
import type { ChallengeDetail } from "../../hooks/useQueryChallengeSwr"
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
     * SQL seed dataset (the challenge's `seedSql`, VISIBLE to the learner). When set on
     * a SQL exercise it is threaded into the sandbox Run path as `setup_sql` — seeded
     * fresh, run in the same rolled-back transaction as the query — and shown to the
     * learner so they know the schema/data to query. Omit for a self-contained SQL
     * scratchpad (the panel keeps its "scalar-only" note).
     */
    setupSql?: string
    /**
     * Lock the language picker to the current {@link language}, rendering a static chip
     * instead of the dropdown. Set by the learn submission sandbox, where the runtime
     * language is fixed by the author's `fileExtension` and the learner must not Run/submit
     * a mismatched language against the rubric. A SQL challenge is always locked regardless
     * (it stays on SQL); omit for the standalone catalog solver's free picker.
     */
    lockLanguage?: boolean
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
    setupSql,
    lockLanguage = false,
}: GradeCodePanelProps) => {
    const t = useTranslations("learn")
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

    const [model, setModel] = useState<string | null>(null)
    const [errorKey, setErrorKey] = useState<string | null>(null)
    /** Re-run target for the error card's retry button. */
    const [lastAction, setLastAction] = useState<"run" | "grade" | null>(null)

    const [runResult, setRunResult] = useState<CodeExecuteResult | null>(null)
    const [sqlResult, setSqlResult] = useState<SqlRunResult | null>(null)
    const [gradeResult, setGradeResult] = useState<CodeGradeResult | null>(null)

    const [editorReady, setEditorReady] = useState(false)
    const editorRef = useRef<GradeCodeEditorHandle>(null)

    const modelsSwr = useGetAiCatalogModelsSwr()
    const { trigger: triggerGrade, isMutating: isGrading } = usePostGradeCodeSwr()
    const { trigger: triggerExecute, isMutating: isRunningCode } = usePostExecuteCodeSwr()
    const { trigger: triggerExecuteSql, isMutating: isRunningSql } = usePostExecuteSqlSwr()
    const isBusy = isGrading || isRunningCode || isRunningSql

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

    const onPickLanguage = (next: string) => {
        setLanguage(next)
        // Seed a starter template only when the editor is empty — never clobber real work.
        if (code.trim() === "") {
            const starter = STARTER_CODE[next]
            if (starter) setCode(starter)
        }
    }

    const onRun = async () => {
        if (code.trim() === "" || isBusy) return
        setErrorKey(null)
        setLastAction("run")
        try {
            if (isSqlLanguage) {
                // Thread the challenge seed dataset so the query runs against the seeded
                // tables (fresh per run, rolled back after). Undefined → self-contained.
                const result = await triggerExecuteSql({ query: code, setup_sql: setupSql })
                setSqlResult(result ?? null)
                setRunResult(null)
            } else {
                const result = await triggerExecute({ code, language })
                setRunResult(result ?? null)
                setSqlResult(null)
            }
        } catch (error) {
            setErrorKey(toErrorKey(error))
        }
    }

    const onGrade = async () => {
        if (code.trim() === "" || isBusy) return
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
        else void onRun()
    }

    const gradingModelLabel = model
        ?? modelsSwr.data?.defaults?.chat
        ?? t("codeGrading.defaultModel")

    const languageLabel = t(`codeGrading.languages.${language}`)

    return (
        <div className={cn("flex flex-col gap-4", className)}>
            {/* editor box: language picker + format toolbar, then the Monaco surface */}
            <div className="flex flex-col gap-3 rounded-3xl border border-default bg-surface p-4 focus-within:border-accent">
                <div className="flex flex-wrap items-center justify-between gap-2">
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
                <GradeCodeEditor
                    ref={editorRef}
                    value={code}
                    onChange={setCode}
                    language={MONACO_LANGUAGE[language] ?? language}
                    disabled={isBusy}
                    onReadyChange={setEditorReady}
                />
            </div>

            {/* SQL sandbox scope note. With a challenge seed dataset the query runs
                against seeded tables (shown below so the learner knows the schema);
                without one the runner is an empty sandbox → self-contained queries only. */}
            {isSqlLanguage ? (
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

            {/* model picker + hint */}
            <div className="flex flex-wrap items-center gap-2">
                <AiModelPicker
                    catalog={modelsSwr.data}
                    value={model}
                    onChange={setModel}
                    isDisabled={isBusy}
                />
                <Typography type="body-xs" color="muted" className="min-w-0 flex-1">
                    {t("codeGrading.modelHint")}
                </Typography>
            </div>

            {/* actions: Run (sandbox) + Chấm bằng AI (LLM) */}
            <div className="flex flex-wrap items-center gap-2">
                <Button
                    variant="primary"
                    isPending={isGrading}
                    isDisabled={code.trim() === "" || isBusy}
                    onPress={() => { void onGrade() }}
                >
                    <SparkleIcon aria-hidden focusable="false" className="size-5" />
                    {gradeResult ? t("codeGrading.regrade") : t("codeGrading.gradeWithAi")}
                </Button>
                <Button
                    variant="secondary"
                    isPending={isRunningCode || isRunningSql}
                    isDisabled={code.trim() === "" || isBusy}
                    onPress={() => { void onRun() }}
                >
                    <PlayIcon aria-hidden focusable="false" className="size-5" />
                    {t("codeGrading.run")}
                </Button>
            </div>

            {/* progress (sandbox run / sync 10–60s grade) */}
            {isBusy ? (
                <div className="flex items-center gap-2">
                    <Spinner size="sm" />
                    <Typography type="body-sm" color="muted">
                        {isRunningSql
                            ? t("codeGrading.runningSql")
                            : isRunningCode
                                ? t("codeGrading.running")
                                : t("codeGrading.gradingWith", { model: gradingModelLabel })}
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

            {/* sandbox run output: SQL grid or code stdout/stderr */}
            {sqlResult ? <SqlResultTable result={sqlResult} /> : null}
            {runResult ? <RunOutputPanel result={runResult} /> : null}

            {/* LLM grade (model-dependent) */}
            {gradeResult ? (
                <>
                    <GradeResultCard result={gradeResult} />
                    <Typography type="body-xs" color="muted">
                        {t("codeGrading.regradeHint")}
                    </Typography>
                </>
            ) : null}
        </div>
    )
}
