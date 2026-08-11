import { describe, expect, it } from "vitest"

import { classifyPePaperFile } from "./pePaperFile"

/**
 * Unit — how a PE paper is shown, decided from the three facts the contract carries.
 * The point of the table is that nothing is ever PRETENDED to be previewable: only a
 * picture with a URL and a PDF get an inline pane.
 */
describe("classifyPePaperFile", () => {
    it("renders a picture inline only when there is a URL to point at", () => {
        expect(
            classifyPePaperFile({
                mimeType: "image/jpeg",
                originalFilename: "de-thi.jpg",
                imageUrl: "https://storage/de-thi.jpg",
            }),
        ).toBe("IMAGE")
    })

    it("trusts the extension when the BE ships a generic MIME", () => {
        expect(
            classifyPePaperFile({
                mimeType: "application/octet-stream",
                originalFilename: "trang-1.PNG",
                imageUrl: "https://storage/trang-1.png",
            }),
        ).toBe("IMAGE")
    })

    it("degrades an image whose presign failed to the download card, not a broken <img>", () => {
        expect(
            classifyPePaperFile({
                mimeType: "image/png",
                originalFilename: "de-thi.png",
                imageUrl: null,
            }),
        ).toBe("UNSUPPORTED")
    })

    it("embeds a PDF (by MIME or by extension)", () => {
        expect(
            classifyPePaperFile({
                mimeType: "application/pdf",
                originalFilename: "PE-2025.pdf",
                imageUrl: null,
            }),
        ).toBe("PDF")
        expect(
            classifyPePaperFile({
                mimeType: "application/octet-stream",
                originalFilename: "PE-2025.PDF",
                imageUrl: null,
            }),
        ).toBe("PDF")
    })

    it("refuses to fake a preview for DOC / DOCX / ZIP", () => {
        expect(
            classifyPePaperFile({
                mimeType:
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                originalFilename: "de-thi.docx",
                imageUrl: null,
            }),
        ).toBe("UNSUPPORTED")
        expect(
            classifyPePaperFile({
                mimeType: "application/msword",
                originalFilename: "de-thi.doc",
                imageUrl: null,
            }),
        ).toBe("UNSUPPORTED")
        expect(
            classifyPePaperFile({
                mimeType: "application/zip",
                originalFilename: "bo-de.zip",
                imageUrl: null,
            }),
        ).toBe("UNSUPPORTED")
    })

    it("reports a resource with no file version as MISSING (nothing to download either)", () => {
        expect(
            classifyPePaperFile({ mimeType: null, originalFilename: null, imageUrl: null }),
        ).toBe("MISSING")
    })
})
