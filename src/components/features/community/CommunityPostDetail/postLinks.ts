/** Fenced (```…```) and inline (`…`) code — links inside code are quotes, not links. */
const CODE_BLOCK_PATTERN = /```[\s\S]*?```|`[^`\n]*`/g

/** A bare http(s) url; stops before the characters that usually close/punctuate it. */
const URL_PATTERN = /https?:\/\/[^\s<>()[\]"'`]+/

/** Trailing punctuation people type after a url ("… xem tại https://x.vn.") is not part of it. */
const TRAILING_PUNCTUATION = /[.,;:!?»”)\]]+$/

/**
 * Unwraps CommonMark autolinks written as `<https://…>` into the bare url, so the
 * rendered post reads `https://…` instead of carrying the authored angle brackets
 * into the visible link text.
 *
 * (Both forms already become a real `<a>` through the shared markdown renderer —
 * `<…>` is a CommonMark autolink, a bare url is a `remark-gfm` autolink-literal —
 * so this is about the TEXT, not about making the link clickable. Any surface that
 * prints the body as plain text needs it too.)
 *
 * Markdown links (`[text](url)`) and code blocks are left untouched.
 *
 * @param markdown - raw post body.
 */
export const unwrapAutolinks = (markdown: string): string =>
    markdown.replace(/<(https?:\/\/[^\s<>]+)>/g, "$1")

/**
 * First link in a post body — the one the preview card unfurls (one card per post,
 * like F8/Facebook). Looks at prose only: code fences and inline code are blanked
 * out first, and markdown-link targets `](url)` count as prose links.
 *
 * @param markdown - raw post body.
 * @returns the url, or null when the post has no link.
 */
export const firstLinkUrl = (markdown: string): string | null => {
    const prose = markdown.replace(CODE_BLOCK_PATTERN, " ")
    const match = URL_PATTERN.exec(prose)
    if (!match) {
        return null
    }
    const url = match[0].replace(TRAILING_PUNCTUATION, "")
    return url.length > "https://".length ? url : null
}
