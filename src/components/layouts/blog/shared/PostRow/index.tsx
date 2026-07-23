"use client"

import React from "react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { CoverImage } from "@/components/blocks/media/CoverImage"
import type { BlogPostSummary } from "@/modules/api/rest/blog"

/** Props for {@link PostRow}. */
export interface PostRowProps {
    /** The list-item post to render. */
    post: BlogPostSummary
    /** Resolved category display name, or `undefined` when unknown. */
    categoryLabel?: string
    /** Localized, preformatted publish date (the caller owns locale formatting). */
    formattedDate: string
}

/**
 * One blog row for the listing / related strips. Whole row is a link (`group`); the title
 * underlines on hover while the meta line stays muted. When the post has a cover, a 16:9
 * thumbnail sits on the right (`CoverImage` — decorative, the title carries the link text) so
 * the list reads richer; rows without a cover fall back to text-only. The meta line surfaces
 * the category, publish date, and view count from the backend.
 */
export const PostRow = ({ post, categoryLabel, formattedDate }: PostRowProps) => {
    const t = useTranslations("blog")
    return (
        <Link
            href={`/blog/${post.slug}`}
            className="group flex cursor-pointer items-start gap-4 border-b border-default py-4 last:border-b-0"
        >
            <div className="flex min-w-0 flex-1 flex-col gap-2">
                <h3 className="text-lg font-semibold text-foreground group-hover:underline">
                    {post.title}
                </h3>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
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
            </div>
            {post.thumbnailUrl ? (
                <CoverImage src={post.thumbnailUrl} alt="" className="w-28 shrink-0 sm:w-44" />
            ) : null}
        </Link>
    )
}
