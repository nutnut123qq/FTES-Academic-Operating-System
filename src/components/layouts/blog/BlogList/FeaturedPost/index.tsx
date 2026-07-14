"use client"

import React from "react"
import { Chip } from "@heroui/react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { blogCategoryColor } from "../../shared/category"
import type { BlogPostSummary } from "@/modules/api/rest/blog"

/** Props for {@link FeaturedPost}. */
export interface FeaturedPostProps {
    /** The newest post, given the editorial-lead treatment. */
    post: BlogPostSummary
    /** Resolved category display name, or `undefined` when unknown. */
    categoryLabel?: string
    /** Resolved category slug (drives the chip color), or `undefined`. */
    categorySlug?: string
    /** Localized, preformatted publish date (the caller owns locale formatting). */
    formattedDate: string
}

/**
 * The editorial lead — the newest post rendered flat (no card) with a display
 * title so it anchors the page even when only a few posts exist. The cover
 * (`thumbnailUrl`) shows only when present; the meta line carries the publish date
 * and view count from the backend.
 */
export const FeaturedPost = ({ post, categoryLabel, categorySlug, formattedDate }: FeaturedPostProps) => {
    const t = useTranslations("blog")
    return (
        <Link
            href={`/blog/${post.slug}`}
            className="group flex cursor-pointer flex-col gap-3 border-b border-default pb-6"
        >
            {/* eyebrow: category chip · "latest" */}
            <div className="flex flex-wrap items-center gap-2">
                {categoryLabel && (
                    <Chip size="sm" variant="soft" color={blogCategoryColor(categorySlug ?? post.categoryId)}>
                        {categoryLabel}
                    </Chip>
                )}
                <span className="text-xs font-medium text-accent">
                    {t("latest")}
                </span>
            </div>

            {/* optional cover — only when the post actually has one */}
            {post.thumbnailUrl && (
                <img
                    src={post.thumbnailUrl}
                    alt=""
                    className="aspect-[16/9] w-full rounded-2xl object-cover"
                />
            )}

            {/* display title — the page's visual hero */}
            <h2 className="text-3xl font-bold leading-tight text-foreground group-hover:underline">
                {post.title}
            </h2>

            <div className="flex items-center gap-2 text-sm text-muted">
                <span>{formattedDate}</span>
                <span aria-hidden>·</span>
                <span>{t("views", { count: post.viewCount })}</span>
            </div>
        </Link>
    )
}
