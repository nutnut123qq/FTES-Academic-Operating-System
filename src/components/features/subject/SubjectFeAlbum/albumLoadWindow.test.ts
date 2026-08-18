import { describe, expect, it } from "vitest"

import {
    ALBUM_INITIAL_LOAD,
    ALBUM_LOAD_BATCH,
    ALBUM_LOAD_LOOKAHEAD,
    nextAlbumLoadCount,
} from "./albumLoadWindow"

/** The BE/FE cap on one album, raised from 50 for exams of 60–100+ questions. */
const FULL_ALBUM = 200

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

    it("catches up in one call when an index arrives from far ahead", () => {
        // The safety net, not a live path: today the viewer only steps ±1, so nothing can hand
        // in page 40 out of the blue. Pinned anyway, because the day something can (a
        // jump-to-page control, a deep link), the page the reader landed on must be inside the
        // window — a bound one batch short of it means an exam page that never loads.
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

/**
 * The window was tuned when an album capped at 50. At 200 the question is whether it is
 * still a WINDOW or has quietly become "fetch the album": these pin that reading a full
 * 200-page exam front to back never runs more than a batch and a bit ahead of the reader,
 * and that reaching the last page still terminates and clamps.
 */
describe("nextAlbumLoadCount — a 200-picture album", () => {
    it("still opens on the initial window, not on the cap", () => {
        expect(nextAlbumLoadCount(0, 0, FULL_ALBUM)).toBe(ALBUM_INITIAL_LOAD)
    })

    it("stays a window: reading forward never runs more than one batch ahead", () => {
        let loaded = ALBUM_INITIAL_LOAD
        for (let index = 0; index < FULL_ALBUM; index += 1) {
            loaded = nextAlbumLoadCount(loaded, index, FULL_ALBUM)
            // The reader is on `index`; the window may run ahead by the lookahead plus one
            // batch, and no further — that bound is what keeps it from becoming the album.
            expect(loaded).toBeLessThanOrEqual(
                index + ALBUM_LOAD_LOOKAHEAD + ALBUM_LOAD_BATCH + 1,
            )
            expect(loaded).toBeGreaterThan(index)
        }
        expect(loaded).toBe(FULL_ALBUM)
    })

    it("is far from the whole album at the front of a long one", () => {
        // Page 10 of 200 must not have pulled anything like 200 pictures.
        let loaded = ALBUM_INITIAL_LOAD
        for (let index = 0; index <= 9; index += 1) {
            loaded = nextAlbumLoadCount(loaded, index, FULL_ALBUM)
        }
        expect(loaded).toBeLessThan(FULL_ALBUM / 4)
    })

    it("reaches the last page and clamps there", () => {
        expect(nextAlbumLoadCount(5, FULL_ALBUM - 1, FULL_ALBUM)).toBe(FULL_ALBUM)
        expect(nextAlbumLoadCount(FULL_ALBUM, FULL_ALBUM - 1, FULL_ALBUM)).toBe(FULL_ALBUM)
    })
})
