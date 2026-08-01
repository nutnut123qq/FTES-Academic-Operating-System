"use client"

import React from "react"
import { Chip, Typography, cn } from "@heroui/react"
import { WarningCircleIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import type { SqlRunResult } from "@/modules/api/rest/ai"

/** Props for {@link SqlResultTable}. */
export interface SqlResultTableProps {
    /** Result set of a sandbox SQL run (columns/rows are stringified BE-side). */
    result: SqlRunResult
    /** Extra classes. */
    className?: string
}

/**
 * The result grid of a sandbox SQL run (PIN §7.2): dynamic columns from
 * `result.columns`, string cells from `result.rows`, a row-count chip and a truncated
 * note. A non-null `error` renders a scrubbed error card instead of the grid
 * (syntax/timeout), never a stacktrace.
 */
export const SqlResultTable = ({ result, className }: SqlResultTableProps) => {
    const t = useTranslations("learn")

    if (result.error) {
        return (
            <div
                className={cn(
                    "flex flex-col gap-2 rounded-2xl border border-danger/40 bg-danger/5 p-4",
                    className,
                )}
            >
                <div className="flex items-center gap-2">
                    <WarningCircleIcon
                        aria-hidden
                        focusable="false"
                        className="size-5 shrink-0 text-danger"
                    />
                    <Typography type="body-sm" weight="semibold" className="text-danger">
                        {t("codeGrading.sqlErrorTitle")}
                    </Typography>
                </div>
                <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-xs text-danger">
                    {result.error}
                </pre>
            </div>
        )
    }

    const columns = result.columns ?? []
    const rows = result.rows ?? []

    return (
        <div className={cn("flex flex-col gap-3", className)}>
            <div className="flex flex-wrap items-center gap-2">
                <Typography type="body-sm" weight="semibold">
                    {t("codeGrading.sqlResultTitle")}
                </Typography>
                <Chip size="sm" variant="soft">
                    {t("codeGrading.sqlRowCount", { count: result.row_count })}
                </Chip>
                {result.truncated ? (
                    <Chip size="sm" variant="soft" color="warning">
                        {t("codeGrading.sqlTruncatedNote")}
                    </Chip>
                ) : null}
            </div>

            {rows.length === 0 ? (
                <Typography type="body-sm" color="muted">
                    {t("codeGrading.sqlNoRows")}
                </Typography>
            ) : (
                <div className="overflow-x-auto rounded-2xl border border-default">
                    <table className="w-full border-collapse text-left text-sm">
                        <caption className="sr-only">{t("codeGrading.sqlResultTitle")}</caption>
                        <thead>
                            <tr className="border-b border-separator">
                                {columns.map((column, index) => (
                                    <th key={index} scope="col" className="px-3 py-2">
                                        <Typography type="body-xs" color="muted" weight="medium">
                                            {column}
                                        </Typography>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, rowIndex) => (
                                <tr
                                    key={rowIndex}
                                    className="border-b border-separator last:border-b-0"
                                >
                                    {columns.map((_column, colIndex) => (
                                        <td key={colIndex} className="max-w-64 px-3 py-2 align-top">
                                            <pre className="whitespace-pre-wrap break-words font-mono text-xs text-foreground">
                                                {row[colIndex] ?? ""}
                                            </pre>
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
