"use client"

import React from "react"
import { Chip, Typography, cn } from "@heroui/react"
import { CheckCircleIcon, XCircleIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import type { CodeExecutionSummary } from "@/modules/api/rest/ai"

/** Props for {@link ExecutionResultTable}. */
export interface ExecutionResultTableProps {
    /** The per-case execution block (`results[]` + `passed`/`total`). */
    summary: CodeExecutionSummary
    /** Extra classes. */
    className?: string
}

/** Renders one cell's raw value in monospace, or a muted placeholder when empty. */
const CellValue = ({ value, empty }: { value: string | undefined, empty: string }) => {
    const text = value ?? ""
    return text.trim() !== "" ? (
        <pre className="whitespace-pre-wrap break-words font-mono text-xs text-foreground">
            {text}
        </pre>
    ) : (
        <Typography type="body-xs" color="muted">
            {empty}
        </Typography>
    )
}

/**
 * The per-case result grid of a sample-test run (`POST /ai/coding/run-tests`) — columns
 * `#` / input / expected / actual / status, each row tinted by pass/fail, with a
 * passed/total summary chip. Reused wherever a {@link CodeExecutionSummary} is shown (the
 * sample "Chạy test" run in {@link GradeCodePanel}). Objective + model-independent: this is
 * sandbox execution, NOT the LLM grade ({@link GradeResultCard}).
 */
export const ExecutionResultTable = ({ summary, className }: ExecutionResultTableProps) => {
    const t = useTranslations("learn")
    const results = summary.results ?? []
    const total = summary.total ?? results.length
    const passed =
        summary.passed ?? results.filter((result) => result.passed === true).length
    const allPassed = total > 0 && passed === total

    return (
        <div className={cn("flex flex-col gap-3", className)}>
            <div className="flex flex-wrap items-center gap-2">
                <Typography type="body-sm" weight="semibold">
                    {t("codeGrading.testResultsTitle")}
                </Typography>
                {/* Only tally when there ARE cases — an empty result would render a red
                    "0/0" chip next to the "no cases" message, which reads as a failure. */}
                {results.length > 0 ? (
                    <Chip
                        size="sm"
                        variant="soft"
                        color={allPassed ? "success" : summary.aborted ? "warning" : "danger"}
                    >
                        {t("codeGrading.testSummary", { passed, total })}
                    </Chip>
                ) : null}
            </div>

            {/* Dừng sớm (hết ngân sách / quá nhiều timeout liên tiếp): số case chạy được ÍT HƠN số
                case thật, nên phải nói rõ — nếu không, người học tưởng đã chạy hết và chỉ sai bấy nhiêu. */}
            {summary.aborted ? (
                <Typography type="body-xs" className="text-warning">
                    {t("codeGrading.testAborted")}
                </Typography>
            ) : null}

            {results.length > 0 ? (
                <div className="overflow-x-auto rounded-2xl border border-default">
                    <table className="w-full border-collapse text-left text-sm">
                        <caption className="sr-only">{t("codeGrading.testResultsTitle")}</caption>
                        <thead>
                            <tr className="border-b border-separator">
                                <th scope="col" className="px-3 py-2">
                                    <Typography type="body-xs" color="muted" weight="medium">
                                        {t("codeGrading.testColumnCase")}
                                    </Typography>
                                </th>
                                <th scope="col" className="px-3 py-2">
                                    <Typography type="body-xs" color="muted" weight="medium">
                                        {t("codeGrading.testColumnInput")}
                                    </Typography>
                                </th>
                                <th scope="col" className="px-3 py-2">
                                    <Typography type="body-xs" color="muted" weight="medium">
                                        {t("codeGrading.testColumnExpected")}
                                    </Typography>
                                </th>
                                <th scope="col" className="px-3 py-2">
                                    <Typography type="body-xs" color="muted" weight="medium">
                                        {t("codeGrading.testColumnActual")}
                                    </Typography>
                                </th>
                                <th scope="col" className="px-3 py-2">
                                    <Typography type="body-xs" color="muted" weight="medium">
                                        {t("codeGrading.testColumnStatus")}
                                    </Typography>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.map((result, index) => {
                                const casePassed = result.passed === true
                                const StatusIcon = casePassed ? CheckCircleIcon : XCircleIcon
                                // Nhãn verdict ("Accepted", "Time Limit Exceeded", …) — chẩn đoán
                                // mà Pass/Fail nhị phân che mất, hiện ngay dưới nó để case lỗi
                                // không chỉ trơ một chữ "Fail".
                                // `status_label` là nhãn NGƯỜI đọc; `status` giờ là mã MÁY đọc
                                // (`TIMEOUT`/`RUNTIME_ERROR`…) sau khi siết judge ở ai-service —
                                // ưu tiên nhãn, fallback mã để engine/bản cũ vẫn hiển thị được.
                                const statusText =
                                    result.status_label?.trim() || result.status?.trim() || ""
                                return (
                                    <tr
                                        key={index}
                                        className={cn(
                                            "border-b border-separator last:border-b-0",
                                            casePassed ? "bg-success/5" : "bg-danger/5",
                                        )}
                                    >
                                        <td className="whitespace-nowrap px-3 py-2 align-top">
                                            <Typography type="body-sm" weight="medium">
                                                {index + 1}
                                            </Typography>
                                        </td>
                                        <td className="px-3 py-2 align-top">
                                            <CellValue
                                                value={result.input}
                                                empty={t("codeGrading.testEmpty")}
                                            />
                                        </td>
                                        <td className="px-3 py-2 align-top">
                                            <CellValue
                                                value={result.expected}
                                                empty={t("codeGrading.testEmpty")}
                                            />
                                        </td>
                                        <td className="px-3 py-2 align-top">
                                            <CellValue
                                                value={result.actual}
                                                empty={t("codeGrading.testEmpty")}
                                            />
                                            {/* Lý do case chết (lỗi biên dịch / message DB như
                                                "Invalid object name 'sinh_vien'."). Sandbox vẫn
                                                trả về nhưng bảng trước đây bỏ đi, nên một case
                                                Runtime Error chỉ còn ô Actual trống — người học
                                                không có gì để sửa. */}
                                            {result.stderr?.trim() ? (
                                                <pre className="mt-1 whitespace-pre-wrap break-words font-mono text-xs text-danger">
                                                    {result.stderr}
                                                </pre>
                                            ) : null}
                                        </td>
                                        <td className="px-3 py-2 align-top">
                                            <div className="flex flex-col gap-1">
                                                <span
                                                    className={cn(
                                                        "inline-flex items-center gap-1",
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
                                                {statusText !== "" ? (
                                                    <Typography type="body-xs" color="muted">
                                                        {statusText}
                                                    </Typography>
                                                ) : null}
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <Typography type="body-sm" color="muted">
                    {t("codeGrading.testNoResults")}
                </Typography>
            )}
        </div>
    )
}
