"use client"

import React from "react"
import { Chip, Typography, cn } from "@heroui/react"
import { CheckCircleIcon, WarningCircleIcon, XCircleIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import type { TestResultView } from "@/modules/api/rest/challenges"
import type { WithClassNames } from "@/modules/types/base/class-name"
import {
    normalizeTestCaseVerdict,
    resolveTestCaseVerdictColor,
    resolveTestCaseVerdictRowClass,
    summarizeTestCaseResults,
    testCaseVerdictLabelKey,
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
 * SECURITY — hidden cases: the table renders ONLY name / verdict / time / score / pass for
 * every row. It never reads an input, an expected output or the program's captured output
 * from the payload (the learner view carries none by contract), so a hidden case can never
 * leak its data through this surface. Do not add such a column without re-checking
 * `SubmissionService.resultsFor()`.
 *
 * A run stopped early (budget exhausted / too many consecutive timeouts) leaves `SKIPPED`
 * cases behind — those get an explicit warning line so an aborted run is not read as a wall
 * of failures.
 */
export const TestCaseResultTable = ({ results, className }: TestCaseResultTableProps) => {
    const t = useTranslations("learn")
    const { passed, total, skipped, aborted } = summarizeTestCaseResults(results)
    const allPassed = total > 0 && passed === total

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

            <div className="overflow-x-auto rounded-2xl border border-default">
                <table className="w-full border-collapse text-left text-sm">
                    <caption className="sr-only">
                        {t("exercises.challenge.testCases.title")}
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
                        {results.map((result, index) => (
                            <TestCaseResultRow
                                key={result.testCaseId || index}
                                result={result}
                                index={index}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

/**
 * One case row. Renders the case name (a hidden case keeps its name + a "hidden" chip and
 * nothing else), the verdict chip, the run time, the awarded score and the pass state.
 * An un-graded row (`verdict`/`passed` still null) shows the muted "grading" placeholder
 * instead of a wrong verdict.
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
                    {/* Hidden case: the marker is the ONLY extra thing shown — its input /
                        expected / captured output are never rendered here. */}
                    {result.hidden ? (
                        <Chip size="sm" variant="soft" className="shrink-0">
                            {t("exercises.challenge.testCases.hiddenBadge")}
                        </Chip>
                    ) : null}
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
