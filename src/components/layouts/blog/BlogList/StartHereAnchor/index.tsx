"use client"

import React from "react"
import { MapPinIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { type QueryBlogPostListItem } from "@/modules/api/graphql/queries/types/blog"

/** Props for {@link StartHereAnchor}. */
export interface StartHereAnchorProps {
    /** The pinned "start here" post (the monorepo tour) — the reader's entry point. */
    post: QueryBlogPostListItem
}

/**
 * Pinned entry-point anchor — surfaces the "start here" tour above the chronological flow so a
 * new reader knows where to begin. Accent-tinted to read as an invitation, not a regular row.
 */
export const StartHereAnchor = ({ post }: StartHereAnchorProps) => {
    const t = useTranslations("blog")
    return (
        <Link
            href={`/blog/${post.slug}`}
            className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-accent/40 bg-accent/5 px-4 py-3 transition-colors hover:bg-accent/10"
        >
            <MapPinIcon className="size-5 shrink-0 text-accent" aria-hidden />
            <div className="flex flex-col">
                <span className="text-xs font-medium text-accent">{t("startHere")}</span>
                <span className="text-sm font-semibold text-foreground group-hover:underline">
                    {post.title}
                </span>
            </div>
        </Link>
    )
}
