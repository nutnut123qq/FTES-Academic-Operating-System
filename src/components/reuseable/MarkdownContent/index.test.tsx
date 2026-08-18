import React from "react"
import { render } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

/**
 * MarkdownContent — embedded data-image rendering + the URL security guard.
 *
 * A DOCUMENT lesson body may embed an inline image as a base64 data URI
 * (`![](data:image/png;base64,…)`). react-markdown's default `urlTransform`
 * strips every `data:` URL, so the image collapsed to an empty `src`. The
 * component now permits the allowed image mime types on `img[src]` only, while
 * still stripping `javascript:` (and every non-image `data:`/other scheme) so
 * the change adds no XSS surface.
 */

vi.mock("next-themes", () => ({ useTheme: () => ({ theme: "light" }) }))
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }))
vi.mock("@heroui/react", () => ({ cn: (...a: Array<unknown>) => a.filter(Boolean).join(" ") }))

// Use react-markdown's DEFAULT element renderers (native <img>) so the test
// isolates the sanitize/urlTransform behaviour, not the app's figure/caption map.
vi.mock("./map", () => ({ buildMarkdownRenderers: () => ({}) }))
// The index barrel `export *`s these heavy sub-renderers; stub them so importing
// MarkdownContent does not pull in shiki/mermaid/HeroUI at unit-test time.
vi.mock("./CodeToHtml", () => ({}))
vi.mock("./LayoutWidget", () => ({}))
vi.mock("./MermaidDiagram", () => ({}))

import { MarkdownContent } from "./index"

// Minimal valid 1x1 PNG data URI (bytes irrelevant — only the scheme/mime matters).
const PNG_DATA_URI =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="

describe("MarkdownContent — data-image URIs", () => {
    it("renders a base64 data-image as an <img> with the data src preserved", () => {
        const { container } = render(<MarkdownContent markdown={`![biểu đồ](${PNG_DATA_URI})`} />)
        const img = container.querySelector("img")
        expect(img).not.toBeNull()
        expect(img?.getAttribute("src")).toBe(PNG_DATA_URI)
    })

    // Đề bài challenge lưu HTML (rich-text editor của admin) — `allowHtml` phải render
    // thành thẻ thật, không in `<ul><li>` ra màn hình như text.
    it("renders stored HTML as real elements when allowHtml is on", () => {
        const html = "<ul><li>Nhập số phần tử n.</li></ul><p>Đầu vào mẫu</p>"
        const { container } = render(<MarkdownContent allowHtml markdown={html} />)
        expect(container.querySelectorAll("li")).toHaveLength(1)
        expect(container.textContent).not.toContain("<li>")
    })

    it("still strips a javascript: URI on an image (security guard)", () => {
        const { container } = render(<MarkdownContent markdown={"![x](javascript:alert(1))"} />)
        // The image node may still render, but its src must be scrubbed to empty —
        // never a javascript: URL.
        expect(container.innerHTML).not.toContain("javascript")
        const img = container.querySelector("img")
        expect(img?.getAttribute("src") ?? "").toBe("")
    })
})

/**
 * The `math` prop's PIPELINE — that the scanner runs (or doesn't), and that the tags it
 * makes survive the sanitize step on the `allowHtml` branch. What KaTeX does with them is
 * pinned in `math.test.ts`; here `./map` is mocked away, so the math nodes come out as the
 * bare `<inlinemath tex="…">` / `<blockmath tex="…">` this component hands the renderer map.
 */
describe("MarkdownContent — TeX math", () => {
    it("turns $…$ and $$…$$ into math nodes carrying the TeX source", () => {
        const { container } = render(
            <MarkdownContent math markdown={"Domain of $F(x)=\\sqrt{x-3}$\n\n$$x^2$$"} />,
        )

        expect(container.querySelector("inlinemath")?.getAttribute("tex")).toBe(
            "F(x)=\\sqrt{x-3}",
        )
        expect(container.querySelector("blockmath")?.getAttribute("tex")).toBe("x^2")
    })

    it("does nothing at all without the prop — every other surface is untouched", () => {
        const { container } = render(<MarkdownContent markdown={"Domain of $F(x)$"} />)

        expect(container.querySelector("inlinemath")).toBeNull()
        expect(container.textContent).toContain("$F(x)$")
    })

    it("leaves a price list alone even with math on", () => {
        const { container } = render(<MarkdownContent math markdown="Giá $5 và $10." />)

        expect(container.querySelector("inlinemath")).toBeNull()
        expect(container.textContent).toContain("$5 và $10.")
    })

    it("keeps the math tags through rehype-sanitize on the allowHtml branch", () => {
        // The whole reason the sanitize schema was widened: HTML-stored exam statements go
        // through rehype-raw + rehype-sanitize, which strips every tag not on the list.
        const { container } = render(
            <MarkdownContent allowHtml math markdown="<p>Cho $x^2$ nhé</p>" />,
        )

        expect(container.querySelector("inlinemath")?.getAttribute("tex")).toBe("x^2")
    })

    it("still strips a script tag on that branch — the schema was widened, not opened", () => {
        const { container } = render(
            <MarkdownContent
                allowHtml
                math
                markdown={"<p>$x$</p><script>alert(1)</script><p onclick=\"alert(1)\">hi</p>"}
            />,
        )

        expect(container.querySelector("script")).toBeNull()
        expect(container.querySelector("[onclick]")).toBeNull()
        expect(container.querySelector("inlinemath")).not.toBeNull()
    })

    it("allows nothing but `tex` on a math tag, even one the author typed by hand", () => {
        const { container } = render(
            <MarkdownContent
                allowHtml
                math
                markdown={"<inlinemath tex=\"x\" onclick=\"alert(1)\" class=\"evil\"></inlinemath>"}
            />,
        )

        const node = container.querySelector("inlinemath")
        expect(node?.getAttribute("tex")).toBe("x")
        expect(node?.getAttribute("onclick")).toBeNull()
        expect(node?.getAttribute("class")).toBeNull()
    })
})
