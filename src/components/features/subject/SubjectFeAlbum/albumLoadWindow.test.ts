import { describe, expect, it } from "vitest"

import {
    ALBUM_INITIAL_LOAD,
    ALBUM_LOAD_BATCH,
    nextAlbumLoadCount,
} from "./albumLoadWindow"

describe("nextAlbumLoadCount", () => {
    it("starts at the initial window on the first picture", () => {
        expect(nextAlbumLoadCount(0, 0, 50)).toBe(ALBUM_INITIAL_LOAD)
    })

    it("holds the window while the reader is still well inside it", () => {
        // Pictures 1-3 (index 0..2) of the first 5 — nothing new needed yet.
        expect(nextAlbumLoadCount(5, 0, 50)).toBe(5)
        expect(nextAlbumLoadCount(5, 1, 50)).toBe(5)
        expect(nextAlbumLoadCount(5, 2, 50)).toBe(5)
    })

    it("loads the next batch once the reader reaches the 4th picture", () => {
        // The behaviour the product owner asked for: 5 up front, more at the 4th.
        expect(nextAlbumLoadCount(5, 3, 50)).toBe(ALBUM_INITIAL_LOAD + ALBUM_LOAD_BATCH)
    })

    it("never shrinks when paging back", () => {
        expect(nextAlbumLoadCount(20, 0, 50)).toBe(20)
    })

    it("catches up in one call when the filmstrip jumps far ahead", () => {
        // Clicking thumbnail 40 must not leave it outside the window.
        const loaded = nextAlbumLoadCount(5, 39, 50)
        expect(loaded).toBeGreaterThan(39)
    })

    it("never exceeds the album size", () => {
        expect(nextAlbumLoadCount(5, 11, 12)).toBe(12)
        expect(nextAlbumLoadCount(50, 49, 50)).toBe(50)
    })

    it("clamps the initial window to a short album", () => {
        expect(nextAlbumLoadCount(0, 0, 3)).toBe(3)
    })

    it("returns zero for an empty album", () => {
        expect(nextAlbumLoadCount(0, 0, 0)).toBe(0)
    })
})
