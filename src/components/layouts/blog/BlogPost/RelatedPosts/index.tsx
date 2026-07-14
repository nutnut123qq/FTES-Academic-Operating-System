"use client"

import React from "react"
import useSWR from "swr"
import { useLocale, useTranslations } from "next-intl"
import { PostRow } from "../../shared/PostRow"
import { getBlogPosts } from "@/modules/api/rest/blog"

/** How many related posts to surface at most. */
const MAX_RELATED = 3

/** Props for {@link RelatedPosts}. */
export interface RelatedPostsProps {
    /** Category slug to pull related posts from (the current article's category). */
    categorySlug?: string
    /** Resolved category display name (for the section heading + row labels). */
    categoryLabel?: string
    /** Slug of the current article — excluded from the related list. */
    currentSlug: string
}

/**
 * "More in {category}" strip at the end of an article. Reuses the real
 * `getBlogPosts({ categorySlug })` endpoint to keep readers in the same category.
 * Self-hiding: renders nothing when there is no category context or no other
 * posts.
 */
export const RelatedPosts = ({ categorySlug, categoryLabel, currentSlug }: RelatedPostsProps) => {
    const t = useTranslations("blog")
    const locale = useLocale()

    const { data } = useSWR(
        categorySlug ? ["blog-related", categorySlug, currentSlug] : null,
        async () => getBlogPosts({ categorySlug, page: 0, size: MAX_RELATED + 1 }),
    )

    const related = (data?.items ?? [])
        .filter((post) => post.slug !== currentSlug)
        .slice(0, MAX_RELATED)

    // self-hiding section — nothing to show when this is the only post in the category
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
                {categoryLabel ? t("relatedTitle", { category: categoryLabel }) : t("relatedFallbackTitle")}
            </h2>
            <div className="flex flex-col">
                {related.map((post) => (
                    <PostRow
                        key={post.id}
                        post={post}
                        categoryLabel={categoryLabel}
                        formattedDate={formatDate(post.publishedAt ?? post.createdAt)}
                    />
                ))}
            </div>
        </section>
    )
}
