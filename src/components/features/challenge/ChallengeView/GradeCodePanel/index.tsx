"use client"

import React, { useEffect, useRef, useState } from "react"
import {
    Button,
    Chip,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownPopover,
    DropdownTrigger,
    Input,
    Spinner,
    TextField,
    Typography,
    cn,
} from "@heroui/react"
import {
    CaretDownIcon,
    PlayIcon,
    PlusIcon,
    SparkleIcon,
    TrashIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { AiModelPicker } from "@/components/reuseable/AiModelPicker"
import { useGetAiCatalogModelsSwr } from "@/hooks/swr/api/rest/queries"
import { usePostExecuteCodeSwr, usePostGradeCodeSwr } from "@/hooks/swr/api/rest/mutations"
import { RestError } from "@/modules/api/rest/client"
import type { CodeExecutionSummary, CodeGradeResult, CodeGradeTestCase } from "@/modules/api/rest/ai"
import type { ChallengeDetail } from "../../hooks/useQueryChallengeSwr"
import { ExecutionResultTable } from "./ExecutionResultTable"
import { GradeResultCard } from "./GradeResultCard"

/** Props for {@link GradeCodePanel}. */
export interface GradeCodePanelProps {
    /** The challenge being solved (prefills the exercise question). */
    challenge: ChallengeDetail
    /** Extra classes. */
    className?: string
}

/** Languages Judge0 executes (proposal scope); SQL is static-only. */
const EXECUTABLE_LANGUAGES = ["python", "java", "cpp", "c"] as const

/** One editable test-case row. */
interface TestCaseRow {
    input: string
    output: string
}

/** i18n error key for a failed grade/execute call (`learn.codeGrading.errors.*`). */
const toErrorKey = (error: unknown): string => {
    if (error instanceof RestError) {
        if (error.status === 403) return "forbidden"
        switch (error.errorCode) {
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
 * AI code-grading panel (§ai-code-grading): a code editor + test-case rows +
 * model picker wired to the real BE — "Chạy thử" hits
 * `POST /api/v1/ai/coding/execute-code` (Judge0 only, no LLM quota) and
 * "Chấm bằng AI" hits `POST /api/v1/ai/coding/grade-code` (sync 10–60s, with a
 * two-phase progress label). Execution results are objective and kept across
 * re-grades of unchanged code (`run_code_execution:false` saves a Judge0 run);
 * the LLM grade always shows the model that produced it. SQL grades
 * static-only (no execution).
 */
export const GradeCodePanel = ({ challenge, className }: GradeCodePanelProps) => {
    const t = useTranslations("learn")
    const isSql = challenge.type === "sql"

    const [code, setCode] = useState("")
    const [language, setLanguage] = useState<string>(isSql ? "sql" : "python")
    const [testCases, setTestCases] = useState<Array<TestCaseRow>>([{ input: "", output: "" }])
    const [model, setModel] = useState<string | null>(null)
    const [errorKey, setErrorKey] = useState<string | null>(null)
    /** 2-phase progress label while a grade is in flight. */
    const [phase, setPhase] = useState<"tests" | "grading" | null>(null)
    const phaseTimerRef = useRef<number | null>(null)

    /** Last Judge0 execution + the code it ran (objective — reused across re-grades). */
    const [lastExecution, setLastExecution] = useState<CodeExecutionSummary | null>(null)
    const [lastExecutedCode, setLastExecutedCode] = useState<string | null>(null)
    const [gradeResult, setGradeResult] = useState<CodeGradeResult | null>(null)

    const modelsSwr = useGetAiCatalogModelsSwr()
    const { trigger: triggerGrade, isMutating: isGrading } = usePostGradeCodeSwr()
    const { trigger: triggerExecute, isMutating: isExecuting } = usePostExecuteCodeSwr()
    const isBusy = isGrading || isExecuting

    useEffect(() => () => {
        if (phaseTimerRef.current !== null) window.clearTimeout(phaseTimerRef.current)
    }, [])

    /** Test cases with an expected output — the only ones Judge0 can verify. */
    const validCases: Array<CodeGradeTestCase> = testCases
        .filter((row) => row.output.trim() !== "")
        .map((row) => ({ input: row.input, output: row.output }))

    const exerciseQuestion = [challenge.title, challenge.description]
        .filter(Boolean)
        .join("\n\n")

    const setCase = (index: number, patch: Partial<TestCaseRow>) => {
        setTestCases((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)))
    }

    const onExecute = async () => {
        if (code.trim() === "" || validCases.length === 0 || isBusy) return
        setErrorKey(null)
        setPhase("tests")
        try {
            const result = await triggerExecute({
                code,
                language,
                test_cases: validCases,
            })
            setLastExecution(result?.execution ?? null)
            setLastExecutedCode(code)
        } catch (error) {
            setErrorKey(toErrorKey(error))
        } finally {
            setPhase(null)
        }
    }

    const onGrade = async () => {
        if (code.trim() === "" || isBusy) return
        setErrorKey(null)

        // Execution is model-independent → skip Judge0 when re-grading unchanged code.
        const canReuseExecution = !isSql && lastExecution !== null && lastExecutedCode === code
        const runExecution = !isSql && !canReuseExecution && validCases.length > 0

        setPhase(runExecution ? "tests" : "grading")
        if (runExecution) {
            // Judge0 finishes first BE-side; flip the label to the LLM phase after a beat.
            phaseTimerRef.current = window.setTimeout(() => setPhase("grading"), 12_000)
        }

        try {
            const result = await triggerGrade({
                exercise_question: exerciseQuestion,
                code,
                language,
                ...(runExecution ? { test_cases: validCases } : {}),
                run_code_execution: runExecution,
                ...(model ? { model } : {}),
            })
            setGradeResult(result ?? null)
            if (runExecution) {
                setLastExecution(result?.execution ?? null)
                setLastExecutedCode(code)
            }
        } catch (error) {
            const key = toErrorKey(error)
            setErrorKey(key)
            // Model rejected by the BE allowlist → fall back to the default model.
            if (key === "modelNotAllowed") setModel(null)
        } finally {
            if (phaseTimerRef.current !== null) {
                window.clearTimeout(phaseTimerRef.current)
                phaseTimerRef.current = null
            }
            setPhase(null)
        }
    }

    const gradingModelLabel = model
        ?? modelsSwr.data?.defaults?.chat
        ?? t("codeGrading.defaultModel")

    return (
        <div className={cn("flex flex-col gap-4", className)}>
            {/* editor box: language row + flat code textarea */}
            <div className="flex flex-col gap-2 rounded-3xl border border-default bg-surface p-4 focus-within:border-accent">
                <div className="flex items-center justify-between gap-2">
                    <Typography type="body-sm" weight="semibold">
                        {t("codeGrading.yourCode")}
                    </Typography>
                    {isSql ? (
                        <Chip size="sm" variant="soft">
                            SQL
                        </Chip>
                    ) : (
                        <Dropdown>
                            <DropdownTrigger
                                isDisabled={isBusy}
                                className="cursor-pointer rounded-2xl border border-default px-3 py-1.5"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">
                                        {t(`codeGrading.languages.${language}`)}
                                    </span>
                                    <CaretDownIcon aria-hidden focusable="false" className="size-4" />
                                </div>
                            </DropdownTrigger>
                            <DropdownPopover>
                                <DropdownMenu aria-label={t("codeGrading.pickLanguage")}>
                                    {EXECUTABLE_LANGUAGES.map((lang) => (
                                        <DropdownItem
                                            key={lang}
                                            textValue={t(`codeGrading.languages.${lang}`)}
                                            onPress={() => setLanguage(lang)}
                                        >
                                            {t(`codeGrading.languages.${lang}`)}
                                        </DropdownItem>
                                    ))}
                                </DropdownMenu>
                            </DropdownPopover>
                        </Dropdown>
                    )}
                </div>
                <textarea
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    placeholder={t("codeGrading.codePlaceholder")}
                    aria-label={t("codeGrading.yourCode")}
                    spellCheck={false}
                    disabled={isBusy}
                    className="min-h-64 w-full resize-y bg-transparent font-mono text-sm text-foreground outline-none placeholder:text-muted"
                />
            </div>

            {/* test cases (executable languages) / static-only note (SQL) */}
            {isSql ? (
                <Typography type="body-xs" color="muted">
                    {t("codeGrading.sqlStaticOnly")}
                </Typography>
            ) : (
                <div className="flex flex-col gap-2">
                    <Typography type="body-sm" weight="semibold">
                        {t("codeGrading.testCases")}
                    </Typography>
                    <Typography type="body-xs" color="muted">
                        {t("codeGrading.testCasesHint")}
                    </Typography>
                    {testCases.map((row, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <TextField variant="secondary" className="min-w-0 flex-1" isDisabled={isBusy}>
                                <Input
                                    value={row.input}
                                    onChange={(event) => setCase(index, { input: event.target.value })}
                                    placeholder={t("codeGrading.inputPlaceholder")}
                                    aria-label={t("codeGrading.columns.input")}
                                    className="font-mono"
                                />
                            </TextField>
                            <TextField variant="secondary" className="min-w-0 flex-1" isDisabled={isBusy}>
                                <Input
                                    value={row.output}
                                    onChange={(event) => setCase(index, { output: event.target.value })}
                                    placeholder={t("codeGrading.outputPlaceholder")}
                                    aria-label={t("codeGrading.columns.expected")}
                                    className="font-mono"
                                />
                            </TextField>
                            <Button
                                size="sm"
                                variant="tertiary"
                                isIconOnly
                                aria-label={t("codeGrading.removeCase")}
                                isDisabled={isBusy || testCases.length <= 1}
                                onPress={() => setTestCases((rows) => rows.filter((_, i) => i !== index))}
                            >
                                <TrashIcon aria-hidden focusable="false" className="size-4" />
                            </Button>
                        </div>
                    ))}
                    <Button
                        size="sm"
                        variant="secondary"
                        className="w-fit"
                        isDisabled={isBusy}
                        onPress={() => setTestCases((rows) => [...rows, { input: "", output: "" }])}
                    >
                        <PlusIcon aria-hidden focusable="false" className="size-4" />
                        {t("codeGrading.addCase")}
                    </Button>
                </div>
            )}

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

            {/* actions */}
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
                {!isSql ? (
                    <Button
                        variant="secondary"
                        isPending={isExecuting}
                        isDisabled={code.trim() === "" || validCases.length === 0 || isBusy}
                        onPress={() => { void onExecute() }}
                    >
                        <PlayIcon aria-hidden focusable="false" className="size-5" />
                        {t("codeGrading.runOnly")}
                    </Button>
                ) : null}
            </div>

            {/* progress (sync 10–60s) */}
            {phase !== null ? (
                <div className="flex items-center gap-2">
                    <Spinner size="sm" />
                    <Typography type="body-sm" color="muted">
                        {phase === "tests"
                            ? t("codeGrading.runningTests")
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
                            onPress={() => { void onGrade() }}
                        >
                            {t("codeGrading.retry")}
                        </Button>
                    ) : null}
                </div>
            ) : null}

            {/* objective execution results (kept across re-grades) */}
            {lastExecution ? <ExecutionResultTable execution={lastExecution} /> : null}
            {gradeResult && isSql ? (
                <Typography type="body-xs" color="muted">
                    {t("codeGrading.sqlNoExecution")}
                </Typography>
            ) : null}

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
