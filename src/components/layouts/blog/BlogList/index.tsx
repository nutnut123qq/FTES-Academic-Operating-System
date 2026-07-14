"use client"

import React, { useState } from "react"
import useSWR from "swr"
import useSWRInfinite from "swr/infinite"
import { Button } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import { PageHeader } from "@/components/blocks/layout/PageHeader"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { SearchInput } from "@/components/reuseable/SearchInput"
import { TopicsStrip } from "./TopicsStrip"
import { CategoryFilter } from "./CategoryFilter"
import { FeaturedPost } from "./FeaturedPost"
import { PostRow } from "../shared/PostRow"
import { BlogListSkeleton } from "./BlogListSkeleton"
import { buildCategoryLookup } from "../shared/category"
import {
    getBlogCategories,
    getBlogPosts,
    searchBlogPosts,
    type BlogPostPage,
} from "@/modules/api/rest/blog"

/** Posts fetched per page / "load more" step (0-based paging; BE caps at 50). */
const PAGE_SIZE = 12

/**
 * Public `/blog` — FTES AOS's engineering publication. Reads REAL posts from the
 * backend: a category chip bar (from `getBlogCategories`) + a search box switch
 * between `getBlogPosts({ categorySlug })` and `searchBlogPosts({ q })`; results
 * paginate with `useSWRInfinite` keyed to the BE `hasNext`. The editorial lead is
 * the newest post; the rest render as a text-first list.
 */
export const BlogList = () => {
    const t = useTranslations("blog")
    const locale = useLocale()
    // active category slug (null = all) and the search query
    const [categorySlug, setCategorySlug] = useState<string | null>(null)
    const [search, setSearch] = useState("")
    const trimmedQuery = search.trim()
    const isSearching = trimmedQuery.length > 0

    // real blog categories drive the chip bar + the categoryId → name lookup
    const { data: categories } = useSWR(["blog-categories"], () => getBlogCategories())
    const lookup = buildCategoryLookup(categories)

    // paginated posts: search mode ignores the category (search spans all), list
    // mode filters by the selected category slug. `hasNext` from the BE gates the
    // next page; keepPreviousData avoids a skeleton flash on filter/search change.
    const getKey = (index: number, previous: BlogPostPage | null) => {
        if (previous && !previous.hasNext) return null
        return [
            "blog-posts",
            isSearching ? "search" : "list",
            isSearching ? trimmedQuery : categorySlug ?? "",
            index,
        ] as const
    }
    const { data, error, isLoading, isValidating, size, setSize, mutate } = useSWRInfinite(
        getKey,
        async ([, , , index]) =>
            isSearching
                ? searchBlogPosts({ q: trimmedQuery, page: index, size: PAGE_SIZE })
                : getBlogPosts({
                    categorySlug: categorySlug ?? undefined,
                    page: index,
                    size: PAGE_SIZE,
                }),
        { keepPreviousData: true },
    )

    // localized publish-date formatter (short, calendar style)
    const formatDate = (iso: string) =>
        new Date(iso).toLocaleDateString(locale, {
            year: "numeric",
            month: "short",
            day: "numeric",
        })

    const pages = data ?? []
    const posts = pages.flatMap((page) => page.items)
    const [featured, ...rest] = posts

    // the last loaded page still reports more → a "load more" step is available
    const hasMore = pages.length > 0 && pages[pages.length - 1].hasNext
    // the filter row is worth showing once the backend has any categories
    const showFilter = (categories ?? []).length >= 1

    // switching category clears the search and resets pagination to the first page
    const changeCategory = (next: string | null) => {
        setCategorySlug(next)
        setSearch("")
        void setSize(1)
    }

    // typing a search resets pagination; an empty box falls back to list mode
    const changeSearch = (next: string) => {
        setSearch(next)
        void setSize(1)
    }

    return (
        <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
            {/* identity — reframed as an engineering publication */}
            <PageHeader title={t("title")} description={t("subtitle")} />

            {/* browse — topics framing + search + (optional) filter + results */}
            <div className="flex flex-col gap-3">
                <TopicsStrip />

                <SearchInput
                    value={search}
                    onValueChange={changeSearch}
                    placeholder={t("searchPlaceholder")}
                    variant="secondary"
                    className="sm:max-w-none"
                />

                {showFilter && !isSearching && (
                    <CategoryFilter
                        value={categorySlug}
                        onChange={changeCategory}
                        categories={categories ?? []}
                    />
                )}

                <AsyncContent
                    isLoading={isLoading && posts.length === 0}
                    skeleton={<BlogListSkeleton />}
                    error={posts.length === 0 ? error : undefined}
                    errorContent={{
                        title: t("errorTitle"),
                        description: t("errorHint"),
                        onRetry: () => {
                            void mutate()
                        },
                        retryLabel: t("retry"),
                    }}
                    isEmpty={posts.length === 0}
                    emptyContent={
                        isSearching
                            ? {
                                title: t("emptyInFilter"),
                                description: t("emptyInFilterHint"),
                                onRetry: () => changeSearch(""),
                                retryLabel: t("clearFilter"),
                            }
                            : categorySlug
                                ? {
                                    title: t("emptyInFilter"),
                                    description: t("emptyInFilterHint"),
                                    onRetry: () => changeCategory(null),
                                    retryLabel: t("clearFilter"),
                                }
                                : {
                                    title: t("empty"),
                                    description: t("emptyHint"),
                                }
                    }
                >
                    <div className="flex flex-col gap-3">
                        {featured && (
                            <FeaturedPost
                                post={featured}
                                categoryLabel={lookup.nameOf(featured.categoryId)}
                                categorySlug={lookup.slugOf(featured.categoryId)}
                                formattedDate={formatDate(featured.publishedAt ?? featured.createdAt)}
                            />
                        )}
                        {rest.length > 0 && (
                            <div className="flex flex-col">
                                {rest.map((post) => (
                                    <PostRow
                                        key={post.id}
                                        post={post}
                                        categoryLabel={lookup.nameOf(post.categoryId)}
                                        formattedDate={formatDate(post.publishedAt ?? post.createdAt)}
                                    />
                                ))}
                            </div>
                        )}
                        {hasMore && (
                            <div className="flex justify-center pt-2">
                                <Button
                                    variant="secondary"
                                    size="md"
                                    isPending={isValidating}
                                    onPress={() => void setSize(size + 1)}
                                >
                                    {t("loadMore")}
                                </Button>
                            </div>
                        )}
                    </div>
                </AsyncContent>
            </div>
        </div>
    )
}
