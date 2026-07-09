"use client"

import React, { useState } from "react"
import { Typography } from "@heroui/react"
import { MagnifyingGlassIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import {
    coursesByCategory,
    sortCourses,
    useQueryCoursesSwr,
    type CourseSort,
} from "../hooks/useQueryCoursesSwr"
import { useQueryCourseCategoriesSwr } from "../hooks/useQueryCourseCategoriesSwr"
import {
    CatalogCourseCard,
    CategoryChipBar,
    CategoryGridSkeleton,
    CategoryShelf,
    CategoryShelfSkeleton,
    CourseHoverPreview,
    FacetSortBar,
    type CategoryChipValue,
} from "../browse"
import { FeaturedSlider } from "./FeaturedSlider"

/**
 * Course catalog (§4), redesigned as a browse-by-category experience (openspec
 * change `course-catalog-category-browse`, direction A): the featured hero
 * slider stays on top, then a category chip bar (filters which shelves show),
 * a facet + sort bar, and one horizontal {@link CategoryShelf} per non-empty
 * category. Typing a search switches the shelves to a flat
 * filtered grid of shared cards (search spans ALL categories per the spec, so
 * the grid ignores the category chip). Loading gates shelf-shaped skeletons;
 * the title + facet bar are static chrome and stay out of the skeleton.
 */
export const CourseCatalog = () => {
    const t = useTranslations()
    const { categories } = useQueryCourseCategoriesSwr()
    const { courses, isLoading, error, mutate } = useQueryCoursesSwr()
    const [query, setQuery] = useState("")
    const [sort, setSort] = useState<CourseSort>("popular")
    const [activeCategory, setActiveCategory] = useState<CategoryChipValue>("all")

    const loading = isLoading || !categories
    // a live search switches the browse view from the shelves to the flat grid
    const isFiltering = query.trim() !== ""

    const filtered = sortCourses(
        courses.filter(
            (course) =>
                query.trim() === "" ||
                `${course.code} ${course.name}`
                    .toLowerCase()
                    .includes(query.trim().toLowerCase()),
        ),
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
                    sort={sort}
                    onSortChange={setSort}
                />
            </div>

            {/* skeleton mirrors the active view (grid when filtering, shelves otherwise)
                so the catalog doesn't jump on resolve; empty/error via AsyncContent */}
            <AsyncContent
                isLoading={loading}
                skeleton={isFiltering ? (
                    <CategoryGridSkeleton />
                ) : (
                    <div className="flex flex-col gap-6">
                        {[0, 1, 2].map((shelf) => (
                            <CategoryShelfSkeleton key={shelf} />
                        ))}
                    </div>
                )}
                error={courses.length === 0 ? error : undefined}
                errorContent={{
                    title: t("courseSystem.catalog.loadError"),
                    onRetry: () => { void mutate() },
                    retryLabel: t("courseSystem.detail.retry"),
                }}
                isEmpty={isFiltering && filtered.length === 0}
                emptyContent={{
                    icon: <MagnifyingGlassIcon aria-hidden focusable="false" className="size-8 text-muted" />,
                    title: t("courseSystem.browse.empty"),
                }}
            >
                {isFiltering ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {filtered.map((course) => (
                            <CourseHoverPreview key={course.id} course={course}>
                                <CatalogCourseCard course={course} className="h-full" />
                            </CourseHoverPreview>
                        ))}
                    </div>
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
            </AsyncContent>
        </div>
    )
}
