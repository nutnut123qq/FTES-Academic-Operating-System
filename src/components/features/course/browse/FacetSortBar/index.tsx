"use client"

import React from "react"
import { cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { SearchInput } from "@/components/reuseable/SearchInput"
import { SegmentedControl } from "@/components/blocks/navigation/SegmentedControl"
import type { WithClassNames } from "@/modules/types/base/class-name"
import type { CourseLevel, CourseSort } from "../../hooks/useQueryCoursesSwr"

/** Level facet options: "all" + every level. */
const LEVELS: Array<CourseLevel | "all"> = ["all", "basic", "intermediate", "advanced"]

/** Sort options of the browse facet bar (order = display order). */
const SORTS: Array<CourseSort> = ["popular", "newest", "rating"]

/** Props for {@link FacetSortBar}. */
export interface FacetSortBarProps extends WithClassNames<undefined> {
    /** Current search query (matches code + name across ALL categories). */
    query: string
    onQueryChange: (query: string) => void
    /** Current level facet. */
    level: CourseLevel | "all"
    onLevelChange: (level: CourseLevel | "all") => void
    /** Current sort order. */
    sort: CourseSort
    onSortChange: (sort: CourseSort) => void
}

/**
 * Facet + sort bar of the browse catalog: text search (across all categories,
 * code + name), the level filter, and a sort control (popular default / newest
 * / rating). Used on `/courses` (filters the browse view) and on the category
 * landing page (filters that category's grid).
 *
 * @param props - {@link FacetSortBarProps}
 */
export const FacetSortBar = ({
    query,
    onQueryChange,
    level,
    onLevelChange,
    sort,
    onSortChange,
    className,
}: FacetSortBarProps) => {
    const t = useTranslations()

    return (
        <div className={cn("flex flex-col gap-3", className)}>
            <SearchInput
                value={query}
                onValueChange={onQueryChange}
                placeholder={t("courseSystem.catalog.searchPlaceholder")}
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
                {/* small 1-of-few selectors = SegmentedControl, never a pill-button row (ui rules) */}
                <SegmentedControl
                    ariaLabel={t("courseSystem.browse.levelLabel")}
                    items={LEVELS.map((option) => ({
                        value: option,
                        label:
                            option === "all"
                                ? t("courseSystem.catalog.all")
                                : t(`courseSystem.levels.${option}`),
                    }))}
                    value={level}
                    onChange={onLevelChange}
                    className="w-fit"
                />
                <SegmentedControl
                    ariaLabel={t("courseSystem.browse.sortLabel")}
                    items={SORTS.map((option) => ({
                        value: option,
                        label: t(`courseSystem.browse.sort.${option}`),
                    }))}
                    value={sort}
                    onChange={onSortChange}
                    className="w-fit"
                />
            </div>
        </div>
    )
}
