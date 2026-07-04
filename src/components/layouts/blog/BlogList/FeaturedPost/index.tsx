"use client"

import React from "react"
import { Chip } from "@heroui/react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { CATEGORY_COLOR } from "../../shared/category"
import { type QueryBlogPostListItem } from "@/modules/api/graphql/queries/types/blog"

/** Props for {@link FeaturedPost}. */
export interface FeaturedPostProps {
    /** The newest post, given the editorial-lead treatment. */
    post: QueryBlogPostListItem
    /** Localized, preformatted publish date (the caller owns locale formatting). */
    formattedDate: string
}

/**
 * The editorial lead — the newest post rendered flat (no card) with a serif
 * display title so it anchors the page even when only a few posts exist. The
 * cover is shown only when present (most posts have none → typography leads).
 */
export const FeaturedPost = ({ post, formattedDate }: FeaturedPostProps) => {
    const t = useTranslations("blog")
    return (
        <Link
            href={`/blog/${post.slug}`}
            className="group flex cursor-pointer flex-col gap-3 border-b border-default pb-6"
        >
            {/* eyebrow: pillar chip · "latest" · optional premium */}
            <div className="flex flex-wrap items-center gap-2">
                <Chip size="sm" variant="soft" color={CATEGORY_COLOR[post.category]}>
                    {t(`categories.${post.category}`)}
                </Chip>
                <span className="text-xs font-medium text-accent">
                    {t("latest")}
                </span>
                {post.isPremium && (
                    <Chip size="sm" variant="soft" color="warning">
                        {t("premium")}
                    </Chip>
                )}
            </div>

            {/* optional cover — only when the post actually has one */}
            {post.coverImageUrl && (
                <img
                    src={post.coverImageUrl}
                    alt=""
                    className="aspect-[16/9] w-full rounded-large object-cover"
                />
            )}

            {/* serif display title — the page's visual hero */}
            <h2 className="text-3xl font-semibold leading-tight text-foreground group-hover:underline">
                {post.title}
            </h2>
            {post.excerpt && <p className="text-base text-muted">{post.excerpt}</p>}

            <div className="flex items-center gap-2 text-sm text-muted">
                <span>{formattedDate}</span>
                {post.readingMinutes != null && (
                    <>
                        <span aria-hidden>·</span>
                        <span>{t("readingMinutes", { minutes: post.readingMinutes })}</span>
                    </>
                )}
            </div>
        </Link>
    )
}
