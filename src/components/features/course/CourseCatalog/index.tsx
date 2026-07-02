"use client"

import React, { useState } from "react"
import { Typography } from "@heroui/react"
import { MagnifyingGlassIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { EmptyState } from "@/components/blocks/feedback/EmptyState"
import {
    coursesByCategory,
    sortCourses,
    useQueryCoursesSwr,
    type CourseLevel,
    type CourseSort,
} from "../hooks/useQueryCoursesSwr"
import { useQueryCourseCategoriesSwr } from "../hooks/useQueryCourseCategoriesSwr"
import {
    CatalogCourseCard,
    CategoryChipBar,
    CategoryShelf,
    CategoryShelfSkeleton,
    FacetSortBar,
    type CategoryChipValue,
} from "../browse"
import { FeaturedSlider } from "./FeaturedSlider"

/**
 * Course catalog (§4), redesigned as a browse-by-category experience (openspec
 * change `course-catalog-category-browse`, direction A): the featured hero
 * slider stays on top, then a category chip bar (filters which shelves show),
 * a facet + sort bar, and one horizontal {@link CategoryShelf} per non-empty
 * category. Typing a search or picking a level switches the shelves to a flat
 * filtered grid of shared cards (search spans ALL categories per the spec, so
 * the grid ignores the category chip). Loading gates shelf-shaped skeletons;
 * the title + facet bar are static chrome and stay out of the skeleton.
 */
export const CourseCatalog = () => {
    const t = useTranslations()
    const { categories } = useQueryCourseCategoriesSwr()
    const { courses, isLoading } = useQueryCoursesSwr()
    const [query, setQuery] = useState("")
    const [level, setLevel] = useState<CourseLevel | "all">("all")
    const [sort, setSort] = useState<CourseSort>("popular")
    const [activeCategory, setActiveCategory] = useState<CategoryChipValue>("all")

    const loading = isLoading || !categories
    // a live search or level facet switches the browse view to the flat grid
    const isFiltering = query.trim() !== "" || level !== "all"

    const filtered = sortCourses(
        courses.filter((course) => {
            const matchesLevel = level === "all" || course.level === level
            const matchesQuery =
                query.trim() === "" ||
                `${course.code} ${course.name}`
                    .toLowerCase()
                    .includes(query.trim().toLowerCase())
            return matchesLevel && matchesQuery
        }),
        sort,
    )

    const visibleCategories = (categories ?? []).filter(
        (category) => activeCategory === "all" || category.slug === activeCategory,
    )

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
            {/* featured hero slider — merchandising surface, unchanged by the redesign */}
            <FeaturedSlider />

            <Typography type="h4" weight="bold">
                {t("courseSystem.catalog.title")}
            </Typography>

            <div className="flex flex-col gap-3">
                {categories ? (
                    <CategoryChipBar
                        categories={categories}
                        active={activeCategory}
                        onSelect={setActiveCategory}
                    />
                ) : null}
                <FacetSortBar
                    query={query}
                    onQueryChange={setQuery}
                    level={level}
                    onLevelChange={setLevel}
                    sort={sort}
                    onSortChange={setSort}
                />
            </div>

            {loading ? (
                <div className="flex flex-col gap-6">
                    {[0, 1, 2].map((shelf) => (
                        <CategoryShelfSkeleton key={shelf} />
                    ))}
                </div>
            ) : isFiltering ? (
                filtered.length === 0 ? (
                    <EmptyState
                        icon={<MagnifyingGlassIcon aria-hidden focusable="false" />}
                        title={t("courseSystem.browse.empty")}
                    />
                ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {filtered.map((course) => (
                            <CatalogCourseCard key={course.id} course={course} />
                        ))}
                    </div>
                )
            ) : (
                <div className="flex flex-col gap-6">
                    {visibleCategories.map((category) => {
                        const categoryCourses = sortCourses(
                            coursesByCategory(courses, category.slug),
                            sort,
                        )
                        // empty categories render no shelf (and no placeholder)
                        if (categoryCourses.length === 0) return null
                        return (
                            <CategoryShelf
                                key={category.slug}
                                category={category}
                                courses={categoryCourses}
                            />
                        )
                    })}
                </div>
            )}
        </div>
    )
}
