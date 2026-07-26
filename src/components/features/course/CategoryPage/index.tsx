"use client"

import React, { useState } from "react"
import { Typography } from "@heroui/react"
import { MagnifyingGlassIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { IconTile } from "@/components/blocks/identity/IconTile"
import {
    filterCoursesByFacets,
    sortCourses,
    useQueryCoursesSwr,
    type CourseLevelFacet,
    type CourseRatingFacet,
    type CourseSort,
} from "../hooks/useQueryCoursesSwr"
import { useQueryCourseCategoriesSwr } from "../hooks/useQueryCourseCategoriesSwr"
import {
    CategoryChipBar,
    CategoryGridSkeleton,
    CatalogCourseCard,
    CourseHoverPreview,
    FacetSortBar,
    categoryIcon,
    type CategoryChipValue,
} from "../browse"
import type { CourseCategory } from "../browse"

/** Props for {@link CategoryPage}. */
export interface CategoryPageProps {
    /**
     * The real category resolved server-side from `GET /courses/categories` (the
     * route already 404s unknown slugs), so the header renders from BE data and is
     * crawlable in the initial HTML.
     */
    category: CourseCategory
}

/**
 * Category landing page (`/courses/category/[slug]`): header (icon tile + BE name,
 * description and course count), a chip bar that switches to ANY other category
 * (route change, so the page stays a real crawlable landing page per category),
 * then the facet + sort bar and a responsive grid of shared
 * {@link CatalogCourseCard}s. Courses are fetched SERVER-filtered by the
 * category's opaque `categoryId` (`GET /courses?categoryId=`); search, level and
 * minimum-star facets narrow within THIS category client-side, with an explicit
 * empty state.
 *
 * @param props - {@link CategoryPageProps}
 */
export const CategoryPage = ({ category }: CategoryPageProps) => {
    const t = useTranslations()
    const router = useRouter()
    const { courses, isLoading, error, mutate } = useQueryCoursesSwr({
        categoryId: category.id,
    })
    // the whole taxonomy drives the chip bar (this page only ever holds ONE category)
    const { categories } = useQueryCourseCategoriesSwr()
    const [query, setQuery] = useState("")
    const [sort, setSort] = useState<CourseSort>("popular")
    const [level, setLevel] = useState<CourseLevelFacet>("all")
    const [minRating, setMinRating] = useState<CourseRatingFacet>("all")

    const CategoryIcon = categoryIcon(category.slug)

    // each category is its own route → switching a chip navigates ("all" → the catalog)
    const selectCategory = (value: CategoryChipValue) => {
        router.push(value === "all" ? "/courses" : `/courses/category/${value}`)
    }

    // courses come back already scoped to this category; search + facets narrow further
    const filtered = sortCourses(
        filterCoursesByFacets(
            courses.filter(
                (course) =>
                    query.trim() === "" ||
                    `${course.code} ${course.name}`
                        .toLowerCase()
                        .includes(query.trim().toLowerCase()),
            ),
            { level, minRating },
        ),
        sort,
    )

    // prefer the BE-reported count; fall back to the fetched length once loaded
    const courseCount = category.courseCount ?? courses.length

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
            {/* header from the resolved BE category → crawlable in the initial HTML */}
            <div className="flex items-center gap-3">
                <IconTile
                    icon={<CategoryIcon aria-hidden focusable="false" />}
                    tone={category.accent}
                    size="sm"
                />
                <div className="flex min-w-0 flex-col gap-0">
                    <Typography type="h4" weight="bold">
                        {category.name}
                    </Typography>
                    {category.description ? (
                        <Typography type="body-sm" color="muted">
                            {category.description}
                        </Typography>
                    ) : null}
                    {!isLoading && courseCount > 0 ? (
                        <Typography type="body-xs" color="muted">
                            {t("courseSystem.categories.courseCount", {
                                count: courseCount,
                            })}
                        </Typography>
                    ) : null}
                </div>
            </div>

            <div className="flex flex-col gap-3">
                {/* cross-category switch — the active chip is THIS route's category */}
                {categories ? (
                    <CategoryChipBar
                        categories={categories}
                        active={category.slug}
                        onSelect={selectCategory}
                    />
                ) : null}
                <FacetSortBar
                    query={query}
                    onQueryChange={setQuery}
                    sort={sort}
                    onSortChange={setSort}
                    level={level}
                    onLevelChange={setLevel}
                    minRating={minRating}
                    onMinRatingChange={setMinRating}
                />
            </div>

            <AsyncContent
                isLoading={isLoading}
                skeleton={<CategoryGridSkeleton />}
                error={courses.length === 0 ? error : undefined}
                errorContent={{
                    title: t("courseSystem.catalog.loadError"),
                    onRetry: () => { void mutate() },
                    retryLabel: t("courseSystem.detail.retry"),
                }}
                isEmpty={filtered.length === 0}
                emptyContent={{
                    icon: <MagnifyingGlassIcon aria-hidden focusable="false" className="size-8 text-muted" />,
                    title: t("courseSystem.browse.empty"),
                }}
            >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((course) => (
                        <CourseHoverPreview key={course.id} course={course}>
                            <CatalogCourseCard course={course} className="h-full" />
                        </CourseHoverPreview>
                    ))}
                </div>
            </AsyncContent>
        </div>
    )
}
