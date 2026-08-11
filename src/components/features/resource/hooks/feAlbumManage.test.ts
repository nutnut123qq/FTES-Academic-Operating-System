import { describe, expect, it } from "vitest"

import {
    FE_IMAGE_UPLOAD_RATE,
    isFeAlbumPermutation,
    moveFeAlbumImage,
    nextFeImageUploadDelayMs,
} from "./feAlbumManage"

/**
 * Unit — the two FE-album contracts that are easy to break silently:
 * `PUT /images/order` only accepts a COMPLETE permutation, and `POST /images` is rate
 * limited (10/min, 60/hour) so a bulk add has to pace itself.
 */

describe("moveFeAlbumImage", () => {
    const ids = ["a", "b", "c", "d"]

    it("always returns the whole album, never a slice", () => {
        expect(moveFeAlbumImage(ids, 2, 0)).toHaveLength(ids.length)
        expect(moveFeAlbumImage(ids, 0, 3).slice().sort()).toEqual(ids.slice().sort())
    })

    it("moves one picture up and down", () => {
        expect(moveFeAlbumImage(ids, 2, 1)).toEqual(["a", "c", "b", "d"])
        expect(moveFeAlbumImage(ids, 1, 2)).toEqual(["a", "c", "b", "d"])
        expect(moveFeAlbumImage(ids, 3, 0)).toEqual(["d", "a", "b", "c"])
    })

    it("is a no-op on a same/out-of-range index", () => {
        expect(moveFeAlbumImage(ids, 1, 1)).toEqual(ids)
        expect(moveFeAlbumImage(ids, -1, 2)).toEqual(ids)
        expect(moveFeAlbumImage(ids, 0, 9)).toEqual(ids)
    })
})

describe("isFeAlbumPermutation", () => {
    const current = ["a", "b", "c"]

    it("accepts a reordering of exactly the same ids", () => {
        expect(isFeAlbumPermutation(["c", "a", "b"], current)).toBe(true)
    })

    it("rejects a partial list (the BE answers 400)", () => {
        expect(isFeAlbumPermutation(["a", "b"], current)).toBe(false)
    })

    it("rejects a duplicated or foreign id", () => {
        expect(isFeAlbumPermutation(["a", "a", "b"], current)).toBe(false)
        expect(isFeAlbumPermutation(["a", "b", "z"], current)).toBe(false)
    })
})

describe("nextFeImageUploadDelayMs", () => {
    const now = 1_000_000

    it("does not throttle an add that fits in the per-minute burst", () => {
        const started = Array.from(
            { length: FE_IMAGE_UPLOAD_RATE.perMinute - 1 },
            (_, index) => now - index * 100,
        )
        expect(nextFeImageUploadDelayMs(started, now)).toBe(0)
    })

    it("waits for the oldest request to age out once the minute window is full", () => {
        const started = Array.from(
            { length: FE_IMAGE_UPLOAD_RATE.perMinute },
            (_, index) => now - 50_000 + index * 100,
        )
        const delay = nextFeImageUploadDelayMs(started, now)
        // The oldest started 50 s ago, so a slot frees ~10 s from now.
        expect(delay).toBeGreaterThan(9_000)
        expect(delay).toBeLessThan(12_000)
    })

    it("frees a slot again once the window has rolled past", () => {
        const started = Array.from(
            { length: FE_IMAGE_UPLOAD_RATE.perMinute },
            (_, index) => now - 120_000 + index * 100,
        )
        expect(nextFeImageUploadDelayMs(started, now)).toBe(0)
    })

    it("also honours the hourly cap", () => {
        const started = Array.from(
            { length: FE_IMAGE_UPLOAD_RATE.perHour },
            (_, index) => now - 3_000_000 + index * 100,
        )
        expect(nextFeImageUploadDelayMs(started, now)).toBeGreaterThan(0)
    })

    it("never waits on an empty history", () => {
        expect(nextFeImageUploadDelayMs([], now)).toBe(0)
    })
})
