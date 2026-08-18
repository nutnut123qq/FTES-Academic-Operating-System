import React from "react"
import { render } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

/**
 * `pre` renderer — hai hình dạng con.
 *
 * Fence markdown cho `<pre><code class="language-x">`, nhưng HTML thô (đề bài soạn bằng
 * rich-text editor, `allowHtml`) cho `<pre class="ql-syntax">TEXT</pre>` — không có `<code>`
 * con. Bản cũ dùng `React.Children.only` nên ca thứ hai NÉM LỖI và giết cả trang.
 */

vi.mock("react-shiki", () => ({ isInlineCode: () => false }))
vi.mock("@heroui/react", () => ({
    Link: () => null,
    Table: Object.assign(() => null, { Body: () => null, Cell: () => null }),
    Chip: () => null,
    Accordion: Object.assign(() => null, { Item: () => null }),
    // Real (joining) `cn`: MathFormula styles display math with it, and a stub returning
    // undefined would silently drop the class the assertions below read.
    cn: (...args: Array<unknown>) => args.filter(Boolean).join(" "),
}))
vi.mock("./MarkdownTableParts", () => ({
    MarkdownTable: () => null,
    MarkdownTableBody: () => null,
    MarkdownTableColumn: () => null,
    MarkdownTableHead: () => null,
    MarkdownTableRow: () => null,
}))
vi.mock("./CodeToHtml", () => ({
    CodeToHtml: ({ code, language }: { code: string, language: string }) => (
        <pre data-lang={language}>{code}</pre>
    ),
}))
vi.mock("./LayoutWidget", () => ({ LayoutWidget: () => null }))
vi.mock("./MermaidDiagram", () => ({ MermaidDiagram: () => null }))
vi.mock("./RenderReactComponent", () => ({ RenderReactComponent: () => null }))
vi.mock("./TabsBlock", () => ({ TabsBlock: () => null, TabPane: () => null }))
vi.mock("@/i18n/navigation", () => ({ Link: () => null }))

import { buildMarkdownRenderers } from "./map"

const renderers = buildMarkdownRenderers({
    isDark: false,
    t: ((key: string) => key) as never,
    mermaidCaptions: {},
    reading: false,
})

/**
 * The math tags → KaTeX. This is the one seam the pipeline test in `index.test.tsx` cannot
 * cover (it mocks this map away to assert on the raw tags), so the `tex` attribute reaching
 * a real typeset formula is pinned here.
 */
describe("MarkdownContent map — math", () => {
    // The custom tags are not part of react-markdown's `Components` type (the map is cast
    // on the way out of buildMarkdownRenderers), so they are read back the same way.
    const custom = renderers as unknown as Record<
        string,
        React.ComponentType<{ tex?: string }>
    >

    it("typesets an inline math tag", () => {
        const Inline = custom.inlinemath
        const { container } = render(<Inline tex="x^2" />)

        expect(container.querySelector(".katex")).not.toBeNull()
        expect(container.querySelector(".katex-display")).toBeNull()
    })

    it("typesets a block math tag as DISPLAY math", () => {
        const Block = custom.blockmath
        const { container } = render(<Block tex="\\int_0^1 x^2 dx" />)

        expect(container.querySelector(".katex-display")).not.toBeNull()
    })

    it("falls back to the source when there is no TeX to typeset", () => {
        const Inline = custom.inlinemath
        const { container } = render(<Inline />)

        expect(container.textContent).toBe("")
    })
})

describe("MarkdownContent map — pre", () => {
    it("renders a raw-HTML <pre> whose only child is text (no <code> wrapper)", () => {
        const Pre = renderers.pre as React.ComponentType<{ children?: React.ReactNode }>
        const { container } = render(<Pre>{"5 1 2 3 4 5"}</Pre>)
        expect(container.textContent).toBe("5 1 2 3 4 5")
    })

    it("still reads the language off the <code> child of a markdown fence", () => {
        const Pre = renderers.pre as React.ComponentType<{ children?: React.ReactNode }>
        const { container } = render(
            <Pre>
                <code className="language-python">print(1)</code>
            </Pre>,
        )
        expect(container.querySelector("pre")?.getAttribute("data-lang")).toBe("python")
        expect(container.textContent).toBe("print(1)")
    })
})
