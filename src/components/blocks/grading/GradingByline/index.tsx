"use client"

import React from "react"
import { cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { CheckCircleIcon, SparkleIcon, XCircleIcon } from "@phosphor-icons/react"
import { AiCategoryChip } from "@/components/blocks/chips/AiCategoryChip"
import type { AiModelCategory } from "@/modules/api/graphql/queries/query-ai-models"

/**
 * Pass/fail verdict glyph (green check / red x). Shared by the result selector
 * chips, the drawer trigger, the verdict chip, and the history rows.
 *
 * @param props - whether the attempt passed + an optional className override.
 */
export const VerdictIcon = ({ pass, className }: { pass: boolean, className?: string }) =>
    pass ? (
        <CheckCircleIcon aria-hidden focusable="false" className={cn("size-4 shrink-0 text-success", className)} />
    ) : (
        <XCircleIcon aria-hidden focusable="false" className={cn("size-4 shrink-0 text-danger", className)} />
    )

/**
 * Grading-model attribution: an accent sparkle + plain "graded by `<model>`" text,
 * followed by the model's tier chip. The model name is PLAIN TEXT (not a chip, not
 * mono) so it never sits chip-beside-chip with the tier chip — the rule is "text,
 * then a chip beside it". Renders nothing when the served model wasn't recorded.
 *
 * @param props - the served model id, its resolved tier category, and whether to
 *   prefix with the "graded by" label (the result card does; the drawer rows don't).
 */
export const ModelByline = ({
    model,
    category,
    withLabel = false,
}: {
    model: string | null
    category?: AiModelCategory
    withLabel?: boolean
}) => {
    const t = useTranslations()
    if (!model) {
        return null
    }
    return (
        <>
            <span className="flex items-center gap-2 text-sm text-muted">
                <SparkleIcon aria-hidden focusable="false" className="size-5 shrink-0 text-accent" />
                <span>
                    {withLabel ? `${t("submissionResult.gradedBy")} ` : null}
                    <span className="text-foreground">{model}</span>
                </span>
            </span>
            {category ? <AiCategoryChip category={category} /> : null}
        </>
    )
}
