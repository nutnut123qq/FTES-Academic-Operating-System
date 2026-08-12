import { describe, expect, it } from "vitest"

import { classifyChallengePaper } from "./paperKind"

/**
 * Unit — how a challenge's exam paper gets shown. This is the whole learner value of
 * folding Practical Exams into the challenge bank: if the classifier is wrong the paper
 * either renders as a broken `<img>`, or hides behind a "cannot preview" card the reader
 * has no reason to accept. The awkward inputs are the real ones — storage hosts routinely
 * answer `application/octet-stream`, or no MIME at all, and always append a query string.
 */
describe("classifyChallengePaper", () => {
    it("no url → MISSING (blank and whitespace alike)", () => {
        expect(classifyChallengePaper(null, "image/png")).toBe("MISSING")
        expect(classifyChallengePaper(undefined, undefined)).toBe("MISSING")
        expect(classifyChallengePaper("   ", "application/pdf")).toBe("MISSING")
    })

    it("an image MIME wins, whatever the url looks like", () => {
        expect(classifyChallengePaper("https://cdn/x/de-pe", "image/png")).toBe("IMAGE")
        expect(classifyChallengePaper("https://cdn/x/de-pe.bin", "IMAGE/JPEG")).toBe("IMAGE")
    })

    it("a pdf MIME wins, in either spelling", () => {
        expect(classifyChallengePaper("https://cdn/x/de", "application/pdf")).toBe("PDF")
        expect(classifyChallengePaper("https://cdn/x/de", "application/x-pdf")).toBe("PDF")
    })

    it("no MIME → the url extension decides, past the query string", () => {
        expect(classifyChallengePaper("https://cdn/x/de-thi.PDF?v=2", null)).toBe("PDF")
        expect(classifyChallengePaper("https://cdn/x/scan.jpeg#page=1", "")).toBe("IMAGE")
        expect(classifyChallengePaper("https://cdn/x/de-thi.docx", null)).toBe("UNSUPPORTED")
        expect(classifyChallengePaper("https://cdn/x/de-thi", null)).toBe("UNSUPPORTED")
    })

    it("a generic binary MIME is not trusted over the extension", () => {
        expect(
            classifyChallengePaper("https://cdn/x/de.pdf?sig=abc", "application/octet-stream"),
        ).toBe("PDF")
        expect(classifyChallengePaper("https://cdn/x/de.webp", "binary/octet-stream")).toBe(
            "IMAGE",
        )
        // A generic MIME on a .zip: the extension decides, and a zip is a real paper kind.
        expect(classifyChallengePaper("https://cdn/x/de.zip", "application/octet-stream")).toBe(
            "ARCHIVE",
        )
    })

    it("an office MIME stays UNSUPPORTED — no fake render", () => {
        expect(classifyChallengePaper("https://cdn/x/de.docx", "application/msword")).toBe(
            "UNSUPPORTED",
        )
    })

    it("a zip is ARCHIVE, not the failure state — it is a legitimate paper", () => {
        // Browsers and operating systems disagree on the zip MIME; all spellings must land
        // on the same kind, otherwise the same file reads as "broken" on one machine.
        expect(classifyChallengePaper("https://cdn/x/de.zip", "application/zip")).toBe("ARCHIVE")
        expect(classifyChallengePaper("https://cdn/x/de.zip", "application/x-zip-compressed"))
            .toBe("ARCHIVE")
        expect(classifyChallengePaper("https://cdn/x/de.zip", "multipart/x-zip")).toBe("ARCHIVE")
    })

    it("falls back to the extension for archives when the MIME is absent", () => {
        expect(classifyChallengePaper("https://cdn/x/bo-de.zip", null)).toBe("ARCHIVE")
        // Signed delivery URLs carry a query string — it must not defeat the extension read.
        expect(classifyChallengePaper("https://cdn/x/bo-de.ZIP?sig=abc123", "")).toBe("ARCHIVE")
    })
})
