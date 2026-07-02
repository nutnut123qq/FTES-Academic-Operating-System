"use client"

import React, {
    useEffect,
    useState,
} from "react"
import { cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link PreviewFrame}. */
export interface PreviewFrameProps extends WithClassNames<undefined> {
    /** Learner HTML body markup. */
    html: string
    /** Learner CSS. */
    css: string
    /** Learner JS. */
    js: string
    /** Accessible iframe title (screen-reader name for the live preview). */
    title: string
    /** Debounce in ms before rebuilding `srcDoc` (default ~400ms). */
    debounceMs?: number
}

/**
 * Composes `{html, css, js}` into a sandboxed `srcDoc` document.
 * `sandbox="allow-scripts"` WITHOUT `allow-same-origin` → learner JS runs but cannot
 * read the parent origin's `localStorage`/cookies.
 */
const composeSrcDoc = (html: string, css: string, js: string): string =>
    `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${html}<script>${js}<\/script></body></html>`

/**
 * Live sandboxed preview. Rebuilds the iframe `srcDoc` on a debounce (default 400ms)
 * after the learner stops typing, so consecutive keystrokes do not reload per-char.
 * The iframe is `sandbox="allow-scripts"` (NO `allow-same-origin`) so learner scripts
 * are isolated from the app origin.
 *
 * @param props - {@link PreviewFrameProps}
 */
export const PreviewFrame = ({
    html,
    css,
    js,
    title,
    debounceMs = 400,
    className,
}: PreviewFrameProps) => {
    const [srcDoc, setSrcDoc] = useState(() => composeSrcDoc(html, css, js))

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setSrcDoc(composeSrcDoc(html, css, js))
        }, debounceMs)
        return () => window.clearTimeout(timer)
    }, [html, css, js, debounceMs])

    return (
        <iframe
            title={title}
            srcDoc={srcDoc}
            // allow-scripts only — NO allow-same-origin (learner JS cannot touch app origin).
            sandbox="allow-scripts"
            className={cn("size-full border-0 bg-white", className)}
        />
    )
}
