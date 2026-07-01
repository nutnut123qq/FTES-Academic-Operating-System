import React from "react"
import { Typography } from "@heroui/react"
import { MarkdownContent } from "@/components/reuseable/MarkdownContent"
import type { ContentEntity } from "@/modules/types/entities/content"

/** Props for {@link PublicArticle}. */
export interface PublicArticleProps {
    /** The public content to render (fetched server-side by the route). */
    content: ContentEntity
}

/**
 * Server-rendered public article for `/contents/[id]` — the lesson title as a real
 * `<h1>`, its description, then the markdown body rendered into HTML on the server
 * so crawlers + social unfurls receive the full content (interactive bits in the
 * body hydrate on the client). A Server Component: no store / fetching, the route
 * fetches the content and passes it in.
 *
 * @param props - {@link PublicArticleProps}
 */
export const PublicArticle = ({ content }: PublicArticleProps) => (
    <article className="mx-auto flex max-w-4xl flex-col gap-3 p-6">
        <Typography.Heading level={1} weight="bold">
            {content.title}
        </Typography.Heading>
        {content.description ? (
            <Typography type="body" color="muted">
                {content.description}
            </Typography>
        ) : null}
        <div className="h-3" />
        <MarkdownContent markdown={content.body || ""} />
    </article>
)
