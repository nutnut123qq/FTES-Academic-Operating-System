import { describe, expect, it } from "vitest"

import {
    albumFilePath,
    compareNaturalPath,
    triageAlbumPick,
} from "./albumFolderPick"

/**
 * Unit — the three rules a whole-folder album pick must not get wrong: only pictures
 * survive, the order is the HUMAN one (`de2` before `de10`, because pick order becomes
 * the album's `sortOrder`), and the cap keeps the first pages while reporting the rest.
 */

/** A picked file: `size` and `webkitRelativePath` are read-only, hence `defineProperty`. */
const pick = (
    path: string,
    { type, size = 1_024 }: { type: string, size?: number },
): File => {
    const name = path.split("/").pop() ?? path
    const file = new File(["x"], name, { type })
    Object.defineProperty(file, "size", { value: size, configurable: true })
    Object.defineProperty(file, "webkitRelativePath", {
        value: path.includes("/") ? path : "",
        configurable: true,
    })
    return file
}

const png = (path: string, size?: number): File =>
    pick(path, { type: "image/png", size })

const names = (files: Array<File>): Array<string> => files.map((file) => file.name)

const OPTIONS = { room: 50, maxImageMb: 100 }

describe("albumFilePath", () => {
    it("prefers the folder-relative path and normalizes separators", () => {
        expect(albumFilePath(png("CSD201/2024/de1.png"))).toBe("CSD201/2024/de1.png")
        expect(albumFilePath(pick("de1.png", { type: "image/png" }))).toBe("de1.png")
    })
})

describe("compareNaturalPath", () => {
    it("orders digit runs numerically, not lexicographically", () => {
        const sorted = ["de10.png", "de2.png", "de1.png"].sort(compareNaturalPath)
        expect(sorted).toEqual(["de1.png", "de2.png", "de10.png"])
    })

    it("compares segment by segment so a folder boundary outranks its neighbours", () => {
        const sorted = [
            "CSD201/2024-extra/de1.png",
            "CSD201/2024/de10.png",
            "CSD201/2024/de2.png",
        ].sort(compareNaturalPath)
        expect(sorted).toEqual([
            "CSD201/2024/de2.png",
            "CSD201/2024/de10.png",
            "CSD201/2024-extra/de1.png",
        ])
    })

    it("puts the shallower path first when one is a prefix of the other, and is total", () => {
        expect(compareNaturalPath("CSD201/de1.png", "CSD201/de1.png/x.png")).toBeLessThan(0)
        expect(compareNaturalPath("a/b.png", "a/b.png")).toBe(0)
        // A collator tie (case fold) still resolves deterministically.
        expect(compareNaturalPath("DE1.png", "de1.png")).not.toBe(0)
    })
})

describe("triageAlbumPick", () => {
    it("keeps only album pictures and counts what it skipped", () => {
        const triage = triageAlbumPick(
            [
                png("CSD201/de1.png"),
                pick("CSD201/Thumbs.db", { type: "application/octet-stream" }),
                pick("CSD201/.DS_Store", { type: "" }),
                pick("CSD201/de2.pdf", { type: "application/pdf" }),
                pick("CSD201/de3.jpg", { type: "image/jpeg" }),
            ],
            { ...OPTIONS, sortByPath: true },
        )
        expect(names(triage.accepted)).toEqual(["de1.png", "de3.jpg"])
        expect(triage.wrongType).toBe(3)
        expect(triage.tooLarge).toBe(0)
        expect(triage.droppedOverCap).toBe(0)
    })

    it("counts oversized pictures separately from wrong-typed ones", () => {
        const triage = triageAlbumPick(
            [png("de1.png"), png("de2.png", 200 * 1024 * 1024)],
            { ...OPTIONS, sortByPath: true },
        )
        expect(names(triage.accepted)).toEqual(["de1.png"])
        expect(triage.tooLarge).toBe(1)
        expect(triage.wrongType).toBe(0)
    })

    it("sorts a folder pick into human order across sub-folders", () => {
        const triage = triageAlbumPick(
            [
                png("CSD201/2024/de10.png"),
                png("CSD201/2023/de2.png"),
                png("CSD201/2024/de2.png"),
                png("CSD201/2023/de10.png"),
            ],
            { ...OPTIONS, sortByPath: true },
        )
        expect(triage.accepted.map((file) => albumFilePath(file))).toEqual([
            "CSD201/2023/de2.png",
            "CSD201/2023/de10.png",
            "CSD201/2024/de2.png",
            "CSD201/2024/de10.png",
        ])
    })

    it("leaves a hand-picked selection in the order it was picked", () => {
        const triage = triageAlbumPick([png("de10.png"), png("de2.png")], OPTIONS)
        expect(names(triage.accepted)).toEqual(["de10.png", "de2.png"])
    })

    it("keeps the first N of the SORTED order at the cap and reports the overflow", () => {
        const files = Array.from({ length: 12 }, (_, index) =>
            png(`CSD201/de${12 - index}.png`),
        )
        const triage = triageAlbumPick(files, { ...OPTIONS, room: 3, sortByPath: true })
        expect(names(triage.accepted)).toEqual(["de1.png", "de2.png", "de3.png"])
        expect(triage.droppedOverCap).toBe(9)
    })

    it("accepts nothing when the album is already full", () => {
        const triage = triageAlbumPick([png("de1.png")], { ...OPTIONS, room: 0 })
        expect(triage.accepted).toEqual([])
        expect(triage.droppedOverCap).toBe(1)
    })

    it("rescues a picture the browser reported no type for, via its extension", () => {
        const triage = triageAlbumPick(
            [pick("CSD201/de1.webp", { type: "" }), pick("CSD201/notes.txt", { type: "" })],
            { ...OPTIONS, sortByPath: true },
        )
        expect(names(triage.accepted)).toEqual(["de1.webp"])
        expect(triage.accepted[0].type).toBe("image/webp")
        expect(triage.wrongType).toBe(1)
    })
})
