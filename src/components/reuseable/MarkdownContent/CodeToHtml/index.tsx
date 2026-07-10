"use client"

import React, { useEffect, useRef, useState } from "react"
import { codeToHtml } from "shiki"
import { cn } from "@heroui/react"
import { SnippetIcon } from "../../SnippetIcon"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link CodeToHtml}. */
export interface CodeToHtmlProps extends WithClassNames<undefined> {
    /** Source code to highlight. */
    code: string
    /** Shiki language id (e.g. `bash`, `ts`). */
    language: string
    /** Shiki theme id resolved from the app theme. */
    theme: string
}

/**
 * Converts a code block to highlighted HTML using Shiki.
 *
 * Presentational: runs Shiki in a `useEffect` and stores the resulting HTML in local state;
 * no business logic. Marked `"use client"` for the browser-side highlighter.
 *
 * PERF: highlighting is LAZY — only run Shiki when the block scrolls near the viewport
 * (IntersectionObserver). A long article with 20+ blocks won't highlight all at once on load
 * (Shiki/WASM is heavy); off-screen blocks show raw code (`<pre>`) until scrolled into view.
 * @param props - {@link CodeToHtmlProps}
 */
export const CodeToHtml = ({ code, language, theme, className }: CodeToHtmlProps) => {
    const containerRef = useRef<HTMLDivElement>(null)
    /** Whether the block has entered (near) the viewport yet — only then do we highlight. */
    const [isVisible, setIsVisible] = useState(false)
    /** Highlighted HTML; `null` keeps the raw `<pre>` fallback. */
    const [html, setHtml] = useState<string | null>(null)

    useEffect(() => {
        const el = containerRef.current
        if (!el || isVisible) {
            return
        }
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) {
                    setIsVisible(true)
                    observer.disconnect()
                }
            },
            // rootMargin: start highlighting 300px before the block enters the screen.
            { rootMargin: "300px" },
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [isVisible])

    // Run Shiki via useEffect (no SWR) directly client-side once the block is visible.
    // Changing code/language/theme must re-highlight. `cancelled` blocks setState after unmount /
    // when deps change mid-flight (avoids writing stale HTML over newer HTML).
    useEffect(() => {
        if (!isVisible) {
            return
        }
        let cancelled = false
        codeToHtml(code, { lang: language, theme })
            .then((out) => {
                if (!cancelled) {
                    setHtml(out)
                }
            })
            .catch((error) => {
                // Shiki error (lang/theme/WASM…): keep the raw `<pre>` fallback + log for debugging.
                console.error("CodeToHtml: shiki highlight failed", error)
            })
        return () => {
            cancelled = true
        }
    }, [isVisible, code, language, theme])

    return (
        <div ref={containerRef} className={cn("w-full max-w-full overflow-hidden rounded-xl border border-default bg-background", className)}>
            {/* slim header: language label (left) + copy (right) — orients long lessons with many snippets */}
            <div className="flex items-center justify-between border-b border-default px-3 py-2">
                <span className="font-mono text-xs uppercase text-muted">{language}</span>
                <SnippetIcon copyString={code} />
            </div>
            {html ? (
                <div
                    className="overflow-x-auto p-3 text-sm [&_pre]:!whitespace-pre [&_pre]:!bg-transparent [&_pre]:!p-0"
                    dangerouslySetInnerHTML={{ __html: html }}
                />
            ) : (
                /* Fallback: always show raw code while Shiki hasn't finished / on error (avoids an empty box). */
                <pre className="overflow-x-auto p-3 text-sm">
                    <code>{code}</code>
                </pre>
            )}
        </div>
    )
}
