import { describe, expect, it } from "vitest"

import {
    DERIVED_TITLE_MAX,
    joinTitleIntoMarkdown,
    splitTitleFromMarkdown,
} from "./title"

/**
 * Unit — the title ⇄ body split/join used by the single-editor composers.
 *
 * These pin the contract the composers rely on: a leading H1 becomes the BE
 * `title` and is STRIPPED from the stored `content` (so the feed/detail never
 * double-renders it), a body with no leading H1 falls back to its first line,
 * and the edit round-trip (join → split) is lossless.
 */
describe("splitTitleFromMarkdown", () => {
    it("takes the leading H1 as the title and strips it from the body", () => {
        const { title, body } = splitTitleFromMarkdown("# Hello world\n\nBody paragraph here.")
        expect(title).toBe("Hello world")
        expect(body).toBe("Body paragraph here.")
    })

    it("keeps H2/H3 in the body (only a single-# H1 is the title)", () => {
        const { title, body } = splitTitleFromMarkdown("## Not a title\n\nrest")
        expect(title).toBe("Not a title") // fallback: first line's plain text…
        expect(body).toBe("## Not a title\n\nrest") // …but the body is untouched
    })

    it("strips inline marks from an H1 title (plain text out)", () => {
        const { title, body } = splitTitleFromMarkdown("# Hello **bold** and _italic_\n\nafter")
        expect(title).toBe("Hello bold and italic")
        expect(body).toBe("after")
    })

    it("resolves a link/inline-code H1 to its label text", () => {
        const { title } = splitTitleFromMarkdown("# See [the docs](https://x.dev) `now`\n\nx")
        expect(title).toBe("See the docs now")
    })

    it("collapses multiple leading blank lines before an H1", () => {
        const { title, body } = splitTitleFromMarkdown("\n\n\n#   Spaced title\n\n\nBody")
        expect(title).toBe("Spaced title")
        expect(body).toBe("Body")
    })

    it("falls back to the first non-empty line when there is no H1", () => {
        const { title, body } = splitTitleFromMarkdown("Just a plain first line\nsecond line")
        expect(title).toBe("Just a plain first line")
        expect(body).toBe("Just a plain first line\nsecond line")
    })

    it("returns empty title and body for blank input", () => {
        expect(splitTitleFromMarkdown("")).toEqual({ title: "", body: "" })
        expect(splitTitleFromMarkdown("   \n  \n")).toEqual({ title: "", body: "" })
    })

    it("yields an empty body when the H1 is the only content", () => {
        const { title, body } = splitTitleFromMarkdown("# Only a title")
        expect(title).toBe("Only a title")
        expect(body).toBe("")
    })

    it("caps a very long derived title", () => {
        const long = "x".repeat(300)
        const { title } = splitTitleFromMarkdown(`# ${long}`)
        expect(title).toHaveLength(DERIVED_TITLE_MAX)
    })
})

describe("joinTitleIntoMarkdown", () => {
    it("prepends the title as an H1 above the body", () => {
        expect(joinTitleIntoMarkdown("My title", "The body")).toBe("# My title\n\nThe body")
    })

    it("emits only the H1 when the body is empty", () => {
        expect(joinTitleIntoMarkdown("My title", "")).toBe("# My title")
    })

    it("returns just the body when there is no title", () => {
        expect(joinTitleIntoMarkdown("", "The body")).toBe("The body")
        expect(joinTitleIntoMarkdown("   ", "The body")).toBe("The body")
    })
})

describe("edit round-trip (join → split is lossless)", () => {
    it("recovers the original title and body", () => {
        const title = "Round trip title"
        const body = "First paragraph.\n\n- a\n- b"
        const joined = joinTitleIntoMarkdown(title, body)
        const split = splitTitleFromMarkdown(joined)
        expect(split.title).toBe(title)
        expect(split.body).toBe(body)
    })

    it("round-trips a title-only post", () => {
        const joined = joinTitleIntoMarkdown("Solo title", "")
        expect(splitTitleFromMarkdown(joined)).toEqual({ title: "Solo title", body: "" })
    })
})
