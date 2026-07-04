"use client"

import React from "react"
import { Chip } from "@heroui/react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { type QueryBlogPostListItem } from "@/modules/api/graphql/queries/types/blog"

/** Props for {@link PostRow}. */
export interface PostRowProps {
    /** The list-item post to render. */
    post: QueryBlogPostListItem
    /** Localized, preformatted publish date (the caller owns locale formatting). */
    formattedDate: string
}

/**
 * One text-first blog row for the listing / related strips. Whole row is a link
 * (`group`); the title underlines on hover while the meta line stays muted. No
 * cover dependency — typography carries the row.
 */
export const PostRow = ({ post, formattedDate }: PostRowProps) => {
    const t = useTranslations("blog")
    return (
        <Link
            href={`/blog/${post.slug}`}
            className="group flex cursor-pointer flex-col gap-2 border-b border-default py-4 last:border-b-0"
        >
            <h3 className="text-lg font-semibold text-foreground group-hover:underline">
                {post.title}
            </h3>
            {post.excerpt && (
                <p className="line-clamp-2 text-sm text-muted">{post.excerpt}</p>
            )}
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                <span className="text-accent">{t(`categories.${post.category}`)}</span>
                <span aria-hidden>·</span>
                <span>{formattedDate}</span>
                {post.readingMinutes != null && (
                    <>
                        <span aria-hidden>·</span>
                        <span>{t("readingMinutes", { minutes: post.readingMinutes })}</span>
                    </>
                )}
                {post.isPremium && (
                    <Chip size="sm" variant="soft" color="warning">
                        {t("premium")}
                    </Chip>
                )}
            </div>
        </Link>
    )
}
