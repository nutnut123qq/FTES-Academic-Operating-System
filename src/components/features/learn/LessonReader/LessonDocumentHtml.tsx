"use client"

import DOMPurify from "dompurify"
import { useEffect, useState } from "react"
import { cn } from "@heroui/react"

/**
 * Renders the author-authored HTML body of a migrated attachment lesson (type "1":
 * notes, Drive links) inside the reading card. The markup comes from `videoRef` and
 * is sanitized with DOMPurify — a real DOM sanitizer, so stored XSS from migrated
 * content can't fire. DOMPurify needs a DOM, so it runs client-side after mount:
 * empty on the server/first paint, then the sanitized markup is injected.
 */
export const LessonDocumentHtml = ({ html }: { html: string }) => {
    const [safeHtml, setSafeHtml] = useState("")

    useEffect(() => {
        setSafeHtml(DOMPurify.sanitize(html, { ADD_ATTR: ["target"] }))
    }, [html])

    return (
        <div
            className={cn(
                "flex flex-col gap-3 leading-7 text-foreground",
                // headings
                "[&_h1]:mt-4 [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:mt-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mt-3 [&_h3]:text-lg [&_h3]:font-semibold [&_h4]:text-base [&_h4]:font-semibold",
                // inline marks + links
                "[&_a]:break-words [&_a]:text-accent [&_a]:underline [&_strong]:font-semibold [&_em]:italic",
                // lists
                "[&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mt-1",
                // inline code + code blocks
                "[&_code]:rounded [&_code]:bg-default [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-sm",
                "[&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-default [&_pre]:bg-background [&_pre]:p-3 [&_pre]:text-sm [&_pre_code]:bg-transparent [&_pre_code]:p-0",
                // blockquote, media, rules, tables
                "[&_blockquote]:border-l-4 [&_blockquote]:border-default [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted",
                "[&_img]:max-w-full [&_img]:rounded-xl [&_hr]:my-4 [&_hr]:border-default",
                "[&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-default [&_th]:p-2 [&_td]:border [&_td]:border-default [&_td]:p-2",
            )}
            dangerouslySetInnerHTML={{ __html: safeHtml }}
        />
    )
}
