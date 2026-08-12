import { IntlMessageFormat } from "intl-messageformat"
import { describe, expect, it } from "vitest"

import en from "@/messages/en.json"
import vi from "@/messages/vi.json"

/**
 * i18n — the FE album header counter (`subjects.practice.fe.albumMeta`).
 *
 * It used to read `{count}/{max}`, which rendered "4/50 images" for an album that HELD 4
 * pictures with room for 50. Every reader parses `n/m` as a POSITION — the owner read it as
 * "picture 4 of 50" and asked why an album of four said fifty. The header is a READER's
 * surface: it answers "how big is this set", never "how much room is left", which is an
 * author's question and belongs where an author can act on it (`practice.fe.manage.slots`).
 *
 * So this pins the shape rather than the exact words: the message takes `count` and NOT
 * `max`, and rendering it never leaks the cap. Reword freely; do not bring `n/m` back.
 */

const LOCALES = [
    ["vi", vi.subjects.practice.fe.albumMeta],
    ["en", en.subjects.practice.fe.albumMeta],
] as const

describe.each(LOCALES)("albumMeta (%s)", (locale, message) => {
    it("declares no cap argument at all", () => {
        expect(message).not.toContain("{max")
        expect(message).not.toContain("max}")
    })

    it("prints the real count of an album of four", () => {
        const rendered = String(new IntlMessageFormat(message, locale).format({ count: 4 }))
        expect(rendered).toContain("4")
    })

    it("never mentions the cap, whatever the cap happens to be", () => {
        const rendered = String(new IntlMessageFormat(message, locale).format({ count: 4 }))
        expect(rendered).not.toContain("50")
        expect(rendered).not.toContain("200")
    })

    it("does not read like a position (`4/50`)", () => {
        const rendered = String(new IntlMessageFormat(message, locale).format({ count: 4 }))
        expect(rendered).not.toMatch(/\d\s*\/\s*\d/)
    })

    it("still says something sensible for an album with nothing in it", () => {
        const rendered = String(new IntlMessageFormat(message, locale).format({ count: 0 }))
        expect(rendered.trim().length).toBeGreaterThan(0)
        expect(rendered).not.toMatch(/\d\s*\/\s*\d/)
    })
})
