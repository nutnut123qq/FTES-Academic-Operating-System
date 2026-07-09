"use client"

import DOMPurify from "dompurify"
import { useEffect, useState } from "react"

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
            className="flex flex-col gap-3 leading-relaxed text-foreground [&_a]:break-words [&_a]:text-accent [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mt-1"
            dangerouslySetInnerHTML={{ __html: safeHtml }}
        />
    )
}
