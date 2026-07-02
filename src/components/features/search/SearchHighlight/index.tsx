import React from "react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link SearchHighlight}. */
export interface SearchHighlightProps extends WithClassNames<undefined> {
    /** The full text to render. */
    text: string
    /** The query whose first case-insensitive match is wrapped in `<mark>`. */
    query: string
}

/** Escape regex metacharacters so the query is matched literally. */
const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

/**
 * Renders `text` with the first case-insensitive occurrence of `query` wrapped in a
 * semantic `<mark>` (token-styled accent highlight). Empty/whitespace query renders
 * the text verbatim. Shared by titles and snippets on both search surfaces.
 * @param props - the text, the query, and an optional class name.
 */
export const SearchHighlight = ({ text, query, className }: SearchHighlightProps) => {
    const trimmed = query.trim()
    if (!trimmed) return <span className={className}>{text}</span>

    const match = text.match(new RegExp(escapeRegExp(trimmed), "i"))
    if (!match || match.index === undefined) return <span className={className}>{text}</span>

    const start = match.index
    const end = start + match[0].length
    return (
        <span className={className}>
            {text.slice(0, start)}
            <mark className="rounded bg-accent/20 px-0.5 text-accent">{text.slice(start, end)}</mark>
            {text.slice(end)}
        </span>
    )
}
