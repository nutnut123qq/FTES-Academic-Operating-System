"use client"

import React from "react"
import {
    Chip,
    cn,
} from "@heroui/react"
import {
    useTranslations,
} from "next-intl"
import type { QueryAiLabEvalCaseResultData } from "@/modules/api/graphql/queries/types/ai-lab-eval-result"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link CaseResultRow}. */
export type CaseResultRowProps = WithClassNames<undefined> & {
    /** The per-case grading result to render. */
    caseResult: QueryAiLabEvalCaseResultData
}

/**
 * One per-case grading result row: pass/fail chip, optional citation flag, the model
 * output and grader feedback. Presentational; mirrors the challenge panel's row styling.
 * @param props - {@link CaseResultRowProps}
 */
export const CaseResultRow = ({ caseResult, className }: CaseResultRowProps) => {
    const t = useTranslations()
    return (
        <div className={cn("flex flex-col gap-2 border-b border-divider px-4 py-3 last:border-b-0", className)}>
            <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">
                    {t("aiLab.eval.caseLabel", { index: caseResult.orderIndex + 1 })}
                </span>
                <div className="flex items-center gap-2">
                    {caseResult.citationPresent != null ? (
                        <Chip
                            size="sm"
                            color={caseResult.citationPresent ? "success" : "warning"}
                            variant="soft"
                        >
                            {caseResult.citationPresent
                                ? t("aiLab.eval.citationPresent")
                                : t("aiLab.eval.citationMissing")}
                        </Chip>
                    ) : null}
                    <Chip
                        size="sm"
                        color={caseResult.passed ? "success" : "danger"}
                        variant="soft"
                    >
                        {caseResult.passed ? t("aiLab.eval.passed") : t("aiLab.eval.failed")}
                    </Chip>
                </div>
            </div>
            {caseResult.actualOutput ? (
                <div className="flex flex-col gap-2">
                    <span className="text-xs text-muted">{t("aiLab.eval.actualOutput")}</span>
                    <pre className="whitespace-pre-wrap break-words rounded-xl bg-background p-3 text-sm text-foreground">
                        {caseResult.actualOutput}
                    </pre>
                </div>
            ) : null}
            {caseResult.feedback ? (
                <div className="flex flex-col gap-2">
                    <span className="text-xs text-muted">{t("aiLab.eval.feedback")}</span>
                    <span className="text-sm text-muted">{caseResult.feedback}</span>
                </div>
            ) : null}
        </div>
    )
}
