/**
 * Title ⇄ body helpers for the single-editor composers.
 *
 * The post/blog/announcement composers no longer show a SEPARATE title input:
 * the author types everything into ONE {@link RichTextEditor}, and the title is
 * the leading H1 (`# …`) they mark. The BE contract is unchanged — those write
 * endpoints still take a `title` string PLUS a `content` body — so on submit we
 * DERIVE the title from the Markdown here and STRIP that leading H1 from the
 * `content` we send (stored title + body stay separate, so the feed/detail never
 * renders the title twice). Editing round-trips the other way: the stored `title`
 * is re-joined onto `content` as an H1 so the author edits both in one editor.
 *
 * Pure string helpers (no Tiptap/DOM), so they unit-test in isolation.
 */

/**
 * Cap for a derived title. The BE `title` is a short label (feed card / detail
 * heading / list row), so a runaway first line must not become the whole title.
 */
export const DERIVED_TITLE_MAX = 120

/**
 * Strip the inline Markdown marks Tiptap emits (`**`, `*`, `__`, `_`, `` ` ``,
 * `~~`, links, images) so a title derived from formatted text is PLAIN text —
 * the BE `title` is rendered raw, never through `MarkdownContent`.
 * @param text - a single line of Markdown.
 * @returns the same line with inline marks removed and trimmed.
 */
const stripInlineMarks = (text: string): string =>
    text
        // image ![alt](url) → alt  (before the link rule, which would eat the alt)
        .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
        // link [label](url) → label
        .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
        // bold / italic / strike / inline-code delimiters
        .replace(/(\*\*|__|~~|\*|_|`)/g, "")
        .trim()

/**
 * Strip a leading BLOCK marker (ATX heading `#…`, blockquote `>`, bullet/ordered
 * list) from a line so a FALLBACK title (first line, no leading H1) reads as
 * plain text rather than carrying Markdown punctuation into the BE `title`.
 * @param line - a single line of Markdown.
 */
const stripLeadingBlockMarker = (line: string): string =>
    line.replace(/^\s{0,3}(#{1,6}[ \t]+|>[ \t]?|[-*+][ \t]+|\d+[.)][ \t]+)/, "")

/** Result of {@link splitTitleFromMarkdown}. */
export interface TitleSplit {
    /** Plain-text title — the leading H1's text, or `""` when the author marked none. */
    title: string
    /** Markdown body to store: the leading H1 line removed (whole text when there was none). */
    body: string
}

/** Options for {@link splitTitleFromMarkdown}. */
export interface SplitTitleOptions {
    /**
     * Promote the first non-empty line to the title when there is NO leading H1.
     *
     * Off by default, and that default is the point: with it on, the first line
     * ends up in BOTH `title` and `body`, and every surface that renders a title
     * above a body then shows the same line twice — which is exactly how a
     * one-line post came out as two.
     *
     * Turn it on ONLY where the write endpoint REJECTS a blank title (group
     * announcements — BE `@NotBlank`). There the duplicated line is the lesser
     * evil against a 400.
     */
    fallbackTitle?: boolean
}

/**
 * Split a composer's Markdown into a derived `title` and the `body` to store.
 *
 * - If the FIRST non-blank block is an H1 (`# …`), its text (inline marks
 *   stripped, capped at {@link DERIVED_TITLE_MAX}) becomes the title and that H1
 *   line is REMOVED from the body (leading blank lines after it collapsed).
 * - Otherwise the title is EMPTY and the body keeps the whole text. A short
 *   Threads-style post genuinely has no title, and inventing one from the first
 *   line renders it twice (see {@link SplitTitleOptions.fallbackTitle}).
 * - Empty/blank input yields an empty title and empty body.
 *
 * @param markdown - the raw Markdown from the editor.
 * @param options - {@link SplitTitleOptions}.
 * @returns the derived {@link TitleSplit}.
 */
export const splitTitleFromMarkdown = (
    markdown: string,
    { fallbackTitle = false }: SplitTitleOptions = {},
): TitleSplit => {
    const source = markdown ?? ""
    const lines = source.split("\n")

    // First non-blank line index.
    let first = 0
    while (first < lines.length && lines[first].trim() === "") {
        first += 1
    }
    if (first >= lines.length) {
        return { title: "", body: "" }
    }

    // A leading H1 is EXACTLY one `#` followed by whitespace (`## ` is an H2).
    const h1 = /^#[ \t]+(.+)$/.exec(lines[first].trimStart())
    if (h1) {
        const title = stripInlineMarks(h1[1]).slice(0, DERIVED_TITLE_MAX).trim()
        const rest = lines.slice(first + 1)
        while (rest.length > 0 && rest[0].trim() === "") {
            rest.shift()
        }
        return { title, body: rest.join("\n").replace(/\s+$/g, "") }
    }

    // No leading H1. The body is the WHOLE text either way; only the title differs.
    const body = source.replace(/\s+$/g, "")
    if (!fallbackTitle) {
        return { title: "", body }
    }
    // Opt-in fallback: first non-empty line as a plain-text title. This DOES duplicate that
    // line into the title, so only surfaces that cannot accept a blank title ask for it.
    const title = stripInlineMarks(stripLeadingBlockMarker(lines[first]))
        .slice(0, DERIVED_TITLE_MAX)
        .trim()
    return { title, body }
}

/**
 * Re-join a stored `title` + `body` into ONE Markdown value for the single
 * editor (edit round-trip). A non-empty title is prepended as an H1 so the
 * author edits it inline; {@link splitTitleFromMarkdown} reverses this on save.
 *
 * @param title - the stored plain-text title (may be empty).
 * @param body - the stored Markdown body (may be empty).
 * @returns Markdown with the title as a leading H1 when present.
 */
export const joinTitleIntoMarkdown = (title: string, body: string): string => {
    const heading = (title ?? "").trim()
    const rest = (body ?? "").replace(/^\s+/, "").replace(/\s+$/g, "")
    if (heading === "") {
        return rest
    }
    return rest === "" ? `# ${heading}` : `# ${heading}\n\n${rest}`
}
