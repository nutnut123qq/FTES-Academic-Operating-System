"use client"

import React from "react"
import useSWR from "swr"
import { Chip } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { Link } from "@/i18n/navigation"
import { MarkdownContent } from "@/components/reuseable/MarkdownContent"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { blogCategoryColor, buildCategoryLookup } from "../shared/category"
import { ReadingProgress } from "./ReadingProgress"
import { RelatedPosts } from "./RelatedPosts"
import { BlogEngagement } from "./BlogEngagement"
import { BlogPostSkeleton } from "./BlogPostSkeleton"
import { getBlogCategories, getBlogPostBySlug } from "@/modules/api/rest/blog"

/**
 * Public `/blog/[slug]` article. Reads the slug from the route, fetches the REAL
 * post via SWR (`getBlogPostBySlug`), and renders a reading-progress bar, a header
 * (category chip + title + meta), the optional cover, and the post's markdown
 * content through the sanitizing {@link MarkdownContent} renderer (react-markdown
 * escapes raw HTML — no unsanitized injection), then a "More in {category}" strip.
 * An unknown slug surfaces the not-found state.
 */
export const BlogPost = () => {
    const t = useTranslations("blog")
    const locale = useLocale()
    // the post slug comes straight from the route segment
    const params = useParams()
    const slug = String(params.slug ?? "")

    // fetch the article; re-keys when the slug changes
    const { data, isLoading, error, mutate } = useSWR(
        slug ? ["blog-post", slug] : null,
        async () => getBlogPostBySlug(slug),
    )

    // resolve the post's category id → name/slug for the chip + related strip
    const { data: categories } = useSWR(["blog-categories"], () => getBlogCategories())
    const lookup = buildCategoryLookup(categories)
    const categoryLabel = data ? lookup.nameOf(data.categoryId) : undefined
    const categorySlug = data ? lookup.slugOf(data.categoryId) : undefined

    // localized publish-date formatter (long, article style)
    const publishedAt = data
        ? new Date(data.publishedAt ?? data.createdAt).toLocaleDateString(locale, {
            year: "numeric",
            month: "long",
            day: "numeric",
        })
        : ""

    return (
        <>
            {data && <ReadingProgress />}

            <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
                {/* back to listing */}
                <Link
                    href="/blog"
                    className="cursor-pointer text-sm text-muted hover:text-foreground"
                >
                    ← {t("back")}
                </Link>

                <AsyncContent
                    isLoading={isLoading && !data}
                    skeleton={<BlogPostSkeleton />}
                    error={error}
                    errorContent={{
                        title: t("errorTitle"),
                        description: t("errorHint"),
                        onRetry: () => {
                            void mutate()
                        },
                        retryLabel: t("retry"),
                    }}
                    isEmpty={!data}
                    emptyContent={{ title: t("notFound") }}
                >
                    {data && (
                        <article className="flex flex-col gap-6">
                            {/* header: category chip, title, meta */}
                            <header className="flex flex-col gap-3">
                                {categoryLabel && (
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Chip size="sm" variant="soft" color={blogCategoryColor(categorySlug ?? data.categoryId)}>
                                            {categoryLabel}
                                        </Chip>
                                    </div>
                                )}
                                <h1 className="text-4xl font-bold leading-tight text-foreground">
                                    {data.title}
                                </h1>
                                <div className="flex items-center gap-2 text-sm text-muted">
                                    <span>{publishedAt}</span>
                                    <span aria-hidden>·</span>
                                    <span>{t("views", { count: data.viewCount })}</span>
                                </div>
                            </header>

                            {/* cover image (optional) */}
                            {data.thumbnailUrl && (
                                <img
                                    src={data.thumbnailUrl}
                                    alt=""
                                    className="aspect-[16/9] w-full rounded-2xl object-cover"
                                />
                            )}

                            {/* body (markdown, safely rendered) */}
                            <MarkdownContent markdown={data.contentMd} reading allowHtml />

                            {/* engagement: post reaction bar + flat comment thread */}
                            <BlogEngagement
                                key={data.id}
                                postId={data.id}
                                initialEmojiCount={data.emojiCount}
                            />

                            {/* more in this category (self-hiding) */}
                            <RelatedPosts
                                categorySlug={categorySlug}
                                categoryLabel={categoryLabel}
                                currentSlug={data.slug}
                            />
                        </article>
                    )}
                </AsyncContent>
            </div>
        </>
    )
}
