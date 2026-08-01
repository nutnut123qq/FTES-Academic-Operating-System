"use client"

import React, { useMemo, useState } from "react"
import { Button, Chip, Typography, cn } from "@heroui/react"
import {
    ArrowLeftIcon,
    CheckCircleIcon,
    ClockIcon,
    PlayIcon,
    PlusIcon,
    SparkleIcon,
    TrashIcon,
    XCircleIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import {
    challengeTypeKey,
    type CodingChallenge,
} from "../hooks/useQuerySubjectCodingChallengesSwr"
import {
    resolveCodingErrorKey,
    type CodingExecutionOutcome,
    type CodingGradeOutcome,
    type CodingRunOutput,
    type CodingSampleCase,
} from "./codingExecution"
import { useMutateCodingAttemptSwr } from "./useMutateCodingAttemptSwr"

/** Languages the editor offers (Judge0 ids used by ftes-ai-service). */
const LANGUAGES = ["python", "javascript", "java", "cpp", "c", "sql"] as const
type CodingLanguage = (typeof LANGUAGES)[number]

/** Literal labels — product names, no i18n. */
const LANGUAGE_LABEL: Record<CodingLanguage, string> = {
    python: "Python",
    javascript: "JavaScript",
    java: "Java",
    cpp: "C++",
    c: "C",
    sql: "SQL",
}

/** lifecycle → chip color. */
const LIFECYCLE_COLOR = {
    running: "success",
    upcoming: "warning",
    closed: "default",
} as const

/** Verdict → chip color for the AI grade block. */
const VERDICT_COLOR: Record<string, "success" | "warning" | "danger"> = {
    PASS: "success",
    PARTIAL: "warning",
    FAIL: "danger",
}

let sampleSeq = 0
/** A new empty sample row (ids are render-local, never sent to the BE). */
const newSample = (): CodingSampleCase => {
    sampleSeq += 1
    return { id: `sample-${sampleSeq}`, input: "", expected: "" }
}

/** Props for {@link CodingChallengeDetail}. */
export interface CodingChallengeDetailProps {
    /** The challenge to solve (already loaded by the list). */
    challenge: CodingChallenge
    /** Back to the problems list. */
    onBack: () => void
}

/**
 * Challenge DETAIL — a two-column solve surface wired to the real backend.
 *
 * LEFT (read): title, type/mode/lifecycle chips, the time window and the BE
 * `description` (problem statement). RIGHT (act): a language picker, the code editor,
 * learner-authored sample test cases (the BE keeps a challenge's own cases hidden from
 * participants) and the two real actions:
 * - **Run** → `POST /api/v1/ai/coding/execute-code` (Judge0 only, no submission),
 * - **Submit** → `POST /api/v1/challenges/{id}/submissions` + `POST /api/v1/ai/coding/grade-code`,
 *   plus a best-effort read of the server-side test results.
 *
 * Every pass/fail row comes from the response — nothing is graded client-side.
 */
export const CodingChallengeDetail = ({ challenge, onBack }: CodingChallengeDetailProps) => {
    const t = useTranslations("subjects")
    const { guard } = useRequireAuth()
    const [language, setLanguage] = useState<CodingLanguage>("python")
    const [code, setCode] = useState("")
    const [samples, setSamples] = useState<Array<CodingSampleCase>>(() => [newSample()])
    const { attempt, isAttempting, outcome, error, reset } = useMutateCodingAttemptSwr()

    const paragraphs = useMemo(
        () =>
            challenge.description
                .split(/\n{2,}/)
                .map((block) => block.trim())
                .filter((block) => block.length > 0),
        [challenge.description],
    )

    const typeKey = challengeTypeKey(challenge.type)
    const isOpen = challenge.lifecycle === "running"
    const canAct = code.trim().length > 0 && !isAttempting
    const errorKey = error ? resolveCodingErrorKey(error) : null

    const start = (kind: "run" | "submit") => {
        reset()
        void attempt({
            kind,
            challengeId: challenge.id,
            exerciseQuestion: [challenge.title, challenge.description]
                .filter(Boolean)
                .join("\n\n"),
            code,
            language,
            testCases: samples,
        }).catch(() => {
            // surfaced through `error` below — nothing else to do here
        })
    }

    const onRun = guard(() => start("run"), "auth.context.generic")
    const onSubmit = guard(() => start("submit"), "auth.context.generic")

    const updateSample = (id: string, patch: Partial<CodingSampleCase>) => {
        setSamples((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)))
    }

    return (
        <div className="flex flex-col gap-4">
            <Button size="sm" variant="tertiary" className="self-start" onPress={onBack}>
                <ArrowLeftIcon aria-hidden focusable="false" className="size-4" />
                {t("practice.coding.backToList")}
            </Button>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* read column */}
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <Typography type="h5" weight="bold">
                            {challenge.title}
                        </Typography>
                        <div className="flex flex-wrap items-center gap-2">
                            <Chip size="sm" variant="soft" color="accent">
                                {typeKey ? t(`practice.coding.types.${typeKey}`) : challenge.type}
                            </Chip>
                            <Chip size="sm" variant="soft" color="default">
                                {challenge.mode === "TEAM"
                                    ? t("practice.coding.modes.team")
                                    : t("practice.coding.modes.individual")}
                            </Chip>
                            <Chip
                                size="sm"
                                variant="soft"
                                color={LIFECYCLE_COLOR[challenge.lifecycle]}
                            >
                                {t(`practice.coding.lifecycle.${challenge.lifecycle}`)}
                            </Chip>
                        </div>
                        <div className="flex items-center gap-2">
                            <ClockIcon aria-hidden focusable="false" className="size-4 text-muted" />
                            <Typography type="body-xs" color="muted">
                                {t("practice.coding.window", {
                                    start: formatDate(challenge.startsAt),
                                    end: formatDate(challenge.endsAt),
                                })}
                            </Typography>
                        </div>
                        <Typography type="body-xs" color="muted">
                            {t("practice.coding.maxSubmissions", {
                                count: challenge.maxSubmissions,
                            })}
                        </Typography>
                    </div>

                    <div className="flex flex-col gap-2">
                        <Typography type="body" weight="medium">
                            {t("practice.coding.problem")}
                        </Typography>
                        {paragraphs.length === 0 ? (
                            <Typography type="body-sm" color="muted">
                                {t("practice.coding.noDescription")}
                            </Typography>
                        ) : (
                            paragraphs.map((paragraph, index) => (
                                <Typography
                                    key={index}
                                    type="body-sm"
                                    color="muted"
                                    className="whitespace-pre-wrap"
                                >
                                    {paragraph}
                                </Typography>
                            ))
                        )}
                    </div>
                </div>

                {/* act column — editor + sample cases + run/submit */}
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                        <Typography type="body-sm" weight="medium" className="min-w-0 flex-1">
                            {t("practice.coding.solution")}
                        </Typography>
                        {/* plain select — the repo carries no HeroUI Select dependency */}
                        <select
                            aria-label={t("practice.coding.language")}
                            value={language}
                            onChange={(event) => setLanguage(event.target.value as CodingLanguage)}
                            className="rounded-large border border-default bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
                        >
                            {LANGUAGES.map((lang) => (
                                <option key={lang} value={lang}>
                                    {LANGUAGE_LABEL[lang]}
                                </option>
                            ))}
                        </select>
                    </div>

                    <textarea
                        value={code}
                        onChange={(event) => setCode(event.target.value)}
                        spellCheck={false}
                        placeholder={t("practice.coding.editorPlaceholder")}
                        className="min-h-64 w-full rounded-2xl border border-default bg-surface p-4 font-mono text-sm text-foreground outline-none focus:border-accent placeholder:text-muted"
                    />

                    {/* learner-authored sample cases — the BE hides a challenge's real ones */}
                    <div className="flex flex-col gap-2 rounded-2xl border border-separator p-4">
                        <div className="flex items-center gap-2">
                            <Typography type="body-sm" weight="medium" className="min-w-0 flex-1">
                                {t("practice.coding.samples")}
                            </Typography>
                            <Button
                                size="sm"
                                variant="tertiary"
                                onPress={() => setSamples((prev) => [...prev, newSample()])}
                            >
                                <PlusIcon aria-hidden focusable="false" className="size-4" />
                                {t("practice.coding.addSample")}
                            </Button>
                        </div>
                        <Typography type="body-xs" color="muted">
                            {t("practice.coding.samplesHint")}
                        </Typography>
                        {samples.map((sample) => (
                            <div key={sample.id} className="flex items-start gap-2">
                                <textarea
                                    value={sample.input}
                                    onChange={(event) =>
                                        updateSample(sample.id, { input: event.target.value })
                                    }
                                    spellCheck={false}
                                    aria-label={t("practice.coding.input")}
                                    placeholder={t("practice.coding.input")}
                                    className="min-h-16 min-w-0 flex-1 rounded-large border border-default bg-surface p-2 font-mono text-xs text-foreground outline-none focus:border-accent placeholder:text-muted"
                                />
                                <textarea
                                    value={sample.expected}
                                    onChange={(event) =>
                                        updateSample(sample.id, { expected: event.target.value })
                                    }
                                    spellCheck={false}
                                    aria-label={t("practice.coding.expected")}
                                    placeholder={t("practice.coding.expected")}
                                    className="min-h-16 min-w-0 flex-1 rounded-large border border-default bg-surface p-2 font-mono text-xs text-foreground outline-none focus:border-accent placeholder:text-muted"
                                />
                                <Button
                                    size="sm"
                                    variant="tertiary"
                                    isIconOnly
                                    aria-label={t("practice.coding.removeSample")}
                                    isDisabled={samples.length === 1}
                                    onPress={() =>
                                        setSamples((prev) =>
                                            prev.filter((item) => item.id !== sample.id),
                                        )
                                    }
                                >
                                    <TrashIcon aria-hidden focusable="false" className="size-4" />
                                </Button>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            size="md"
                            variant="secondary"
                            className="min-w-0 flex-1"
                            isDisabled={!canAct}
                            onPress={onRun}
                        >
                            <PlayIcon aria-hidden focusable="false" className="size-4" />
                            {t("practice.coding.run")}
                        </Button>
                        <Button
                            size="md"
                            variant="primary"
                            className="min-w-0 flex-1"
                            isDisabled={!canAct || !isOpen}
                            onPress={onSubmit}
                        >
                            {t("practice.coding.submit")}
                        </Button>
                    </div>
                    {isAttempting ? (
                        <Typography type="body-xs" color="muted">
                            {t("practice.coding.grading")}
                        </Typography>
                    ) : null}
                    {!isOpen ? (
                        <Typography type="body-xs" color="muted">
                            {t("practice.coding.notOpenHint")}
                        </Typography>
                    ) : null}

                    {errorKey ? (
                        <div className="rounded-2xl border border-danger/40 bg-danger/5 p-4">
                            <Typography type="body-sm" className="text-danger">
                                {t(`practice.coding.errors.${errorKey}`)}
                            </Typography>
                        </div>
                    ) : null}

                    {outcome ? (
                        <div className="flex flex-col gap-3">
                            {outcome.submission ? (
                                <div className="flex flex-col gap-1 rounded-2xl border border-separator p-4">
                                    <Typography type="body-sm" weight="medium">
                                        {t("practice.coding.submissionTitle", {
                                            attempt: outcome.submission.attemptNo,
                                        })}
                                    </Typography>
                                    <Typography type="body-xs" color="muted">
                                        {t("practice.coding.submissionStatus", {
                                            status: outcome.submission.status,
                                        })}
                                    </Typography>
                                    {outcome.submission.finalScore ? (
                                        <Typography type="body-xs" color="muted">
                                            {t("practice.coding.submissionScore", {
                                                score: outcome.submission.finalScore,
                                            })}
                                        </Typography>
                                    ) : null}
                                </div>
                            ) : null}

                            {outcome.runOutput?.present
                                && outcome.execution.supported
                                && outcome.execution.rows.length === 0 ? (
                                    // Flat sandbox shape (PIN §7.1): no test-case rows to
                                    // compare — show the program's output instead of the
                                    // "no cases" placeholder.
                                    <RunOutputBlock output={outcome.runOutput} />
                                ) : (
                                    <ExecutionBlock
                                        execution={outcome.execution}
                                        kind={outcome.kind}
                                    />
                                )}

                            {outcome.gradeErrorKey ? (
                                <Typography type="body-xs" className="text-danger">
                                    {t(`practice.coding.errors.${outcome.gradeErrorKey}`)}
                                </Typography>
                            ) : null}

                            {outcome.grade ? <GradeBlock grade={outcome.grade} /> : null}

                            {outcome.official && outcome.official.length > 0 ? (
                                <div className="flex flex-col gap-2 rounded-2xl border border-separator p-4">
                                    <Typography type="body-sm" weight="medium">
                                        {t("practice.coding.officialTitle")}
                                    </Typography>
                                    {outcome.official.map((row) => (
                                        <div key={row.id} className="flex items-center gap-2">
                                            {row.passed === null ? (
                                                <ClockIcon
                                                    aria-hidden
                                                    focusable="false"
                                                    className="size-4 shrink-0 text-muted"
                                                />
                                            ) : row.passed ? (
                                                <CheckCircleIcon
                                                    aria-hidden
                                                    focusable="false"
                                                    className="size-4 shrink-0 text-success"
                                                />
                                            ) : (
                                                <XCircleIcon
                                                    aria-hidden
                                                    focusable="false"
                                                    className="size-4 shrink-0 text-danger"
                                                />
                                            )}
                                            <Typography
                                                type="body-xs"
                                                className="min-w-0 flex-1"
                                                truncate
                                            >
                                                {row.name}
                                            </Typography>
                                            {row.hidden ? (
                                                <Chip size="sm" variant="soft" color="default">
                                                    {t("practice.coding.hiddenCase")}
                                                </Chip>
                                            ) : null}
                                            <Typography type="body-xs" color="muted">
                                                {row.passed === null
                                                    ? t("practice.coding.pending")
                                                    : row.score}
                                            </Typography>
                                        </div>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    )
}

/** Program output of a flat sandbox Run (`{stdout, stderr, exit_code, time_ms}`, PIN §7.1). */
const RunOutputBlock = ({ output }: { output: CodingRunOutput }) => {
    const t = useTranslations("subjects")
    const failed = output.exitCode !== null && output.exitCode !== 0
    const stdout = output.stdout.trim()
    const stderr = output.stderr.trim()
    const compileOutput = output.compileOutput.trim()

    return (
        <div className="flex flex-col gap-3 rounded-2xl border border-separator p-4">
            <div className="flex flex-wrap items-center gap-2">
                <Typography type="body-sm" weight="medium" className="min-w-0 flex-1">
                    {t("practice.coding.runOutputTitle")}
                </Typography>
                {output.exitCode !== null ? (
                    <Chip size="sm" variant="soft" color={failed ? "danger" : "success"}>
                        {t("practice.coding.exitCode", { code: output.exitCode })}
                    </Chip>
                ) : null}
                {output.timeMs !== null ? (
                    <Chip size="sm" variant="soft" color="default">
                        {t("practice.coding.runtimeMs", { ms: output.timeMs })}
                    </Chip>
                ) : null}
            </div>

            {compileOutput ? (
                <div className="flex flex-col gap-1">
                    <Typography type="body-xs" color="muted" weight="medium">
                        {t("practice.coding.compileOutputLabel")}
                    </Typography>
                    <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-large border border-default bg-surface p-3 font-mono text-xs text-muted">
                        {compileOutput}
                    </pre>
                </div>
            ) : null}

            <div className="flex flex-col gap-1">
                <Typography type="body-xs" color="muted" weight="medium">
                    {t("practice.coding.stdoutLabel")}
                </Typography>
                <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-large border border-default bg-surface p-3 font-mono text-xs text-foreground">
                    {stdout !== "" ? stdout : t("practice.coding.noOutput")}
                </pre>
            </div>

            {stderr ? (
                <div className="flex flex-col gap-1">
                    <Typography type="body-xs" color="muted" weight="medium">
                        {t("practice.coding.stderr")}
                    </Typography>
                    <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-large border border-default bg-surface p-3 font-mono text-xs text-danger">
                        {stderr}
                    </pre>
                </div>
            ) : null}
        </div>
    )
}

/** Judge0 execution rows (Run, and the block attached to an AI grade). */
const ExecutionBlock = ({
    execution,
    kind,
}: {
    execution: CodingExecutionOutcome
    kind: "run" | "submit"
}) => {
    const t = useTranslations("subjects")
    const allPassed = execution.total > 0 && execution.passedCount === execution.total

    if (!execution.supported) {
        return (
            <div className="rounded-2xl border border-separator p-4">
                <Typography type="body-sm" color="muted">
                    {t("practice.coding.notExecuted")}
                </Typography>
            </div>
        )
    }

    if (execution.rows.length === 0) {
        return (
            <div className="rounded-2xl border border-separator p-4">
                <Typography type="body-sm" color="muted">
                    {t("practice.coding.noCases")}
                </Typography>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-3 rounded-2xl border border-separator p-4">
            <div className="flex items-center gap-2">
                {allPassed ? (
                    <CheckCircleIcon
                        aria-hidden
                        focusable="false"
                        className="size-5 shrink-0 text-success"
                    />
                ) : (
                    <XCircleIcon
                        aria-hidden
                        focusable="false"
                        className="size-5 shrink-0 text-danger"
                    />
                )}
                <Typography
                    type="body-sm"
                    weight="medium"
                    className={cn("min-w-0 flex-1", allPassed ? "text-success" : "text-danger")}
                >
                    {allPassed
                        ? t("practice.coding.allPassed")
                        : t("practice.coding.someFailed", {
                            passed: execution.passedCount,
                            total: execution.total,
                        })}
                </Typography>
                <Typography type="body-xs" color="muted">
                    {t(`practice.coding.resultKind.${kind}`)}
                </Typography>
            </div>
            <div className="flex flex-col gap-2">
                {execution.rows.map((row, index) => (
                    <div
                        key={row.id}
                        className={cn(
                            "flex flex-col gap-1",
                            index > 0 && "border-t border-separator pt-2",
                        )}
                    >
                        <div className="flex items-center gap-2">
                            {row.passed ? (
                                <CheckCircleIcon
                                    aria-hidden
                                    focusable="false"
                                    className="size-4 shrink-0 text-success"
                                />
                            ) : (
                                <XCircleIcon
                                    aria-hidden
                                    focusable="false"
                                    className="size-4 shrink-0 text-danger"
                                />
                            )}
                            <Typography type="body-xs" weight="medium" className="min-w-0 flex-1">
                                {t("practice.coding.testN", { n: index + 1 })}
                            </Typography>
                            {row.status ? (
                                <Typography type="body-xs" color="muted">
                                    {row.status}
                                </Typography>
                            ) : null}
                            <Chip size="sm" variant="soft" color={row.passed ? "success" : "danger"}>
                                {row.passed ? t("practice.coding.pass") : t("practice.coding.fail")}
                            </Chip>
                        </div>
                        <div className="flex flex-col gap-0.5 pl-6 font-mono text-xs text-muted">
                            {row.input ? (
                                <span className="whitespace-pre-wrap">
                                    {t("practice.coding.input")}: {row.input}
                                </span>
                            ) : null}
                            {row.expected ? (
                                <span className="whitespace-pre-wrap">
                                    {t("practice.coding.expected")}: {row.expected}
                                </span>
                            ) : null}
                            {!row.passed ? (
                                <span className="whitespace-pre-wrap text-danger">
                                    {t("practice.coding.got")}: {row.actual}
                                </span>
                            ) : null}
                            {row.stderr ? (
                                <span className="whitespace-pre-wrap text-danger">
                                    {t("practice.coding.stderr")}: {row.stderr}
                                </span>
                            ) : null}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

/** LLM grade block — score, verdict, criteria, feedback and the grading model. */
const GradeBlock = ({ grade }: { grade: CodingGradeOutcome }) => {
    const t = useTranslations("subjects")

    return (
        <div className="flex flex-col gap-3 rounded-2xl border border-separator p-4">
            <div className="flex items-center gap-2">
                <SparkleIcon aria-hidden focusable="false" className="size-5 shrink-0 text-accent" />
                <Typography type="body-sm" weight="medium" className="min-w-0 flex-1">
                    {t("practice.coding.gradeTitle")}
                </Typography>
                {grade.verdict ? (
                    <Chip size="sm" variant="soft" color={VERDICT_COLOR[grade.verdict] ?? "default"}>
                        {grade.verdict}
                    </Chip>
                ) : null}
                <Typography type="body-sm" weight="bold">
                    {t("practice.coding.gradeScore", { score: grade.score, max: grade.max })}
                </Typography>
            </div>

            {grade.criteria.length > 0 ? (
                <div className="flex flex-col gap-1 border-t border-separator pt-2">
                    <Typography type="body-xs" weight="medium" color="muted">
                        {t("practice.coding.criteria")}
                    </Typography>
                    {grade.criteria.map((criterion, index) => (
                        <div key={`${criterion.name}-${index}`} className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                                <Typography type="body-xs" className="min-w-0 flex-1">
                                    {criterion.name}
                                </Typography>
                                <Typography type="body-xs" color="muted">
                                    {criterion.score}/{criterion.max}
                                </Typography>
                            </div>
                            {criterion.comment ? (
                                <Typography type="body-xs" color="muted">
                                    {criterion.comment}
                                </Typography>
                            ) : null}
                        </div>
                    ))}
                </div>
            ) : null}

            {grade.feedback ? (
                <div className="flex flex-col gap-1 border-t border-separator pt-2">
                    <Typography type="body-xs" weight="medium" color="muted">
                        {t("practice.coding.feedback")}
                    </Typography>
                    <Typography type="body-sm" className="whitespace-pre-wrap">
                        {grade.feedback}
                    </Typography>
                </div>
            ) : null}

            {grade.improvements.length > 0 ? (
                <div className="flex flex-col gap-1 border-t border-separator pt-2">
                    <Typography type="body-xs" weight="medium" color="muted">
                        {t("practice.coding.improvements")}
                    </Typography>
                    <ul className="flex flex-col gap-1 pl-4">
                        {grade.improvements.map((line, index) => (
                            <li key={index} className="list-disc text-xs text-muted">
                                {line}
                            </li>
                        ))}
                    </ul>
                </div>
            ) : null}

            {grade.model ? (
                <Typography type="body-xs" color="muted" className="border-t border-separator pt-2">
                    {grade.modelNote || t("practice.coding.gradedBy", { model: grade.model })}
                </Typography>
            ) : null}
        </div>
    )
}

/** ISO → `dd/MM/yyyy` (the panel only needs the day). */
const formatDate = (iso: string): string => {
    const parsed = Date.parse(iso ?? "")
    if (!Number.isFinite(parsed)) {
        return "—"
    }
    const date = new Date(parsed)
    const pad = (value: number) => String(value).padStart(2, "0")
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`
}
