"use client"

import React, { useMemo, useState } from "react"
import { Chip, Typography, cn } from "@heroui/react"
import {
    CaretDownIcon,
    CheckCircleIcon,
    EyeSlashIcon,
    WarningCircleIcon,
    XCircleIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import type { TestResultView } from "@/modules/api/rest/challenges"
import type { WithClassNames } from "@/modules/types/base/class-name"
import {
    groupTestCaseResults,
    normalizeTestCaseVerdict,
    resolveTestCaseVerdictColor,
    resolveTestCaseVerdictRowClass,
    summarizeTestCaseResults,
    testCaseVerdictLabelKey,
    type IndexedTestCaseResult,
} from "./test-case-verdict"

/** Props for {@link TestCaseResultTable}. */
export interface TestCaseResultTableProps extends WithClassNames<undefined> {
    /** The submission's per-test-case rows, in the BE's order. */
    results: Array<TestResultView>
}

/**
 * The deterministic per-test-case result of a graded submission (contract
 * `challenge-testcase-judge` §6): one row per case with its verdict chip
 * (`AC`/`WA`/`TLE`/`MLE`/`RE`/`CE`/`SKIPPED`), execution time, awarded score and pass state,
 * under a "Qua X/Y test case" summary. This is the objective judge result — NOT the LLM
 * grade, which stays in {@link GradeResultCard}; a submission can show both.
 *
 * GROUPING (challenge-samples-and-limits): a test-case graded challenge commonly ships up to
 * a hundred cases, so only the SAMPLE ones (`hidden === false`) get a detailed row. Every
 * HIDDEN case folds into ONE expandable summary ({@link HiddenTestCaseGroup} — "Test ẩn:
 * 47/50 đạt") whose expansion shows verdicts and nothing else. The overall "Qua X/Y" summary
 * and the aborted-run warning still cover ALL cases, sample and hidden alike.
 *
 * SECURITY — hidden cases: the table renders ONLY name / verdict / time / score / pass for
 * every row, and the hidden group renders ONLY a positional label + a verdict. Neither reads
 * an input, an expected output or the program's captured output from the payload (the learner
 * view carries none by contract), so a hidden case can never leak its data through this
 * surface. Do not add such a column without re-checking `SubmissionService.resultsFor()`.
 *
 * A run stopped early (budget exhausted / too many consecutive timeouts) leaves `SKIPPED`
 * cases behind — those get an explicit warning line so an aborted run is not read as a wall
 * of failures.
 */
export const TestCaseResultTable = ({ results, className }: TestCaseResultTableProps) => {
    const t = useTranslations("learn")
    const { passed, total, skipped, aborted } = summarizeTestCaseResults(results)
    const allPassed = total > 0 && passed === total
    // Sample rows stay detailed; hidden rows collapse behind one summary. Re-grouped only
    // when the payload changes — a graded submission can carry ~100 rows.
    const grouped = useMemo(() => groupTestCaseResults(results), [results])

    if (results.length === 0) {
        return null
    }

    return (
        <div className={cn("flex flex-col gap-3", className)}>
            <div className="flex flex-wrap items-center gap-2">
                <Typography type="body-sm" weight="semibold">
                    {t("exercises.challenge.testCases.title")}
                </Typography>
                <Chip
                    size="sm"
                    variant="soft"
                    color={allPassed ? "success" : aborted ? "warning" : "danger"}
                >
                    {t("exercises.challenge.testCases.summary", { passed, total })}
                </Chip>
            </div>

            {/* Grading stopped early — say so, otherwise the SKIPPED rows read as failures. */}
            {aborted ? (
                <div className="flex items-start gap-2 rounded-2xl border border-warning/40 bg-warning/5 p-3">
                    <WarningCircleIcon
                        aria-hidden
                        focusable="false"
                        className="mt-0.5 size-4 shrink-0 text-warning"
                    />
                    <div className="flex min-w-0 flex-col gap-0">
                        <Typography type="body-sm" weight="semibold" className="text-warning">
                            {t("exercises.challenge.testCases.abortedTitle")}
                        </Typography>
                        <Typography type="body-xs" color="muted">
                            {t("exercises.challenge.testCases.abortedBody", { count: skipped })}
                        </Typography>
                    </div>
                </div>
            ) : null}

            {/* SAMPLE cases only — the learner already knows their input/expected from the
                problem side, so each keeps a full row. An all-hidden run renders no table at
                all, just the group below. */}
            {grouped.samples.length > 0 ? (
                <div className="overflow-x-auto rounded-2xl border border-default">
                    <table className="w-full border-collapse text-left text-sm">
                        <caption className="sr-only">
                            {t("exercises.challenge.testCases.sampleTitle")}
                        </caption>
                        <thead>
                            <tr className="border-b border-separator">
                                <th scope="col" className="px-3 py-2">
                                    <Typography type="body-xs" color="muted" weight="medium">
                                        {t("exercises.challenge.testCases.columnCase")}
                                    </Typography>
                                </th>
                                <th scope="col" className="px-3 py-2">
                                    <Typography type="body-xs" color="muted" weight="medium">
                                        {t("exercises.challenge.testCases.columnVerdict")}
                                    </Typography>
                                </th>
                                <th scope="col" className="px-3 py-2">
                                    <Typography type="body-xs" color="muted" weight="medium">
                                        {t("exercises.challenge.testCases.columnTime")}
                                    </Typography>
                                </th>
                                <th scope="col" className="px-3 py-2">
                                    <Typography type="body-xs" color="muted" weight="medium">
                                        {t("exercises.challenge.testCases.columnScore")}
                                    </Typography>
                                </th>
                                <th scope="col" className="px-3 py-2">
                                    <Typography type="body-xs" color="muted" weight="medium">
                                        {t("exercises.challenge.testCases.columnStatus")}
                                    </Typography>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {grouped.samples.map(({ result, index }) => (
                                <TestCaseResultRow
                                    key={result.testCaseId || index}
                                    result={result}
                                    index={index}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : null}

            {/* Every HIDDEN case, folded into one expandable tally. */}
            {grouped.hiddenTotal > 0 ? (
                <HiddenTestCaseGroup
                    hidden={grouped.hidden}
                    passed={grouped.hiddenPassed}
                    total={grouped.hiddenTotal}
                    aborted={grouped.hiddenAborted}
                />
            ) : null}
        </div>
    )
}

/**
 * The HIDDEN cases of a run, collapsed into ONE row ("Test ẩn: 47/50 đạt") that expands into
 * a verdict-only list. Replaces the wall of up-to-100 rows the table used to print.
 *
 * SECURITY: an entry renders a POSITIONAL label ("Test ẩn 12" — computed here, never the
 * authored `testCaseName`) plus the verdict chip. No input, expected output, captured output,
 * timing or per-case score is rendered for a hidden case at any point, collapsed or expanded.
 */
const HiddenTestCaseGroup = ({
    hidden,
    passed,
    total,
    aborted,
}: {
    /** The hidden rows, in payload order. */
    hidden: Array<IndexedTestCaseResult>
    /** How many of them passed. */
    passed: number
    /** How many there are. */
    total: number
    /** True when at least one hidden case was never executed. */
    aborted: boolean
}) => {
    const t = useTranslations("learn")
    const [expanded, setExpanded] = useState(false)
    const allPassed = passed === total

    return (
        <div className="overflow-hidden rounded-2xl border border-default">
            <button
                type="button"
                onClick={() => setExpanded((open) => !open)}
                aria-expanded={expanded}
                className={cn(
                    "flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-2 text-left transition-colors hover:bg-default/40",
                    allPassed ? "bg-success/5" : aborted ? "bg-warning/5" : "bg-danger/5",
                )}
            >
                <span className="flex min-w-0 flex-wrap items-center gap-2">
                    <EyeSlashIcon
                        aria-hidden
                        focusable="false"
                        className="size-4 shrink-0 text-muted"
                    />
                    <Typography type="body-sm" weight="medium">
                        {t("exercises.challenge.testCases.hiddenGroupTitle")}
                    </Typography>
                    <Chip
                        size="sm"
                        variant="soft"
                        color={allPassed ? "success" : aborted ? "warning" : "danger"}
                        className="shrink-0"
                    >
                        {t("exercises.challenge.testCases.hiddenSummary", { passed, total })}
                    </Chip>
                </span>
                <CaretDownIcon
                    aria-hidden
                    focusable="false"
                    className={cn(
                        "size-4 shrink-0 text-muted transition-transform",
                        expanded ? "rotate-180" : "",
                    )}
                />
            </button>
            {expanded ? (
                <div className="flex flex-col gap-2 border-t border-separator p-3">
                    <Typography type="body-xs" color="muted">
                        {t("exercises.challenge.testCases.hiddenExpandedHint")}
                    </Typography>
                    <ul className="flex flex-wrap gap-2">
                        {hidden.map((entry, position) => (
                            <li key={entry.result.testCaseId || entry.index}>
                                <HiddenTestCaseVerdict
                                    result={entry.result}
                                    number={position + 1}
                                />
                            </li>
                        ))}
                    </ul>
                </div>
            ) : null}
        </div>
    )
}

/**
 * ONE hidden case inside the expanded group: its position in the hidden set plus its verdict,
 * as a single chip tinted with the verdict's semantic color. Deliberately carries no other
 * field — see the security note on {@link HiddenTestCaseGroup}.
 */
const HiddenTestCaseVerdict = ({
    result,
    number,
}: {
    result: TestResultView
    number: number
}) => {
    const t = useTranslations("learn")
    const verdict = normalizeTestCaseVerdict(result.verdict)
    // Same fallback ladder as the sample rows: known verdict → its label; an unrecognised one
    // (newer BE) → raw; none at all → "—" once graded, "Đang chấm" while it still runs.
    const rawVerdict = (result.verdict ?? "").trim()
    const graded = result.passed !== null && result.passed !== undefined
    const verdictLabel = verdict
        ? t(testCaseVerdictLabelKey(verdict))
        : rawVerdict !== ""
            ? rawVerdict
            : t(graded
                ? "exercises.challenge.testCases.none"
                : "exercises.challenge.testCases.grading")

    return (
        <Chip size="sm" variant="soft" color={resolveTestCaseVerdictColor(verdict)}>
            {t("exercises.challenge.testCases.hiddenCaseVerdict", {
                number,
                verdict: verdictLabel,
            })}
        </Chip>
    )
}

/**
 * One SAMPLE case row: the case name, the verdict chip, the run time, the awarded score and
 * the pass state. An un-graded row (`verdict`/`passed` still null) shows the muted "grading"
 * placeholder instead of a wrong verdict.
 *
 * Only sample cases reach this row — {@link groupTestCaseResults} routes every hidden case to
 * {@link HiddenTestCaseGroup} instead, so no hidden case is ever rendered with a timing or a
 * per-case score.
 */
const TestCaseResultRow = ({ result, index }: { result: TestResultView, index: number }) => {
    const t = useTranslations("learn")
    const verdict = normalizeTestCaseVerdict(result.verdict)
    // An unrecognised verdict (a newer BE) is shown raw rather than dropped — the learner still
    // sees WHY the case did not pass; only the color falls back to neutral. No verdict at all
    // (a deployment older than challenge-testcase-judge, or a case still running) carries no
    // chip: a graded row falls back to a muted dash, an ungraded one says "grading".
    const rawVerdict = (result.verdict ?? "").trim()
    const verdictLabel = verdict ? t(testCaseVerdictLabelKey(verdict)) : rawVerdict
    const casePassed = result.passed === true
    const caseGraded = result.passed !== null && result.passed !== undefined
    const StatusIcon = casePassed ? CheckCircleIcon : XCircleIcon
    // `testCaseName` CÓ THỂ null: sửa/import lại bộ test tạo id mới, kết quả bài nộp cũ thành mồ
    // côi nên BE không tra ra tên. Trước đây `.trim()` thẳng ⇒ TypeError, trắng cả bảng kết quả.
    const name = (result.testCaseName ?? "").trim()

    return (
        <tr
            className={cn(
                "border-b border-separator last:border-b-0",
                resolveTestCaseVerdictRowClass(verdict),
            )}
        >
            <td className="px-3 py-2 align-top">
                <div className="flex flex-wrap items-center gap-2">
                    <Typography type="body-sm" weight="medium">
                        {name !== ""
                            ? name
                            : t("exercises.challenge.testCases.unnamedCase", { number: index + 1 })}
                    </Typography>
                    <Chip size="sm" variant="soft" className="shrink-0">
                        {t("exercises.challenge.testCases.sampleBadge")}
                    </Chip>
                </div>
            </td>
            <td className="px-3 py-2 align-top">
                {verdictLabel !== "" ? (
                    <Chip
                        size="sm"
                        variant="soft"
                        color={resolveTestCaseVerdictColor(verdict)}
                        className="shrink-0"
                    >
                        {verdictLabel}
                    </Chip>
                ) : (
                    <Typography type="body-sm" color="muted">
                        {t(
                            caseGraded
                                ? "exercises.challenge.testCases.none"
                                : "exercises.challenge.testCases.grading",
                        )}
                    </Typography>
                )}
            </td>
            <td className="whitespace-nowrap px-3 py-2 align-top">
                <Typography type="body-sm" color="muted">
                    {typeof result.timeMs === "number"
                        ? t("codeGrading.runtimeMs", { ms: result.timeMs })
                        : t("exercises.challenge.testCases.none")}
                </Typography>
            </td>
            <td className="whitespace-nowrap px-3 py-2 align-top">
                <Typography type="body-sm">{result.score}</Typography>
            </td>
            <td className="px-3 py-2 align-top">
                {caseGraded ? (
                    <span
                        className={cn(
                            "inline-flex items-center gap-2",
                            casePassed ? "text-success" : "text-danger",
                        )}
                    >
                        <StatusIcon
                            aria-hidden
                            focusable="false"
                            weight="fill"
                            className="size-4 shrink-0"
                        />
                        <Typography type="body-sm" weight="medium">
                            {t(casePassed ? "codeGrading.testPass" : "codeGrading.testFail")}
                        </Typography>
                    </span>
                ) : (
                    <Typography type="body-sm" color="muted">
                        {t("exercises.challenge.testCases.grading")}
                    </Typography>
                )}
            </td>
        </tr>
    )
}
