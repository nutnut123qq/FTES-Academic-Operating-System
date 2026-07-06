"use client"

import DOMPurify from "dompurify"
import React, { useEffect, useState } from "react"
import { cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link LayoutWidget}. */
export interface LayoutWidgetProps extends WithClassNames<undefined> {
    /** Raw HTML layout-mockup source authored inside a ```layout fence. */
    html: string
}

/**
 * Renders an author-embedded HTML layout mockup inline within lesson markdown.
 *
 * The raw fence HTML is sanitized with DOMPurify (a real DOM-based sanitizer, not a regex scrub —
 * the previous hand-rolled `replace()` chain was bypassable, e.g. `<img/onerror=...>`, allowing
 * stored XSS from author markdown). DOMPurify only runs in the browser, so sanitation happens in an
 * effect after mount: the server and first client paint render an empty surface, then the sanitized
 * markup is injected client-side. Marked `"use client"` so it pairs with the client-rendered
 * markdown tree.
 * @param props - {@link LayoutWidgetProps}
 */
export const LayoutWidget = ({ html, className }: LayoutWidgetProps) => {
    const [safeHtml, setSafeHtml] = useState("")

    // DOMPurify needs a real DOM → sanitize client-side only. Re-run when the source changes.
    useEffect(() => {
        setSafeHtml(DOMPurify.sanitize(html))
    }, [html])

    return (
        <div
            className={cn("not-prose overflow-hidden rounded-xl border border-default bg-surface", className)}
            dangerouslySetInnerHTML={{ __html: safeHtml }}
        />
    )
}
