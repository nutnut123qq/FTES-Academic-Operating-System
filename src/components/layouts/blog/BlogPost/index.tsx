"use client"

import React from "react"
import useSWR from "swr"
import { Button, Card, CardContent, Chip } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { Link } from "@/i18n/navigation"
import { MarkdownContent } from "@/components/reuseable/MarkdownContent"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { CATEGORY_COLOR } from "../shared/category"
import { ReadingProgress } from "./ReadingProgress"
import { RelatedPosts } from "./RelatedPosts"
import { BlogPostSkeleton } from "./BlogPostSkeleton"
import { queryBlogPost } from "@/modules/api/graphql/queries/query-blog-post"

/**
 * Public `/blog/[slug]` article. Reads the slug from the route, fetches the
 * article via SWR, and renders a reading-progress bar, a serif header, the
 * markdown body, the members-only gate (when `isLocked`), the GitHub source +
 * funnel CTAs, and a "More in {pillar}" strip.
 */
export const BlogPost = () => {
    const t = useTranslations("blog")
    const locale = useLocale()
    // the post slug comes straight from the route segment
    const params = useParams()
    const slug = String(params.slug ?? "")

    // fetch the article; re-keys when the slug changes
    const { data, isLoading, error, mutate } = useSWR(
        ["blog-post", slug],
        async () => {
            const response = await queryBlogPost({ request: { slug } })
            return response.data?.blogPost.data ?? null
        },
    )

    // localized publish-date formatter (long, article style)
    const publishedAt = data
        ? new Date(data.publishedAt).toLocaleDateString(locale, {
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
                            {/* header: chips, serif title, meta */}
                            <header className="flex flex-col gap-3">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Chip size="sm" variant="soft" color={CATEGORY_COLOR[data.category]}>
                                        {t(`categories.${data.category}`)}
                                    </Chip>
                                    {data.isPremium && (
                                        <Chip size="sm" variant="soft" color="warning">
                                            {t("premium")}
                                        </Chip>
                                    )}
                                </div>
                                <h1 className="text-4xl font-semibold leading-tight text-foreground">
                                    {data.title}
                                </h1>
                                <div className="flex items-center gap-2 text-sm text-muted">
                                    <span>{publishedAt}</span>
                                    {data.readingMinutes != null && (
                                        <>
                                            <span aria-hidden>·</span>
                                            <span>{t("readingMinutes", { minutes: data.readingMinutes })}</span>
                                        </>
                                    )}
                                </div>
                            </header>

                            {/* cover image (optional) */}
                            {data.coverImageUrl && (
                                <img
                                    src={data.coverImageUrl}
                                    alt=""
                                    className="aspect-[16/9] w-full rounded-large object-cover"
                                />
                            )}

                            {/* body (markdown) */}
                            <MarkdownContent markdown={data.body} />

                            {/* members-only gate when the body was truncated server-side */}
                            {data.isLocked && (
                                <Card className="w-full border border-warning/40">
                                    <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
                                        <p className="font-semibold">{t("lockedTitle")}</p>
                                        <p className="text-sm text-muted">{t("lockedBody")}</p>
                                    </CardContent>
                                </Card>
                            )}

                            {/* end-of-article actions: GitHub source (secondary) + funnel CTA (primary) */}
                            {(data.sourceUrl || data.ctaUrl) && (
                                <div className="flex flex-col gap-3">
                                    {data.sourceUrl && (
                                        <a href={data.sourceUrl} target="_blank" rel="noopener noreferrer">
                                            <Button variant="outline" size="lg" className="w-full">
                                                {t("viewSource")}
                                            </Button>
                                        </a>
                                    )}
                                    {data.ctaUrl && (
                                        <Link href={data.ctaUrl}>
                                            <Button variant="primary" size="lg" className="w-full">
                                                {data.ctaLabel ?? t("ctaDefault")}
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            )}

                            {/* more in this pillar (self-hiding) */}
                            <RelatedPosts category={data.category} currentSlug={data.slug} />
                        </article>
                    )}
                </AsyncContent>
            </div>
        </>
    )
}
