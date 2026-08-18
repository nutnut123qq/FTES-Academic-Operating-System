"use client"

import React, { useMemo } from "react"
import katex from "katex"
import { cn } from "@heroui/react"

/**
 * KaTeX options used for EVERY formula on the site — one object so no call site can quietly
 * loosen them.
 *
 * - `throwOnError: false` — an exam page is user-submitted content. A typo in one formula
 *   must colour that formula red, never blank the page it lives on.
 * - `trust: false` (the default, pinned because it is the security-relevant one) — refuses
 *   the commands that can emit markup or fetch: `\href`, `\url`, `\includegraphics`,
 *   `\htmlClass`/`\htmlData`/`\htmlStyle`. With it off, KaTeX output is text and geometry;
 *   there is no path from the TeX source to an attacker-chosen URL or attribute.
 * - `maxSize: 50` (em) and `maxExpand: 1000` — cap `\rule{9999em}{9999em}` and macro
 *   expansion bombs, i.e. the two ways a hostile formula can hurt the READER rather than
 *   the page.
 * - `strict: false` — unknown-but-harmless input (a Unicode glyph, a `\newline`) warns
 *   instead of refusing; the alternative is a console full of noise on real exam scans.
 */
const KATEX_OPTIONS = {
    throwOnError: false,
    trust: false,
    strict: false as const,
    maxSize: 50,
    maxExpand: 1000,
}

/**
 * Typesets TeX to a KaTeX HTML string.
 *
 * Exported for the unit test, which asserts on the markup KaTeX produces rather than on a
 * component's rendered output — the interesting contract (it typeset, it did not throw, it
 * escaped what it was given) is entirely in the string.
 *
 * @param tex - TeX source, without `$` delimiters.
 * @param display - `true` for display math (`$$…$$`), centred on its own line.
 * @returns KaTeX markup, or `""` when KaTeX refused outright.
 */
export const renderTexToHtml = (tex: string, display: boolean): string => {
    try {
        return katex.renderToString(tex, { ...KATEX_OPTIONS, displayMode: display })
    } catch {
        // `throwOnError: false` already handles bad TeX; this is the belt for anything else
        // (a KaTeX internal error), where showing the source beats showing nothing.
        return ""
    }
}

/** Props for {@link MathFormula}. */
export interface MathFormulaProps {
    /** TeX source, without its `$` delimiters. */
    tex: string
    /** Display math: centred, on its own line, and allowed to scroll sideways. */
    display?: boolean
    /** Extra classes for the wrapper. */
    className?: string
}

/**
 * One typeset formula.
 *
 * **On `dangerouslySetInnerHTML`.** The HTML here is not content — it is KaTeX's own output,
 * generated in this component from a plain-text TeX attribute that never contained markup
 * (the scanner in `../math` only ever hands over the characters between two `$`). KaTeX
 * escapes everything it echoes and, with `trust: false`, emits no `href`, no `src` and no
 * caller-chosen attributes, so there is nothing an author can write between two dollar
 * signs that becomes an element or a URL. Rendering it as a string is also how
 * `rehype-katex` works; the difference is that here the string is built at render time and
 * therefore never has to survive (or be exempted from) the sanitize step.
 *
 * A formula KaTeX cannot typeset at all falls back to its own source in a `<code>`, which
 * is exactly what the reader saw before this feature existed.
 *
 * @param props - {@link MathFormulaProps}
 */
export const MathFormula = ({ tex, display = false, className }: MathFormulaProps) => {
    const html = useMemo(() => renderTexToHtml(tex, display), [tex, display])

    if (html.length === 0) {
        return <code className={cn("rounded bg-default px-1 text-sm", className)}>{tex}</code>
    }

    return (
        <span
            // A long equation SCROLLS rather than widening the sheet: an exam page is a
            // fixed-width column and a runaway `\begin{array}` would otherwise push the
            // paging carets off the frame.
            className={cn(display && "my-3 block overflow-x-auto text-center", className)}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    )
}
