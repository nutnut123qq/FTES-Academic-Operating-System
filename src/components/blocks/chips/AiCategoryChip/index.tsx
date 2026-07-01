import React from "react"
import { Chip, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { AiModelCategory } from "@/modules/api/graphql/queries/query-ai-models"
import type { WithClassNames } from "@/modules/types/base/class-name"

/**
 * Maps an AI model cost/quality category to the semantic HeroUI Chip color:
 * free → neutral (foreground), economy → green, balanced → yellow, premium +
 * frontier → red (both are the top, highest-cost tiers).
 */
const CATEGORY_COLOR: Record<AiModelCategory, "default" | "success" | "warning" | "danger"> = {
    [AiModelCategory.Free]: "default",
    [AiModelCategory.Economy]: "success",
    [AiModelCategory.Balanced]: "warning",
    [AiModelCategory.Premium]: "danger",
    [AiModelCategory.Frontier]: "danger",
}

/** Props for {@link AiCategoryChip}. */
export interface AiCategoryChipProps extends WithClassNames<undefined> {
    /** Cost/quality category that drives the chip color + localized label. */
    category: AiModelCategory
}

/**
 * Presentational badge for an AI model's cost/quality category. The single
 * source for the model-category badge across the grade picker and the AI lab:
 * maps the category to its semantic chip color and renders the localized label.
 *
 * @param props - {@link AiCategoryChipProps}
 */
export const AiCategoryChip = ({ category, className }: AiCategoryChipProps) => {
    const t = useTranslations()
    return (
        <Chip
            color={CATEGORY_COLOR[category]}
            variant="soft"
            size="sm"
            className={cn("w-fit", className)}
        >
            <Chip.Label>{t(`aiSettings.categories.${category}`)}</Chip.Label>
        </Chip>
    )
}
