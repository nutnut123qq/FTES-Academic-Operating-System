"use client"

import React from "react"
import useSWR from "swr"
import { evaluate } from "@mdx-js/mdx"
import * as runtime from "react/jsx-runtime"
import remarkGfm from "remark-gfm"
import { cn, Spinner } from "@heroui/react"
import { heroUiMdxComponents } from "../mdxComponents"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Compiled MDX module exposes its content as the default export. */
type MdxContentComponent = React.ComponentType<{
    components?: Record<string, React.ElementType>
    className?: string
}>

/** Props for {@link RenderReactComponent}. */
export interface RenderReactComponentProps extends WithClassNames<undefined> {
    /** JSX/MDX source (a self-contained renderable expression, no imports/logic). */
    code: string
}

/**
 * Renders a ` ```mdx ` snippet as a REAL React tree — render ONLY, no tabs.
 *
 * Compiles the snippet with `@mdx-js/mdx` `evaluate()` (client-side, cached per-source via SWR)
 * and renders it with the full HeroUI map ({@link heroUiMdxComponents}). Used standalone (a live
 * preview) and as the `:::preview` pane of a `:::tab` block — so the surrounding {@link
 * CodePreviewTabs} owns the tabs and this never nests a tab inside a tab. `"use client"` for the
 * browser-side `evaluate()`.
 *
 * On a compile error the raw snippet is shown verbatim (safe fallback) instead of crashing.
 * @param props - {@link RenderReactComponentProps}
 */
export const RenderReactComponent = ({ code, className }: RenderReactComponentProps) => {
    const { data: Content, error } = useSWR(
        `mdx:${code}`,
        async () => {
            const compiled = await evaluate(code, {
                ...runtime,
                remarkPlugins: [remarkGfm],
            })
            return compiled.default as MdxContentComponent
        },
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
        },
    )

    if (error) {
        return (
            <pre className={cn("not-prose overflow-auto rounded-xl border border-danger/40 bg-default/40 p-3 font-mono text-xs text-muted", className)}>
                {code}
            </pre>
        )
    }
    if (!Content) {
        return <Spinner size="sm" aria-label="Rendering" className={cn(className)} />
    }
    return <Content components={heroUiMdxComponents} className={className} />
}
