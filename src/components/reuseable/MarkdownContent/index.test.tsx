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

    it("still strips a javascript: URI on an image (security guard)", () => {
        const { container } = render(<MarkdownContent markdown={"![x](javascript:alert(1))"} />)
        // The image node may still render, but its src must be scrubbed to empty —
        // never a javascript: URL.
        expect(container.innerHTML).not.toContain("javascript")
        const img = container.querySelector("img")
        expect(img?.getAttribute("src") ?? "").toBe("")
    })
})
