"use client"

import React, { useMemo } from "react"
import { cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link LayoutWidget}. */
export interface LayoutWidgetProps extends WithClassNames<undefined> {
    /** Raw HTML layout-mockup source authored inside a ```layout fence. */
    html: string
}

/**
 * Strips active content from author-supplied HTML before it is injected via
 * `dangerouslySetInnerHTML`. Removes `<script>`/`<iframe>` elements, inline `on*=`
 * event-handler attributes, and `javascript:` URLs so a layout mockup can only paint
 * static markup. Deliberately minimal (no new dependency) — the input is trusted-author
 * lesson content, this is a defense-in-depth scrub, not a full sanitizer.
 * @param html - Raw HTML string from the fenced `layout` block.
 * @returns Sanitized HTML safe to render inline.
 */
const sanitizeLayoutHtml = (html: string): string =>
    html
        // Drop <script>…</script> blocks entirely (including their content).
        .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, "")
        // Drop any stray opening/closing <script> tags left without a pair.
        .replace(/<\/?script\b[^>]*>/gi, "")
        // Drop <iframe>…</iframe> blocks and any stray iframe tags.
        .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe\s*>/gi, "")
        .replace(/<\/?iframe\b[^>]*>/gi, "")
        // Strip inline event-handler attributes (onclick=, onload=, …), quoted or bare.
        .replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
        // Neutralize javascript: URLs in any remaining attribute value.
        .replace(/javascript:/gi, "")

/**
 * Renders an author-embedded HTML layout mockup inline within lesson markdown.
 *
 * Presentational: sanitizes the supplied HTML (see {@link sanitizeLayoutHtml}) and paints it
 * via `dangerouslySetInnerHTML` inside a bordered, rounded surface that works in light and
 * dark mode. `not-prose` keeps the prose typography from leaking into the mockup. Marked
 * `"use client"` so it pairs with the client-rendered markdown tree.
 * @param props - {@link LayoutWidgetProps}
 */
export const LayoutWidget = ({ html, className }: LayoutWidgetProps) => {
    // Memoize the scrub so re-renders don't re-run the regex passes over the same source.
    const safeHtml = useMemo(() => sanitizeLayoutHtml(html), [html])
    return (
        <div
            className={cn("not-prose overflow-hidden rounded-xl border border-default bg-surface", className)}
            dangerouslySetInnerHTML={{ __html: safeHtml }}
        />
    )
}
