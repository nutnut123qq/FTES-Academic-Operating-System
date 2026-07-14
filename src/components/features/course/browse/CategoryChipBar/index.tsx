"use client"

import React from "react"
import { cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import type { WithClassNames } from "@/modules/types/base/class-name"
import type { CourseCategory } from "../categories"
import { categoryIcon } from "../category-icons"

/** Active selection of the chip bar: "all" or a category slug. */
export type CategoryChipValue = "all" | string

/** Props for {@link CategoryChipBar}. */
export interface CategoryChipBarProps extends WithClassNames<undefined> {
    /** The categories to render (one chip each, after the "All" chip). */
    categories: Array<CourseCategory>
    /** Currently selected chip ("all" or a category slug). */
    active: CategoryChipValue
    /** Fired with "all" or the chosen category slug. */
    onSelect: (value: CategoryChipValue) => void
}

/**
 * Horizontal category chip bar of the browse catalog: an "All" chip plus one
 * chip per category (icon + localized name). Exposed as an ARIA tablist with
 * the active chip `aria-selected`; scrolls horizontally on narrow viewports
 * instead of wrapping. Selecting a chip filters the browse view to that
 * category's shelf.
 *
 * @param props - {@link CategoryChipBarProps}
 */
export const CategoryChipBar = ({ categories, active, onSelect, className }: CategoryChipBarProps) => {
    const t = useTranslations()

    const chipClass = (selected: boolean) =>
        cn(
            "flex shrink-0 cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent",
            selected
                ? "border-accent bg-accent/10 font-medium text-accent"
                : "border-separator text-muted hover:text-foreground",
        )

    return (
        <div
            role="tablist"
            aria-label={t("courseSystem.categories.label")}
            className={cn(
                "flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
                className,
            )}
        >
            <button
                type="button"
                role="tab"
                aria-selected={active === "all"}
                onClick={() => onSelect("all")}
                className={chipClass(active === "all")}
            >
                {t("courseSystem.categories.all")}
            </button>
            {categories.map((category) => {
                const ChipIcon = categoryIcon(category.slug)
                return (
                    <button
                        key={category.slug}
                        type="button"
                        role="tab"
                        aria-selected={active === category.slug}
                        onClick={() => onSelect(category.slug)}
                        className={chipClass(active === category.slug)}
                    >
                        <ChipIcon aria-hidden focusable="false" className="size-4" />
                        {category.name}
                    </button>
                )
            })}
        </div>
    )
}
