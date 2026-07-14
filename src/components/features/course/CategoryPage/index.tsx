"use client"

import React, { useState } from "react"
import { Typography } from "@heroui/react"
import { MagnifyingGlassIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { IconTile } from "@/components/blocks/identity/IconTile"
import {
    sortCourses,
    useQueryCoursesSwr,
    type CourseSort,
} from "../hooks/useQueryCoursesSwr"
import {
    CategoryGridSkeleton,
    CatalogCourseCard,
    CourseHoverPreview,
    FacetSortBar,
    categoryIcon,
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
 * description and course count) over the facet + sort bar and a responsive grid of
 * shared {@link CatalogCourseCard}s. Courses are fetched SERVER-filtered by the
 * category's opaque `categoryId` (`GET /courses?categoryId=`); the search box
 * facets within THIS category client-side, with an explicit empty state.
 *
 * @param props - {@link CategoryPageProps}
 */
export const CategoryPage = ({ category }: CategoryPageProps) => {
    const t = useTranslations()
    const { courses, isLoading, error, mutate } = useQueryCoursesSwr({
        categoryId: category.id,
    })
    const [query, setQuery] = useState("")
    const [sort, setSort] = useState<CourseSort>("popular")

    const CategoryIcon = categoryIcon(category.slug)

    // courses come back already scoped to this category; the search box narrows further
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

            <FacetSortBar
                query={query}
                onQueryChange={setQuery}
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
