import React from "react"
import { render } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

/**
 * The post body ↔ markdown renderer contract — the pipeline `CommunityPostContent` runs.
 *
 * The bug: a post whose body was `<https://gemini…>![Ảnh](…)![Ảnh](…)` rendered as a run of
 * LINKS reading `https://gemini…![Ảnh](https://document.ftes.vn/…webp)…` instead of the two
 * photos. The detail page pre-processed the body with `unwrapAutolinks` before handing it to
 * `MarkdownContent`; the angle brackets it stripped are what TERMINATE a CommonMark autolink,
 * and `remark-gfm`'s autolink-literal extension then kept consuming (`!`, `[`, `]` are legal
 * url characters and GFM balances parens) until the whole line was one link.
 *
 * So these tests pin the rule: NOTHING rewrites the body before the parser sees it.
 */

vi.mock("next-themes", () => ({ useTheme: () => ({ theme: "light" }) }))
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }))
vi.mock("@heroui/react", () => ({ cn: (...a: Array<unknown>) => a.filter(Boolean).join(" ") }))
// react-markdown's DEFAULT renderers (native <img>/<a>) — the parse is what is under test,
// not the app's figure/caption map (which also renders a plain <img>, see MarkdownContent/map).
vi.mock("@/components/reuseable/MarkdownContent/map", () => ({ buildMarkdownRenderers: () => ({}) }))
vi.mock("@/components/reuseable/MarkdownContent/CodeToHtml", () => ({}))
vi.mock("@/components/reuseable/MarkdownContent/LayoutWidget", () => ({}))
vi.mock("@/components/reuseable/MarkdownContent/MermaidDiagram", () => ({}))

import { MarkdownContent } from "@/components/reuseable/MarkdownContent"
import { unwrapAutolinks } from "./postLinks"

/**
 * The reported body, in the shape the composer actually writes it: `tiptap-markdown` hands
 * link serialization to `prosemirror-markdown`, which emits `<href>` for a link whose text IS
 * its href (`isPlainURL`), and the toolbar's image node is INLINE (`Image.configure({ inline: true })`)
 * so `![Ảnh](…)` lands in the same paragraph with no separator. Valid CommonMark, both parts.
 */
const REPORTED_BODY = "<https://gemini.google.com/app?hl=vi>"
    + "![Ảnh](https://document.ftes.vn/ftes/community/1740000000-a.webp)"
    + "![Ảnh](https://document.ftes.vn/ftes/community/1740000001-b.webp)"

describe("post body → MarkdownContent", () => {
    it("renders the reported body as images, not as one swallowed link", () => {
        const { container } = render(<MarkdownContent markdown={REPORTED_BODY} />)
        const images = Array.from(container.querySelectorAll("img"))
        expect(images.map((img) => img.getAttribute("src"))).toEqual([
            "https://document.ftes.vn/ftes/community/1740000000-a.webp",
            "https://document.ftes.vn/ftes/community/1740000001-b.webp",
        ])
        // The link is still a link — and only the gemini url, not the image markdown behind it.
        const links = Array.from(container.querySelectorAll("a"))
        expect(links.map((a) => a.getAttribute("href"))).toEqual(["https://gemini.google.com/app?hl=vi"])
        expect(container.textContent).not.toContain("![Ảnh]")
    })

    /**
     * The mechanism, kept executable: this is EXACTLY what the removed pre-pass did. If someone
     * reintroduces a rewrite between the body and the parser, this is what they get back.
     */
    it("loses every image once the autolink's closing bracket is stripped (the old pre-pass)", () => {
        const naivelyUnwrapped = REPORTED_BODY.replace(/<(https?:\/\/[^\s<>]+)>/g, "$1")
        const { container } = render(<MarkdownContent markdown={naivelyUnwrapped} />)
        expect(container.querySelectorAll("img")).toHaveLength(0)
        expect(container.textContent).toContain("![Ảnh]")
    })

    it("shows an autolink WITHOUT its angle brackets, so nothing needs unwrapping first", () => {
        const { container } = render(<MarkdownContent markdown="<https://ftes.vn/a>" />)
        const link = container.querySelector("a")
        expect(link?.getAttribute("href")).toBe("https://ftes.vn/a")
        expect(link?.textContent).toBe("https://ftes.vn/a")
        expect(container.textContent).not.toContain("<")
    })

    it("still autolinks a bare url followed by prose", () => {
        const { container } = render(<MarkdownContent markdown="Xem tại https://ftes.vn/a nhé" />)
        const link = container.querySelector("a")
        expect(link?.getAttribute("href")).toBe("https://ftes.vn/a")
        expect(container.textContent).toBe("Xem tại https://ftes.vn/a nhé")
    })

    it("leaves a url inside code as code, not as a link", () => {
        const { container } = render(
            <MarkdownContent markdown={"gõ `<https://a.vn>` để tạo link\n\n```\n<https://b.vn>\n```"} />,
        )
        expect(container.querySelectorAll("a")).toHaveLength(0)
        expect(container.querySelector("code")?.textContent).toBe("<https://a.vn>")
        expect(container.textContent).toContain("<https://b.vn>")
    })

    /**
     * Remote images must survive the URL guard. `permitDataImageUrl` only short-circuits for the
     * allowed base64 image mimes and otherwise defers to react-markdown's `defaultUrlTransform`,
     * which keeps http(s); `rehype-sanitize` only runs on the `allowHtml` branch (community posts
     * render without it) and its schema widens `protocols.src` — it never narrows https.
     */
    it("keeps a remote https image src, sanitize branch included", () => {
        const md = "![Ảnh](https://document.ftes.vn/ftes/community/1740000000-a.webp)"
        for (const allowHtml of [false, true]) {
            const { container } = render(<MarkdownContent allowHtml={allowHtml} markdown={md} />)
            expect(container.querySelector("img")?.getAttribute("src"))
                .toBe("https://document.ftes.vn/ftes/community/1740000000-a.webp")
        }
    })
})

describe("unwrapAutolinks output still parses to the same document", () => {
    /**
     * The plain-text rows share this helper, so it must never hand on a string that reparses
     * differently — the invariant the old one-line version silently broke. It drops the brackets
     * (the rows want the bare url) but puts a space where they were, so the url still ends.
     */
    it("keeps the images of the reported body intact", () => {
        const unwrapped = unwrapAutolinks(REPORTED_BODY)
        expect(unwrapped).not.toContain("<https://")
        const { container } = render(<MarkdownContent markdown={unwrapped} />)
        expect(container.querySelectorAll("img")).toHaveLength(2)
        expect(container.querySelector("a")?.getAttribute("href")).toBe("https://gemini.google.com/app?hl=vi")
    })
})
