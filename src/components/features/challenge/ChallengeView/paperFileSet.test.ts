import { describe, expect, it } from "vitest"

import type { ChallengePaperFileView } from "@/modules/api/rest/challenges/types"

import { groupChallengePaperFiles } from "./paperFileSet"

/**
 * Unit — where each file of a multi-file exam paper goes.
 *
 * This is the decision the whole surface hangs off: a PE paper is page images or a PDF the
 * candidate READS plus a template they DOWNLOAD, and getting the split wrong means either
 * burying the exam behind a download (the very problem the contract exists to fix) or
 * embedding a file the server said not to embed.
 *
 * Three things are pinned here rather than in the component, because they are rules:
 *
 * 1. **The BE's `role` is the only authority on viewable-vs-download.** A `.png`-named
 *    file marked download-only stays an attachment; an unknown future role is treated as
 *    download-only too, never as permission to embed.
 * 2. **The author's order survives**, including across a list that arrives shuffled.
 * 3. **Consecutive pictures collapse into one album run**, so a three-page exam reaches the
 *    shared viewer as one paged album — and a PDF between them breaks the run instead of
 *    silently reordering the exam.
 */

/** Builds one `paperFiles` row; `sortOrder` defaults to the array position at the callsite. */
const file = (over: Partial<ChallengePaperFileView> & { id: string }): ChallengePaperFileView => ({
    url: `https://storage/${over.id}.png`,
    mime: "image/png",
    filename: `${over.id}.png`,
    sizeBytes: 1024,
    role: "VIEW",
    sortOrder: 0,
    ...over,
})

/** The ids of an `IMAGES` run, for terse assertions. */
const runIds = (set: ReturnType<typeof groupChallengePaperFiles>, at: number) => {
    const section = set.sections[at]
    return section?.kind === "IMAGES" ? section.files.map((f) => f.id) : null
}

describe("groupChallengePaperFiles — no attachment list", () => {
    it("an absent / empty list yields nothing, so the caller falls back to the single paper", () => {
        expect(groupChallengePaperFiles(undefined)).toEqual({ sections: [], attachments: [] })
        expect(groupChallengePaperFiles(null)).toEqual({ sections: [], attachments: [] })
        expect(groupChallengePaperFiles([])).toEqual({ sections: [], attachments: [] })
    })
})

describe("groupChallengePaperFiles — pages plus a template", () => {
    const files = [
        file({ id: "p1", sortOrder: 0 }),
        file({ id: "p2", sortOrder: 1 }),
        file({ id: "p3", sortOrder: 2 }),
        file({
            id: "tpl",
            sortOrder: 3,
            url: "https://storage/template.zip",
            mime: "application/zip",
            filename: "template.zip",
            role: "DOWNLOAD",
            sizeBytes: 2 * 1024 * 1024,
        }),
    ]

    it("reads the three pages inline, as ONE album run in order", () => {
        const set = groupChallengePaperFiles(files)
        expect(set.sections.length).toBe(1)
        expect(runIds(set, 0)).toEqual(["p1", "p2", "p3"])
    })

    it("leaves the template as an attachment, never inline", () => {
        const set = groupChallengePaperFiles(files)
        expect(set.attachments.map((f) => f.id)).toEqual(["tpl"])
    })
})

describe("groupChallengePaperFiles — the role comes from the backend", () => {
    it("keeps a download-only file OUT of the viewer even when it looks like a picture", () => {
        const set = groupChallengePaperFiles([
            file({ id: "trap", role: "DOWNLOAD", url: "https://storage/trap.png", mime: "image/png" }),
        ])
        expect(set.sections).toEqual([])
        expect(set.attachments.map((f) => f.id)).toEqual(["trap"])
    })

    it("treats a role it does not know as download-only, never as permission to embed", () => {
        const set = groupChallengePaperFiles([
            file({ id: "future", role: "PREVIEW_SOMEDAY" }),
            file({ id: "blank", role: "", sortOrder: 1 }),
        ])
        expect(set.sections).toEqual([])
        expect(set.attachments.map((f) => f.id)).toEqual(["future", "blank"])
    })

    it("does not re-derive the role from the filename — a viewable file with a doc name still shows", () => {
        // `role` says VIEW and the MIME says pdf; the `.bin` name must not demote it.
        const set = groupChallengePaperFiles([
            file({ id: "pdf", url: "https://storage/de.bin", mime: "application/pdf" }),
        ])
        expect(set.sections[0]).toEqual({
            kind: "DOCUMENT",
            file: expect.objectContaining({ id: "pdf" }),
        })
    })
})

describe("groupChallengePaperFiles — ordering", () => {
    it("sorts by the author's sortOrder, not by the order the list arrived in", () => {
        const set = groupChallengePaperFiles([
            file({ id: "third", sortOrder: 2 }),
            file({ id: "first", sortOrder: 0 }),
            file({ id: "second", sortOrder: 1 }),
        ])
        expect(runIds(set, 0)).toEqual(["first", "second", "third"])
    })

    it("keeps attachments in the author's order too", () => {
        const set = groupChallengePaperFiles([
            file({ id: "b", sortOrder: 5, role: "DOWNLOAD" }),
            file({ id: "a", sortOrder: 1, role: "DOWNLOAD" }),
        ])
        expect(set.attachments.map((f) => f.id)).toEqual(["a", "b"])
    })

    it("breaks the picture run at a PDF instead of reordering the exam", () => {
        const set = groupChallengePaperFiles([
            file({ id: "p1", sortOrder: 0 }),
            file({
                id: "appendix",
                sortOrder: 1,
                url: "https://storage/appendix.pdf",
                mime: "application/pdf",
            }),
            file({ id: "p2", sortOrder: 2 }),
        ])
        expect(set.sections.map((section) => section.kind)).toEqual([
            "IMAGES",
            "DOCUMENT",
            "IMAGES",
        ])
        expect(runIds(set, 0)).toEqual(["p1"])
        expect(runIds(set, 2)).toEqual(["p2"])
    })
})

describe("groupChallengePaperFiles — degenerate rows", () => {
    it("shows no inline viewer at all when every file is download-only", () => {
        const set = groupChallengePaperFiles([
            file({ id: "z1", role: "DOWNLOAD", mime: "application/zip" }),
            file({ id: "z2", role: "DOWNLOAD", mime: "application/msword", sortOrder: 1 }),
        ])
        expect(set.sections).toEqual([])
        expect(set.attachments.length).toBe(2)
    })

    it("offers a viewable file the browser cannot embed as a download instead of faking a frame", () => {
        // Unreachable on a healthy BE (only images and PDFs are marked VIEW) — but a broken
        // preview is worse than a download link, so it degrades that way.
        const set = groupChallengePaperFiles([
            file({ id: "odd", mime: "application/vnd.ms-excel", url: "https://storage/odd.xls" }),
        ])
        expect(set.sections).toEqual([])
        expect(set.attachments.map((f) => f.id)).toEqual(["odd"])
    })

    it("drops a row with no url — there is nothing to show and nowhere to send the reader", () => {
        const set = groupChallengePaperFiles([
            file({ id: "ghost", url: "   " }),
            file({ id: "real", sortOrder: 1 }),
        ])
        expect(runIds(set, 0)).toEqual(["real"])
        expect(set.attachments).toEqual([])
    })

    it("never mutates the list it was handed", () => {
        const files = [file({ id: "b", sortOrder: 1 }), file({ id: "a", sortOrder: 0 })]
        groupChallengePaperFiles(files)
        expect(files.map((f) => f.id)).toEqual(["b", "a"])
    })
})
