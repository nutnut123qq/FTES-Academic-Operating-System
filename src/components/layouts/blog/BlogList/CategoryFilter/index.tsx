"use client"

import React from "react"
import { Chip, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { blogCategoryColor } from "../../shared/category"
import type { BlogCategoryResponse } from "@/modules/api/rest/blog"

/** Props for {@link CategoryFilter}. */
export interface CategoryFilterProps {
    /** Active category slug (`null` = "All"). */
    value: string | null
    /** Called when the reader picks a different category (by slug, or `null`). */
    onChange: (next: string | null) => void
    /** The real blog categories from `getBlogCategories`. */
    categories: Array<BlogCategoryResponse>
}

/**
 * Blog category filter row. Each category is a `cursor-pointer` chip button with a
 * hover affordance; the active one is filled, the rest soft. Controlled — the
 * container owns the selected slug + data fetch. Categories come from the backend
 * (`getBlogCategories`); the row keys on the stable `slug`.
 */
export const CategoryFilter = ({ value, onChange, categories }: CategoryFilterProps) => {
    const t = useTranslations("blog")
    return (
        <div
            className="flex flex-wrap items-center gap-2"
            role="group"
            aria-label={t("title")}
        >
            {/* "All" resets the filter */}
            <button
                type="button"
                onClick={() => onChange(null)}
                aria-pressed={value === null}
                className="cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
                <Chip
                    size="md"
                    variant={value === null ? "primary" : "soft"}
                    color="accent"
                    className={cn(value !== null && "opacity-75 transition-opacity hover:opacity-100")}
                >
                    {t("categories.all")}
                </Chip>
            </button>
            {categories.map((category) => {
                const selected = category.slug === value
                return (
                    <button
                        key={category.slug}
                        type="button"
                        onClick={() => onChange(category.slug)}
                        aria-pressed={selected}
                        className="cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                        <Chip
                            size="md"
                            variant={selected ? "primary" : "soft"}
                            color={blogCategoryColor(category.slug)}
                            className={cn(!selected && "opacity-75 transition-opacity hover:opacity-100")}
                        >
                            {category.name}
                        </Chip>
                    </button>
                )
            })}
        </div>
    )
}
