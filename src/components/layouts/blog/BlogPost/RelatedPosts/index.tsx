"use client"

import React from "react"
import useSWR from "swr"
import { useLocale, useTranslations } from "next-intl"
import { PostRow } from "../../shared/PostRow"
import { fetchMockBlogPosts } from "../../mock"
import { BlogCategory } from "@/modules/api/graphql/queries/types/blog"

/** How many related posts to surface at most. */
const MAX_RELATED = 3

/** Props for {@link RelatedPosts}. */
export interface RelatedPostsProps {
    /** Pillar to pull related posts from (the current article's category). */
    category: BlogCategory
    /** Slug of the current article — excluded from the related list. */
    currentSlug: string
}

/**
 * "More in {pillar}" strip at the end of an article. Reuses the mock
 * `fetchMockBlogPosts(category)` fetcher (no new backend) to keep readers in the
 * same editorial pillar. Self-hiding: renders nothing when there are no other
 * posts.
 */
export const RelatedPosts = ({ category, currentSlug }: RelatedPostsProps) => {
    const t = useTranslations("blog")
    const locale = useLocale()

    const { data } = useSWR(
        ["blog-related", category, currentSlug],
        async () => fetchMockBlogPosts({ category, limit: MAX_RELATED + 1 }),
    )

    const related = (data ?? [])
        .filter((post) => post.slug !== currentSlug)
        .slice(0, MAX_RELATED)

    // self-hiding section — nothing to show when this is the only post in the pillar
    if (related.length === 0) {
        return null
    }

    const formatDate = (iso: string) =>
        new Date(iso).toLocaleDateString(locale, {
            year: "numeric",
            month: "short",
            day: "numeric",
        })

    return (
        <section className="flex flex-col gap-3 border-t border-default pt-6">
            <h2 className="text-lg font-semibold text-foreground">
                {t("relatedTitle", { category: t(`categories.${category}`) })}
            </h2>
            <div className="flex flex-col">
                {related.map((post) => (
                    <PostRow
                        key={post.id}
                        post={post}
                        formattedDate={formatDate(post.publishedAt)}
                    />
                ))}
            </div>
        </section>
    )
}
