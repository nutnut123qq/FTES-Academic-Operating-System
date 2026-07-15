"use client"

import React from "react"
import { Chip, Typography, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import type { CodeGradeResult } from "@/modules/api/rest/ai"

/** Props for {@link GradeResultCard}. */
export interface GradeResultCardProps {
    /** Grade response (LLM part — model-dependent). */
    result: CodeGradeResult
    /** Extra classes. */
    className?: string
}

/** Verdict → chip color (PASS green / PARTIAL yellow / FAIL red; unknown → plain). */
const verdictColor = (verdict: string): "success" | "warning" | "danger" | undefined => {
    switch (verdict) {
    case "PASS":
        return "success"
    case "PARTIAL":
        return "warning"
    case "FAIL":
        return "danger"
    default:
        return undefined
    }
}

/**
 * The LLM grade of a code submission: score/max + verdict, the per-criterion
 * table, feedback and improvement bullets. Model attribution (chip "Chấm bởi
 * {model}" + `model_note` caption) is MANDATORY — each model grades
 * differently, so two grades of the same code may legitimately differ.
 */
export const GradeResultCard = ({ result, className }: GradeResultCardProps) => {
    const t = useTranslations("learn")
    const verdict = (result.verdict ?? "").toUpperCase()
    const criteria = result.criteria ?? []
    const improvements = result.improvements ?? []

    return (
        <div
            className={cn(
                "flex flex-col gap-4 rounded-3xl border border-default bg-surface p-4",
                className,
            )}
        >
            {/* score + verdict */}
            <div className="flex flex-wrap items-center gap-3">
                <Typography type="h5" weight="bold">
                    {t("codeGrading.score", {
                        score: result.score ?? 0,
                        max: result.max ?? 100,
                    })}
                </Typography>
                {verdict ? (
                    <Chip size="sm" variant="soft" color={verdictColor(verdict)}>
                        {["PASS", "PARTIAL", "FAIL"].includes(verdict)
                            ? t(`codeGrading.verdict.${verdict}`)
                            : verdict}
                    </Chip>
                ) : null}
            </div>

            {/* model attribution — mandatory */}
            <div className="flex flex-col gap-1">
                <Chip size="sm" variant="soft" color="accent" className="w-fit">
                    {t("codeGrading.gradedBy", { model: result.model ?? "AI" })}
                </Chip>
                {result.model_note ? (
                    <Typography type="body-xs" color="muted">
                        {result.model_note}
                    </Typography>
                ) : null}
            </div>

            {/* criteria table */}
            {criteria.length > 0 ? (
                <div className="overflow-x-auto rounded-2xl border border-default">
                    <table className="w-full border-collapse text-left text-sm">
                        <caption className="sr-only">{t("codeGrading.criteria")}</caption>
                        <thead>
                            <tr className="border-b border-separator">
                                <th scope="col" className="px-3 py-2">
                                    <Typography type="body-xs" color="muted" weight="medium">
                                        {t("codeGrading.criteria")}
                                    </Typography>
                                </th>
                                <th scope="col" className="px-3 py-2">
                                    <Typography type="body-xs" color="muted" weight="medium">
                                        {t("codeGrading.criteriaScore")}
                                    </Typography>
                                </th>
                                <th scope="col" className="px-3 py-2">
                                    <Typography type="body-xs" color="muted" weight="medium">
                                        {t("codeGrading.criteriaComment")}
                                    </Typography>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {criteria.map((criterion, index) => (
                                <tr key={index} className="border-b border-separator last:border-b-0">
                                    <td className="px-3 py-2 align-top">
                                        <Typography type="body-sm" weight="medium">
                                            {criterion.name ?? ""}
                                        </Typography>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-2 align-top">
                                        <Typography type="body-sm">
                                            {criterion.score ?? 0}
                                            {criterion.max !== undefined ? `/${criterion.max}` : ""}
                                        </Typography>
                                    </td>
                                    <td className="px-3 py-2 align-top">
                                        <Typography type="body-sm" color="muted">
                                            {criterion.comment ?? ""}
                                        </Typography>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : null}

            {/* feedback + improvements */}
            {result.feedback ? (
                <div className="flex flex-col gap-1">
                    <Typography type="body-sm" weight="semibold">
                        {t("codeGrading.feedback")}
                    </Typography>
                    <Typography type="body-sm" color="muted" className="whitespace-pre-line">
                        {result.feedback}
                    </Typography>
                </div>
            ) : null}
            {improvements.length > 0 ? (
                <div className="flex flex-col gap-1">
                    <Typography type="body-sm" weight="semibold">
                        {t("codeGrading.improvements")}
                    </Typography>
                    <ul className="flex list-disc flex-col gap-1 ps-5">
                        {improvements.map((improvement, index) => (
                            <li key={index} className="text-sm text-muted">
                                {improvement}
                            </li>
                        ))}
                    </ul>
                </div>
            ) : null}
        </div>
    )
}
