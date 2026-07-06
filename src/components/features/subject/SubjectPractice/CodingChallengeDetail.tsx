"use client"

import React, { useState } from "react"
import { Button, Chip, Typography, cn } from "@heroui/react"
import {
    ArrowLeftIcon,
    CheckCircleIcon,
    PlayIcon,
    XCircleIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import type {
    CodingChallenge,
    CodingDifficulty,
} from "../hooks/useQuerySubjectCodingChallengesSwr"

/** difficulty → chip color (shared idiom with SubjectOverview). */
const DIFFICULTY_COLOR: Record<CodingDifficulty, "success" | "warning" | "danger"> = {
    easy: "success",
    medium: "warning",
    hard: "danger",
}

/** Languages the (placeholder) editor offers. Labels are literal — no i18n needed. */
const LANGUAGES = ["python", "javascript", "java", "cpp"] as const
const LANGUAGE_LABEL: Record<(typeof LANGUAGES)[number], string> = {
    python: "Python",
    javascript: "JavaScript",
    java: "Java",
    cpp: "C++",
}

/** One graded test-case row (mirrors the SubmissionRow pass/fail idiom). */
interface RunResultRow {
    id: string
    input: string
    expected: string
    actual: string
    passed: boolean
}

/** The Run/Submit outcome shown under the editor. */
interface RunResult {
    /** `run` grades only the first sample; `submit` grades the whole bank. */
    kind: "run" | "submit"
    rows: Array<RunResultRow>
    passedCount: number
    total: number
}

/** Props for {@link CodingChallengeDetail}. */
export interface CodingChallengeDetailProps {
    /** The problem to render. */
    challenge: CodingChallenge
    /** Back to the problems list. */
    onBack: () => void
}

/**
 * LeetCode-style problem DETAIL — a two-column solve surface. LEFT (read): title +
 * difficulty/acceptance/status chips, the prompt, worked examples, constraints. RIGHT
 * (act): a language selector + a code-editor PLACEHOLDER (textarea) + Run/Submit that
 * grade the mock test cases into pass/fail rows. All local + mock; no BE.
 */
export const CodingChallengeDetail = ({ challenge, onBack }: CodingChallengeDetailProps) => {
    const t = useTranslations("subjects")
    const [language, setLanguage] = useState<(typeof LANGUAGES)[number]>("python")
    const [code, setCode] = useState("")
    const [result, setResult] = useState<RunResult | null>(null)

    // grade against the mock cases: a case passes when actual === expected (the bank
    // encodes one deterministic failing row so Submit shows a realistic mix).
    const grade = (kind: "run" | "submit") => {
        const cases = kind === "run" ? challenge.testCases.slice(0, 1) : challenge.testCases
        const rows: Array<RunResultRow> = cases.map((testCase) => ({
            id: testCase.id,
            input: testCase.input,
            expected: testCase.expected,
            actual: testCase.actual,
            passed: testCase.actual === testCase.expected,
        }))
        setResult({
            kind,
            rows,
            passedCount: rows.filter((row) => row.passed).length,
            total: rows.length,
        })
    }

    const allPassed = result !== null && result.passedCount === result.total

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
                            <Chip size="sm" variant="soft" color={DIFFICULTY_COLOR[challenge.difficulty]}>
                                {t(`practice.difficulty.${challenge.difficulty}`)}
                            </Chip>
                            <Chip
                                size="sm"
                                variant="soft"
                                color={challenge.status === "solved" ? "success" : "default"}
                            >
                                {t(`practice.coding.status.${challenge.status}`)}
                            </Chip>
                            <Typography type="body-xs" color="muted">
                                {t("practice.coding.acceptance", { rate: challenge.acceptance })}
                            </Typography>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {challenge.tags.map((tag) => (
                                <Chip key={tag} size="sm" variant="soft" color="accent">
                                    {tag}
                                </Chip>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        {challenge.prompt.map((paragraph, index) => (
                            <Typography key={index} type="body-sm" color="muted">
                                {paragraph}
                            </Typography>
                        ))}
                    </div>

                    <div className="flex flex-col gap-3">
                        <Typography type="body" weight="medium">
                            {t("practice.coding.examples")}
                        </Typography>
                        {challenge.examples.map((example, index) => (
                            <div
                                key={index}
                                className="flex flex-col gap-1 rounded-2xl border border-separator p-4"
                            >
                                <Typography type="body-xs" weight="medium" color="muted">
                                    {t("practice.coding.exampleN", { n: index + 1 })}
                                </Typography>
                                <div className="flex flex-col gap-0.5 font-mono text-xs text-foreground">
                                    <span>
                                        <span className="text-muted">{t("practice.coding.input")}: </span>
                                        {example.input}
                                    </span>
                                    <span>
                                        <span className="text-muted">{t("practice.coding.output")}: </span>
                                        {example.output}
                                    </span>
                                </div>
                                {example.explanation ? (
                                    <Typography type="body-xs" color="muted">
                                        {example.explanation}
                                    </Typography>
                                ) : null}
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col gap-2">
                        <Typography type="body" weight="medium">
                            {t("practice.coding.constraints")}
                        </Typography>
                        <ul className="flex flex-col gap-1 pl-4">
                            {challenge.constraints.map((constraint, index) => (
                                <li key={index} className="list-disc font-mono text-xs text-muted">
                                    {constraint}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* act column — editor placeholder + run/submit */}
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                        <Typography type="body-sm" weight="medium" className="min-w-0 flex-1">
                            {t("practice.coding.solution")}
                        </Typography>
                        {/* language selector — plain select, no HeroUI Select dependency for the mock */}
                        <select
                            aria-label={t("practice.coding.language")}
                            value={language}
                            onChange={(event) =>
                                setLanguage(event.target.value as (typeof LANGUAGES)[number])
                            }
                            className="rounded-medium border border-default bg-surface px-3 py-1.5 text-sm text-foreground outline-none focus:border-accent"
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

                    <div className="flex items-center gap-2">
                        <Button
                            size="md"
                            variant="secondary"
                            className="min-w-0 flex-1"
                            onPress={() => grade("run")}
                        >
                            <PlayIcon aria-hidden focusable="false" className="size-4" />
                            {t("practice.coding.run")}
                        </Button>
                        <Button
                            size="md"
                            variant="primary"
                            className="min-w-0 flex-1"
                            onPress={() => grade("submit")}
                        >
                            {t("practice.coding.submit")}
                        </Button>
                    </div>

                    {result ? (
                        <div className="flex flex-col gap-3 rounded-2xl border border-separator p-4">
                            <div className="flex items-center gap-2">
                                {allPassed ? (
                                    <CheckCircleIcon aria-hidden focusable="false" className="size-5 shrink-0 text-success" />
                                ) : (
                                    <XCircleIcon aria-hidden focusable="false" className="size-5 shrink-0 text-danger" />
                                )}
                                <Typography
                                    type="body-sm"
                                    weight="medium"
                                    className={cn("min-w-0 flex-1", allPassed ? "text-success" : "text-danger")}
                                >
                                    {allPassed
                                        ? t("practice.coding.allPassed")
                                        : t("practice.coding.someFailed", {
                                            passed: result.passedCount,
                                            total: result.total,
                                        })}
                                </Typography>
                                <Typography type="body-xs" color="muted">
                                    {t(`practice.coding.resultKind.${result.kind}`)}
                                </Typography>
                            </div>
                            <div className="flex flex-col gap-2">
                                {result.rows.map((row, index) => (
                                    <div
                                        key={row.id}
                                        className={cn(
                                            "flex flex-col gap-1",
                                            index > 0 && "border-t border-separator pt-2",
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            {row.passed ? (
                                                <CheckCircleIcon aria-hidden focusable="false" className="size-4 shrink-0 text-success" />
                                            ) : (
                                                <XCircleIcon aria-hidden focusable="false" className="size-4 shrink-0 text-danger" />
                                            )}
                                            <Typography type="body-xs" weight="medium" className="min-w-0 flex-1">
                                                {t("practice.coding.testN", { n: index + 1 })}
                                            </Typography>
                                            <Chip
                                                size="sm"
                                                variant="soft"
                                                color={row.passed ? "success" : "danger"}
                                            >
                                                {row.passed
                                                    ? t("practice.coding.pass")
                                                    : t("practice.coding.fail")}
                                            </Chip>
                                        </div>
                                        <div className="flex flex-col gap-0.5 pl-6 font-mono text-xs text-muted">
                                            <span>
                                                {t("practice.coding.input")}: {row.input}
                                            </span>
                                            <span>
                                                {t("practice.coding.expected")}: {row.expected}
                                            </span>
                                            {!row.passed ? (
                                                <span className="text-danger">
                                                    {t("practice.coding.got")}: {row.actual}
                                                </span>
                                            ) : null}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    )
}
