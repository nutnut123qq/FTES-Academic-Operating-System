"use client"

import React, { useMemo, useState } from "react"
import useSWR from "swr"
import { Button } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import { PageHeader } from "@/components/blocks/layout/PageHeader"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Masthead } from "./Masthead"
import { TopicsStrip } from "./TopicsStrip"
import { StartHereAnchor } from "./StartHereAnchor"
import { CategoryFilter } from "./CategoryFilter"
import { FeaturedPost } from "./FeaturedPost"
import { PostRow } from "../shared/PostRow"
import { BlogListSkeleton } from "./BlogListSkeleton"
import { queryBlogPosts } from "@/modules/api/graphql/queries/query-blog-posts"
import { BlogCategory } from "@/modules/api/graphql/queries/types/blog"

/** Posts fetched per page / "load more" step (mirrors the backend default). */
const PAGE_SIZE = 12

/** Slug of the pinned "start here" entry point (the backend monorepo tour). */
const START_HERE_SLUG = "start-here-monorepo-tour"

/**
 * Public `/blog` — reframed as StarCi's engineering publication ("the backend, taken apart"):
 * an operational 3D infra masthead → reframed header → a real-subsystem topics strip → a pinned
 * "start here" anchor → editorial lead → text-first list. The pillar filter only appears once
 * more than one pillar actually has posts (today every post is a `codebase` deep-dive, so it
 * stays hidden — no dead buckets). Cover images are used only when present.
 */
export const BlogList = () => {
    const t = useTranslations("blog")
    const locale = useLocale()
    // active editorial-pillar filter (null = all)
    const [category, setCategory] = useState<BlogCategory | null>(null)
    // grows by PAGE_SIZE on "load more"; reset when the filter changes
    const [limit, setLimit] = useState(PAGE_SIZE)

    // keepPreviousData → old posts stay visible while the next page/filter loads,
    // so the skeleton only ever shows on the very first paint
    const { data, isLoading, isValidating, error, mutate } = useSWR(
        ["blog-posts", category, limit],
        async () => {
            const response = await queryBlogPosts({
                request: { ...(category ? { category } : {}), limit, offset: 0 },
            })
            return response.data?.blogPosts.data ?? []
        },
        { keepPreviousData: true },
    )

    // localized publish-date formatter (short, calendar style)
    const formatDate = (iso: string) =>
        new Date(iso).toLocaleDateString(locale, {
            year: "numeric",
            month: "short",
            day: "numeric",
        })

    const posts = data ?? []

    // pin the "start here" tour only on the unfiltered view, and drop it from the
    // chronological flow so it isn't shown twice
    const pinned = category === null ? posts.find((post) => post.slug === START_HERE_SLUG) ?? null : null
    const flow = pinned ? posts.filter((post) => post.slug !== pinned.slug) : posts
    const [featured, ...rest] = flow

    // a full page came back → there may be more to load
    const hasMore = posts.length >= limit

    // only the pillars that actually have posts — never render a filter into an empty
    // bucket. With a single pillar present the row is pointless, so the caller hides it.
    const availableCategories = useMemo(
        () => Array.from(new Set(posts.map((post) => post.category))),
        [posts],
    )
    const showFilter = availableCategories.length >= 2

    // switching pillar resets pagination back to the first page
    const changeCategory = (next: BlogCategory | null) => {
        setCategory(next)
        setLimit(PAGE_SIZE)
    }

    return (
        <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
            {/* masthead — operational 3D showcase of the real backend (the blog's subject) */}
            <Masthead />

            {/* identity — reframed as an engineering publication */}
            <PageHeader title={t("title")} description={t("subtitle")} />

            {/* browse — topics framing + (optional) filter + results, one cluster */}
            <div className="flex flex-col gap-3">
                <TopicsStrip />

                {showFilter && (
                    <CategoryFilter
                        value={category}
                        onChange={changeCategory}
                        categories={availableCategories}
                    />
                )}

                <AsyncContent
                    isLoading={isLoading && posts.length === 0}
                    skeleton={<BlogListSkeleton />}
                    error={error}
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
                        category
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
                        {pinned && <StartHereAnchor post={pinned} />}
                        {featured && (
                            <FeaturedPost
                                post={featured}
                                formattedDate={formatDate(featured.publishedAt)}
                            />
                        )}
                        {rest.length > 0 && (
                            <div className="flex flex-col">
                                {rest.map((post) => (
                                    <PostRow
                                        key={post.id}
                                        post={post}
                                        formattedDate={formatDate(post.publishedAt)}
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
                                    onPress={() => setLimit((current) => current + PAGE_SIZE)}
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
