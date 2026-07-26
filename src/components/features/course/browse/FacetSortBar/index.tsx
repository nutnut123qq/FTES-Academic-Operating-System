"use client"

import React from "react"
import { cn } from "@heroui/react"
import { StarIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { SearchInput } from "@/components/reuseable/SearchInput"
import { SegmentedControl } from "@/components/blocks/navigation/SegmentedControl"
import type { WithClassNames } from "@/modules/types/base/class-name"
import type {
    CourseLevelFacet,
    CourseRatingFacet,
    CourseSort,
} from "../../hooks/useQueryCoursesSwr"

/** Sort options of the browse facet bar (order = display order). */
const SORTS: Array<CourseSort> = ["popular", "newest", "rating"]

/** Level facet options (order = display order). */
const LEVELS: Array<CourseLevelFacet> = ["all", "basic", "intermediate", "advanced"]

/** Minimum-rating facet options (order = display order). */
const RATINGS: Array<CourseRatingFacet> = ["all", "4.5", "4", "3.5"]

/** Props for {@link FacetSortBar}. */
export interface FacetSortBarProps extends WithClassNames<undefined> {
    /** Current search query (matches code + name across ALL categories). */
    query: string
    onQueryChange: (query: string) => void
    /** Current sort order. */
    sort: CourseSort
    onSortChange: (sort: CourseSort) => void
    /**
     * Current level facet. Optional: the level control renders only when BOTH
     * `level` and `onLevelChange` are given, so callers that don't facet by level
     * keep the plain search + sort bar.
     */
    level?: CourseLevelFacet
    onLevelChange?: (level: CourseLevelFacet) => void
    /**
     * Current minimum-rating facet. Optional, same rule as {@link FacetSortBarProps.level}:
     * the star control renders only when both the value and the handler are given.
     */
    minRating?: CourseRatingFacet
    onMinRatingChange?: (minRating: CourseRatingFacet) => void
}

/**
 * Facet + sort bar of the browse catalog: text search (code + name), the optional
 * level and minimum-star facets, and a sort control (popular default / newest /
 * rating). Used on `/courses` (search + sort only) and on the category landing
 * page (which also facets that category's grid by level and stars). Sort stays
 * pinned to the end of the row, so adding facets never moves it.
 *
 * @param props - {@link FacetSortBarProps}
 */
export const FacetSortBar = ({
    query,
    onQueryChange,
    sort,
    onSortChange,
    level,
    onLevelChange,
    minRating,
    onMinRatingChange,
    className,
}: FacetSortBarProps) => {
    const t = useTranslations()
    const showLevel = level !== undefined && onLevelChange !== undefined
    const showRating = minRating !== undefined && onMinRatingChange !== undefined

    return (
        <div className={cn("flex flex-col gap-3", className)}>
            <SearchInput
                value={query}
                onValueChange={onQueryChange}
                placeholder={t("courseSystem.catalog.searchPlaceholder")}
            />
            <div className="flex flex-wrap items-center gap-3">
                {/* small 1-of-few selectors = SegmentedControl, never a pill-button row (ui rules) */}
                {showLevel ? (
                    <SegmentedControl
                        ariaLabel={t("courseSystem.browse.filters.levelLabel")}
                        items={LEVELS.map((option) => ({
                            value: option,
                            label:
                                option === "all"
                                    ? t("courseSystem.browse.filters.all")
                                    : t(`courseSystem.levels.${option}`),
                        }))}
                        value={level}
                        onChange={onLevelChange}
                        className="w-fit"
                    />
                ) : null}
                {showRating ? (
                    <SegmentedControl
                        ariaLabel={t("courseSystem.browse.filters.ratingLabel")}
                        items={RATINGS.map((option) => ({
                            value: option,
                            label:
                                option === "all" ? (
                                    t("courseSystem.browse.filters.all")
                                ) : (
                                    <span className="inline-flex items-center gap-2">
                                        <StarIcon
                                            aria-hidden
                                            focusable="false"
                                            weight="fill"
                                            className="size-4 text-warning"
                                        />
                                        {t("courseSystem.browse.filters.ratingAtLeast", { rating: option })}
                                    </span>
                                ),
                        }))}
                        value={minRating}
                        onChange={onMinRatingChange}
                        className="w-fit"
                    />
                ) : null}
                <SegmentedControl
                    ariaLabel={t("courseSystem.browse.sortLabel")}
                    items={SORTS.map((option) => ({
                        value: option,
                        label: t(`courseSystem.browse.sort.${option}`),
                    }))}
                    value={sort}
                    onChange={onSortChange}
                    className="ml-auto w-fit"
                />
            </div>
        </div>
    )
}
