"use client"

import React from "react"
import { Chip, Typography, cn } from "@heroui/react"
import { CheckCircleIcon, XCircleIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import type { CodeExecutionSummary, ExecutionCaseResult } from "@/modules/api/rest/ai"

/** Props for {@link ExecutionResultTable}. */
export interface ExecutionResultTableProps {
    /** Judge0 execution block (`execution` of a grade/execute response). */
    execution: CodeExecutionSummary
    /** Extra classes. */
    className?: string
}

/** Whether one Judge0 case passed (defensive across `passed` flag / status text). */
const casePassed = (result: ExecutionCaseResult): boolean =>
    result.passed === true
    || /^(passed|accepted|ok|success)$/i.test(result.status ?? "")

/**
 * Objective test-case results (Judge0 — model-independent), rendered separately
 * from the LLM grade: a passed/total badge plus one row per case with
 * input / expected / actual / status / time. Failed rows tint red so the
 * expected-vs-actual diff stands out.
 */
export const ExecutionResultTable = ({ execution, className }: ExecutionResultTableProps) => {
    const t = useTranslations("learn")
    const results = execution.results ?? []
    const total = execution.total ?? results.length
    const passed = execution.passed ?? results.filter(casePassed).length
    const allPassed = total > 0 && passed === total

    if (results.length === 0) return null

    return (
        <div className={cn("flex flex-col gap-3", className)}>
            <div className="flex items-center gap-2">
                <Typography type="body-sm" weight="semibold">
                    {t("codeGrading.executionTitle")}
                </Typography>
                <Chip size="sm" variant="soft" color={allPassed ? "success" : "danger"}>
                    {t("codeGrading.passedBadge", { passed, total })}
                </Chip>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-default">
                <table className="w-full border-collapse text-left text-sm">
                    <caption className="sr-only">{t("codeGrading.executionTitle")}</caption>
                    <thead>
                        <tr className="border-b border-separator">
                            <th scope="col" className="px-3 py-2">
                                <Typography type="body-xs" color="muted" weight="medium">
                                    #
                                </Typography>
                            </th>
                            <th scope="col" className="px-3 py-2">
                                <Typography type="body-xs" color="muted" weight="medium">
                                    {t("codeGrading.columns.input")}
                                </Typography>
                            </th>
                            <th scope="col" className="px-3 py-2">
                                <Typography type="body-xs" color="muted" weight="medium">
                                    {t("codeGrading.columns.expected")}
                                </Typography>
                            </th>
                            <th scope="col" className="px-3 py-2">
                                <Typography type="body-xs" color="muted" weight="medium">
                                    {t("codeGrading.columns.actual")}
                                </Typography>
                            </th>
                            <th scope="col" className="px-3 py-2">
                                <Typography type="body-xs" color="muted" weight="medium">
                                    {t("codeGrading.columns.status")}
                                </Typography>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {results.map((result, index) => {
                            const isPassed = casePassed(result)
                            return (
                                <tr
                                    key={index}
                                    className={cn(
                                        "border-b border-separator last:border-b-0",
                                        !isPassed && "bg-danger/5",
                                    )}
                                >
                                    <td className="px-3 py-2 align-top">
                                        {isPassed ? (
                                            <CheckCircleIcon
                                                aria-label={t("codeGrading.casePassed")}
                                                weight="fill"
                                                className="size-4 text-success"
                                            />
                                        ) : (
                                            <XCircleIcon
                                                aria-label={t("codeGrading.caseFailed")}
                                                weight="fill"
                                                className="size-4 text-danger"
                                            />
                                        )}
                                    </td>
                                    <td className="max-w-48 px-3 py-2 align-top">
                                        <pre className="whitespace-pre-wrap break-words font-mono text-xs text-foreground">
                                            {result.input ?? ""}
                                        </pre>
                                    </td>
                                    <td className="max-w-48 px-3 py-2 align-top">
                                        <pre className="whitespace-pre-wrap break-words font-mono text-xs text-foreground">
                                            {result.expected ?? ""}
                                        </pre>
                                    </td>
                                    <td className="max-w-48 px-3 py-2 align-top">
                                        <pre
                                            className={cn(
                                                "whitespace-pre-wrap break-words font-mono text-xs",
                                                isPassed ? "text-foreground" : "text-danger",
                                            )}
                                        >
                                            {result.actual ?? ""}
                                        </pre>
                                    </td>
                                    <td className="px-3 py-2 align-top">
                                        <Typography
                                            type="body-xs"
                                            className={cn(!isPassed && "text-danger")}
                                        >
                                            {result.status
                                                ?? (isPassed
                                                    ? t("codeGrading.casePassed")
                                                    : t("codeGrading.caseFailed"))}
                                        </Typography>
                                        {result.time !== undefined && result.time !== null ? (
                                            <Typography type="body-xs" color="muted">
                                                {String(result.time)}s
                                            </Typography>
                                        ) : null}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
