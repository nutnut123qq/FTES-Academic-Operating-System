"use client"

import React, { useState } from "react"
import { Typography } from "@heroui/react"
import { MagnifyingGlassIcon } from "@phosphor-icons/react"
import { useLocale, useTranslations } from "next-intl"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { IconTile } from "@/components/blocks/identity/IconTile"
import {
    coursesByCategory,
    sortCourses,
    useQueryCoursesSwr,
    type CourseLevel,
    type CourseSort,
} from "../hooks/useQueryCoursesSwr"
import {
    CategoryGridSkeleton,
    CatalogCourseCard,
    CourseHoverPreview,
    FacetSortBar,
    categoryDescription,
    categoryIcon,
    categoryName,
    findCategoryBySlug,
} from "../browse"

/** Props for {@link CategoryPage}. */
export interface CategoryPageProps {
    /** The category slug from the route (the page already 404s unknown slugs). */
    slug: string
}

/**
 * Category landing page (`/courses/category/[slug]`): header (icon tile +
 * localized name, description and course count — rendered from the static seed,
 * so the initial HTML is crawlable), the facet + sort bar, and a responsive
 * grid of shared {@link CatalogCourseCard}s. Facets filter within THIS
 * category; an explicit empty state shows when nothing matches.
 *
 * @param props - {@link CategoryPageProps}
 */
export const CategoryPage = ({ slug }: CategoryPageProps) => {
    const t = useTranslations()
    const locale = useLocale()
    const { courses, isLoading, error, mutate } = useQueryCoursesSwr()
    const [query, setQuery] = useState("")
    const [level, setLevel] = useState<CourseLevel | "all">("all")
    const [sort, setSort] = useState<CourseSort>("popular")

    const category = findCategoryBySlug(slug)
    // the route already notFound()s unknown slugs — this only guards a stale link
    if (!category) return null
    const CategoryIcon = categoryIcon(category.slug)

    const categoryCourses = coursesByCategory(courses, category.slug)
    const filtered = sortCourses(
        categoryCourses.filter((course) => {
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

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
            {/* header from the static category seed → crawlable in the initial HTML */}
            <div className="flex items-center gap-3">
                <IconTile
                    icon={<CategoryIcon aria-hidden focusable="false" />}
                    tone={category.accent}
                    size="sm"
                />
                <div className="flex min-w-0 flex-col gap-0">
                    <Typography type="h4" weight="bold">
                        {categoryName(category, locale)}
                    </Typography>
                    <Typography type="body-sm" color="muted">
                        {categoryDescription(category, locale)}
                    </Typography>
                    {!isLoading && categoryCourses.length > 0 ? (
                        <Typography type="body-xs" color="muted">
                            {t("courseSystem.categories.courseCount", {
                                count: categoryCourses.length,
                            })}
                        </Typography>
                    ) : null}
                </div>
            </div>

            <FacetSortBar
                query={query}
                onQueryChange={setQuery}
                level={level}
                onLevelChange={setLevel}
                sort={sort}
                onSortChange={setSort}
            />

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
