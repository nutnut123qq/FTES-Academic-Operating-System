/**
 * TeX math inside markdown: the scanner that finds `$…$` / `$$…$$` and the rehype
 * transformer that turns what it finds into the two custom tags {@link MATH_TAG_NAMES}
 * the renderer map paints with KaTeX.
 *
 * **Why hand-written and not `remark-math`.** The typeset markup never travels through the
 * markdown tree here: a math node carries the TeX *source* as a plain-text attribute and
 * KaTeX runs at RENDER time inside one component. That keeps the sanitize surface at two
 * tags and one text attribute instead of the ~40 classes, MathML tags and inline `style`
 * rules `rehype-katex`'s output forces a schema to whitelist (see the schema note in
 * `./index`). It also needs no new package: `katex` itself is already in the tree.
 *
 * **The scanner is deliberately timid.** `$` is a perfectly ordinary character in prose —
 * prices ("$5 and $10"), shell snippets, variable names — and the overwhelming majority of
 * content on this site has no math in it at all. So every rule below exists to make a
 * FALSE POSITIVE hard, at the cost of missing some exotic true positives:
 *
 * - an opener may not sit right after a letter or digit (`US$100` never opens math),
 * - `$…$` may not open on whitespace nor close on whitespace (`$5 and $10` cannot close),
 * - inline math may not span a line break, and may not contain another `$`,
 * - a closer may not be followed by a digit (`$5$10` stays money),
 * - a backslash-escaped `\$` neither opens nor closes, and is passed through untouched.
 *
 * {@link splitMath} is total and lossless: the text tokens it emits, plus the delimiters it
 * consumed, re-form the input exactly — so a string with no math comes back as ONE text
 * token identical to the input, which is what "content without math renders exactly as it
 * did" means in a test.
 */

/** The two custom tag names a math node becomes; the sanitize schema allows exactly these. */
export const MATH_TAG_NAMES = ["inlinemath", "blockmath"] as const

/** The one attribute a math tag carries: the TeX source, as plain text. */
export const MATH_TEX_ATTRIBUTE = "tex"

/** One piece of a scanned string: literal prose, or a formula with its TeX source. */
export interface MathToken {
    /** `text` = pass through verbatim; `inline`/`display` = typeset `value` as TeX. */
    type: "text" | "inline" | "display"
    /** The prose, or the TeX source WITHOUT its `$` delimiters. */
    value: string
}

/** A delimiter run the scanner accepted: the TeX inside it and where it ended. */
interface MathMatch {
    /** TeX source between the delimiters. */
    value: string
    /** Index just past the closing delimiter. */
    end: number
}

/** Letters and digits — an opener directly after one of these is currency, not math. */
const isWordCharacter = (character: string | undefined): boolean =>
    character !== undefined && /[0-9A-Za-z]/.test(character)

/** Space, tab or newline — `$ x$` / `$x $` are not math (the CommonMark-ish rule). */
const isSpace = (character: string | undefined): boolean =>
    character !== undefined && /\s/.test(character)

/**
 * Tries to read `$…$` starting at `start`.
 *
 * @param input - The whole string being scanned.
 * @param start - Index of the candidate opening `$`.
 * @returns The match, or `null` when any of the timidity rules above rejects it.
 */
const matchInline = (input: string, start: number): MathMatch | null => {
    if (isWordCharacter(input[start - 1])) {
        return null
    }
    const first = input[start + 1]
    if (first === undefined || first === "$" || isSpace(first)) {
        return null
    }
    for (let cursor = start + 1; cursor < input.length; cursor += 1) {
        const character = input[cursor]
        if (character === "\n") {
            // Inline math never spans a line break: allowing it turns "$5\nand $6" into a
            // formula that swallows a whole paragraph.
            return null
        }
        if (character === "\\") {
            // An escaped delimiter: skip the pair so `\$` can never close the run.
            cursor += 1
            continue
        }
        if (character !== "$") {
            continue
        }
        if (isSpace(input[cursor - 1]) || /[0-9]/.test(input[cursor + 1] ?? "")) {
            // Cannot close here, and inline math may not contain a bare `$`, so the whole
            // candidate fails rather than hunting for a later closer.
            return null
        }
        return { value: input.slice(start + 1, cursor), end: cursor + 1 }
    }
    return null
}

/**
 * Tries to read `$$…$$` starting at `start`. Display math MAY span lines — that is its
 * whole point — so the only rules are a non-word character before it and a non-blank body.
 *
 * @param input - The whole string being scanned.
 * @param start - Index of the first `$` of the candidate `$$`.
 * @returns The match, or `null`.
 */
const matchDisplay = (input: string, start: number): MathMatch | null => {
    if (isWordCharacter(input[start - 1])) {
        return null
    }
    const close = input.indexOf("$$", start + 2)
    if (close < 0) {
        return null
    }
    const value = input.slice(start + 2, close)
    if (value.trim().length === 0) {
        return null
    }
    return { value, end: close + 2 }
}

