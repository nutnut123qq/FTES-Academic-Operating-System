"use client"

import React, { type ReactNode } from "react"
import { Typography, cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Typography scale token (mirrors HeroUI `Typography` `type`). */
type TypographySize = React.ComponentProps<typeof Typography>["type"]
/** Typography color token (mirrors HeroUI `Typography` `color`). */
type TypographyColor = React.ComponentProps<typeof Typography>["color"]

/** Props for {@link RichText}. */
export interface RichTextProps extends WithClassNames<undefined> {
    /**
     * Raw text with a SMALL inline-markdown subset:
     * `` `code` `` · `**bold**` · `_italic_` · `[label](url)` · line breaks (`\n`).
     * Anything else renders as plain text — this is NOT a full markdown renderer.
     */
    text: string
    /** Typography scale; defaults to `"body-sm"`. */
    size?: TypographySize
    /** Typography color; defaults to the Typography default (omit for inherited). */
    color?: TypographyColor
}

/** One inline marker → its rendered node. `recurse` = re-parse the captured label (code never does). */
interface InlineRule {
    /** Pattern; capture 1 = label (capture 2 = href for the link rule). */
    re: RegExp
    /** Re-parse the captured label for nested markers (false = literal, e.g. code). */
    recurse: boolean
    /** Build the node from the match + already-rendered children. */
    render: (match: RegExpExecArray, children: ReactNode) => ReactNode
}

/** The supported inline markers, tried earliest-match-wins (ties: this order). */
const RULES: Array<InlineRule> = [
    {
        re: /`([^`]+)`/,
        recurse: false,
        render: (match) => (
            <code className="rounded-md bg-default px-1.5 py-0.5 font-mono text-[0.9em] text-accent">
                {match[1]}
            </code>
        ),
    },
    {
        re: /\*\*([^*]+)\*\*/,
        recurse: true,
        render: (match, children) => (
            <strong className="font-semibold text-foreground">{children}</strong>
        ),
    },
    {
        re: /\[([^\]]+)\]\(([^)\s]+)\)/,
        recurse: true,
        render: (match, children) => (
            <a
                href={match[2]}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
            >
                {children}
            </a>
        ),
    },
    {
        re: /_([^_]+)_/,
        recurse: true,
        render: (match, children) => <em>{children}</em>,
    },
]

/** Render plain text, turning `\n` into `<br/>`. */
const renderText = (text: string): ReactNode => {
    if (!text) {
        return null
    }
    const lines = text.split("\n")
    return lines.map((line, index) => (
        <React.Fragment key={index}>
            {index > 0 ? <br /> : null}
            {line}
        </React.Fragment>
    ))
}

/**
 * Render the inline-markdown subset to React nodes: find the earliest marker, split
 * `before | marker | after`, render the marker, and recurse on `after` (and on the
 * marker's label unless it is a literal code span). No marker left → plain text.
 */
const renderInline = (text: string): ReactNode => {
    let best: { rule: InlineRule, match: RegExpExecArray } | null = null
    for (const rule of RULES) {
        const match = rule.re.exec(text)
        if (match && (!best || match.index < best.match.index)) {
            best = { rule, match }
        }
    }
    if (!best) {
        return renderText(text)
    }
    const { rule, match } = best
    const before = text.slice(0, match.index)
    const after = text.slice(match.index + match[0].length)
    const children = rule.recurse ? renderInline(match[1]) : match[1]
    return (
        <>
            {renderText(before)}
            {rule.render(match, children)}
            {renderInline(after)}
        </>
    )
}

/**
 * Lightweight rich-text typography — a tiny inline-markdown renderer for short copy
 * (titles, descriptions, captions) where {@link import("../MarkdownContent").MarkdownContent}
 * (full react-markdown + remark plugins, block elements) is overkill.
 *
 * Renders ONLY a small inline subset (`code` · **bold** · _italic_ · `[link](url)` ·
 * line breaks) inside one HeroUI `Typography`, so it carries the house type scale via
 * `size` and merges `className`. Presentational, no data/i18n.
 * @param props - {@link RichTextProps}
 */
export const RichText = ({ text, size = "body-sm", color, className }: RichTextProps) => {
    return (
        <Typography type={size} color={color} className={cn(className)}>
            {renderInline(text)}
        </Typography>
    )
}
