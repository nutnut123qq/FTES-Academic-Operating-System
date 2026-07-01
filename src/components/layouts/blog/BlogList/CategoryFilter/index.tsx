"use client"

import React from "react"
import { Chip, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { CATEGORY_COLOR } from "../../shared/category"
import { BlogCategory } from "@/modules/api/graphql/queries/types/blog"

/** Props for {@link CategoryFilter}. */
export interface CategoryFilterProps {
    /** Active pillar (`null` = "All"). */
    value: BlogCategory | null
    /** Called when the reader picks a different pillar. */
    onChange: (next: BlogCategory | null) => void
    /**
     * Pillars that actually have posts (excluding `null`). The row renders `All`
     * + these only — never a filter pointing at an empty bucket. The caller hides
     * the whole row when fewer than two pillars exist.
     */
    categories: Array<BlogCategory>
}

/**
 * Editorial-pillar filter row. Each pillar is a `cursor-pointer` chip button with
 * a hover affordance; the active one is filled, the rest soft. Controlled — the
 * container owns the selected value + data fetch + which pillars are available.
 */
export const CategoryFilter = ({ value, onChange, categories }: CategoryFilterProps) => {
    const t = useTranslations("blog")
    const filters: Array<BlogCategory | null> = [null, ...categories]
    return (
        <div
            className="flex flex-wrap items-center gap-2"
            role="group"
            aria-label={t("title")}
        >
            {filters.map((filter) => {
                const selected = filter === value
                return (
                    <button
                        key={filter ?? "all"}
                        type="button"
                        onClick={() => onChange(filter)}
                        aria-pressed={selected}
                        className="cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                        <Chip
                            size="md"
                            variant={selected ? "primary" : "soft"}
                            color={filter ? CATEGORY_COLOR[filter] : "accent"}
                            className={cn(
                                !selected && "opacity-75 transition-opacity hover:opacity-100",
                            )}
                        >
                            {filter ? t(`categories.${filter}`) : t("categories.all")}
                        </Chip>
                    </button>
                )
            })}
        </div>
    )
}
