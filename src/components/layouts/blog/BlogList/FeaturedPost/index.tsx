"use client"

import React from "react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import type { BlogPostSummary } from "@/modules/api/rest/blog"

/** Props for {@link FeaturedPost}. */
export interface FeaturedPostProps {
    /** The newest post, given the editorial-lead treatment. */
    post: BlogPostSummary
    /** Resolved category display name, or `undefined` when unknown. */
    categoryLabel?: string
    /** Localized, preformatted publish date (the caller owns locale formatting). */
    formattedDate: string
}

/**
 * The editorial lead — the newest post rendered flat (no card) with a display
 * title so it anchors the page even when only a few posts exist. The cover
 * (`thumbnailUrl`) shows only when present; the meta line carries the category,
 * publish date and view count from the backend.
 *
 * The eyebrow is the "latest" kicker ALONE — the category is NOT re-rendered as a
 * chip here. A chip directly under the interactive `CategoryFilter` row read as a
 * duplicate of that row's chips (same size, same soft variant, same color) while
 * being inert. The category still shows, as accent text in the meta line, exactly
 * the way every {@link PostRow} below already renders it.
 */
export const FeaturedPost = ({ post, categoryLabel, formattedDate }: FeaturedPostProps) => {
    const t = useTranslations("blog")
    return (
        <Link
            href={`/blog/${post.slug}`}
            className="group flex cursor-pointer flex-col gap-3 border-b border-default pb-6"
        >
            {/* eyebrow: "latest" only — the category lives in the meta line below */}
            <div className="flex flex-wrap items-center gap-2">
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

            {/* meta line — same anatomy as PostRow: category · date · views */}
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
                {categoryLabel && (
                    <>
                        <span className="text-accent">{categoryLabel}</span>
                        <span aria-hidden>·</span>
                    </>
                )}
                <span>{formattedDate}</span>
                <span aria-hidden>·</span>
                <span>{t("views", { count: post.viewCount })}</span>
            </div>
        </Link>
    )
}
