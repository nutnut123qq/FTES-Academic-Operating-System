"use client"

import React from "react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
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
 * One text-first blog row for the listing / related strips. Whole row is a link
 * (`group`); the title underlines on hover while the meta line stays muted. No
 * cover dependency — typography carries the row; the meta line surfaces the
 * category, publish date, and view count from the backend.
 */
export const PostRow = ({ post, categoryLabel, formattedDate }: PostRowProps) => {
    const t = useTranslations("blog")
    return (
        <Link
            href={`/blog/${post.slug}`}
            className="group flex cursor-pointer flex-col gap-2 border-b border-default py-4 last:border-b-0"
        >
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
        </Link>
    )
}