/**
 * Splits a string into prose and formulas.
 *
 * @param input - Raw text (one markdown text node, or a whole string in a test).
 * @returns The tokens in order; a string with no math yields a single `text` token equal
 *   to `input` (and an empty string yields no tokens at all).
 */
export const splitMath = (input: string): Array<MathToken> => {
    const tokens: Array<MathToken> = []
    let prose = ""
    let cursor = 0

    /** Flushes the prose accumulated so far, if any. */
    const flush = (): void => {
        if (prose.length > 0) {
            tokens.push({ type: "text", value: prose })
            prose = ""
        }
    }

    while (cursor < input.length) {
        const character = input[cursor]
        if (character === "\\" && input[cursor + 1] === "$") {
            // Passed through as authored — both characters — so nothing about non-math
            // content changes just because this scanner ran over it.
            prose += input.slice(cursor, cursor + 2)
            cursor += 2
            continue
        }
        if (character !== "$") {
            prose += character
            cursor += 1
            continue
        }
        const isDisplay = input[cursor + 1] === "$"
        const match = isDisplay ? matchDisplay(input, cursor) : matchInline(input, cursor)
        if (!match) {
            prose += character
            cursor += 1
            continue
        }
        flush()
        tokens.push({ type: isDisplay ? "display" : "inline", value: match.value })
        cursor = match.end
    }

    flush()
    return tokens
}

/** Whether a string holds anything the scanner would typeset — cheap pre-check. */
export const hasMath = (input: string): boolean =>
    splitMath(input).some((token) => token.type !== "text")

/** The loose hast shape this transformer walks. */
interface MathTreeNode {
    type?: string
    tagName?: string
    value?: string
    properties?: Record<string, unknown>
    children?: Array<MathTreeNode>
}

/**
 * Subtrees the scanner must not enter.
 *
 * `code`/`pre` are the whole reason this list exists: a `$` in a shell snippet or a code
 * sample is not maths, and (unlike in mdast, where code is its own node type) in hast it is
 * plain text inside an element. `script`/`style` hold text that is not prose at all — they
 * are stripped by sanitize anyway, but nothing here should be the thing that depends on
 * that. The math tags themselves are skipped so a second pass is a no-op.
 */
const OPAQUE_TAGS = new Set<string>(["code", "pre", "script", "style", ...MATH_TAG_NAMES])

/**
 * Builds the hast element a formula becomes.
 *
 * @param token - A scanned `inline`/`display` token.
 * @returns The element to splice in, carrying the TeX source and nothing else.
 */
const toMathNode = (token: MathToken): MathTreeNode => ({
    type: "element",
    tagName: token.type === "display" ? MATH_TAG_NAMES[1] : MATH_TAG_NAMES[0],
    properties: { [MATH_TEX_ATTRIBUTE]: token.value },
    children: [],
})

/**
 * Rewrites every text node of the tree into prose + math elements.
 *
 * @param node - The node whose children are being rewritten.
 */
const applyMath = (node: MathTreeNode): void => {
    if (!Array.isArray(node.children)) {
        return
    }
    let rewritten: Array<MathTreeNode> | null = null
    for (let position = 0; position < node.children.length; position += 1) {
        const child = node.children[position]
        if (child.type !== "text" || typeof child.value !== "string") {
            if (!(child.tagName && OPAQUE_TAGS.has(child.tagName))) {
                applyMath(child)
            }
            rewritten?.push(child)
            continue
        }
        const tokens = splitMath(child.value)
        if (tokens.every((token) => token.type === "text")) {
            rewritten?.push(child)
            continue
        }
        // First hit in this parent: copy what was walked past before splicing.
        rewritten ??= node.children.slice(0, position)
        for (const token of tokens) {
            rewritten.push(
                token.type === "text" ? { type: "text", value: token.value } : toMathNode(token),
            )
        }
    }
    if (rewritten) {
        node.children = rewritten
    }
}

/**
 * rehype transformer: turn `$…$` / `$$…$$` into the math tags the renderer map typesets.
 *
 * **Why rehype and not remark.** Half the exam statements on this site are stored as HTML
 * (the admin rich-text editor), and remark parks raw HTML in a single opaque `html` node —
 * a remark-stage scanner simply never sees the formulas inside `<p>…</p>`. By the hast
 * stage `rehype-raw` has turned that HTML into real elements with real text nodes, so ONE
 * pass here covers both the markdown and the HTML branch.
 *
 * That places it after `rehype-raw` and BEFORE `rehype-sanitize` (see `./index`), which is
 * the safe order: sanitize still gets the last word over the entire tree, and what it sees
 * from this plugin is two tag names carrying one text attribute.
 *
 * Opt-in per surface (`MarkdownContent math`), never global — see the prop's docblock.
 * @returns The unified transformer.
 */
export const rehypeMath = () => (tree: unknown): void => {
    applyMath(tree as MathTreeNode)
}
