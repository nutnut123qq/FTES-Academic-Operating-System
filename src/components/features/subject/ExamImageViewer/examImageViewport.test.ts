import { describe, expect, it } from "vitest"

import {
    DOUBLE_CLICK_ZOOM,
    FIT_ZOOM,
    MAX_ZOOM,
    ZOOM_STEP,
    clampIndex,
    clampOffset,
    clampZoom,
    isFitted,
    panLimit,
    stepIndex,
    toggleZoom,
    zoomByWheel,
    zoomIn,
    zoomOut,
    type ViewportMetrics,
} from "./examImageViewport"

/**
 * Unit — the exam viewer's viewport maths. These are the invariants the viewer is
 * useless without: a zoom that cannot run away, a pan that cannot throw the page out of
 * the frame, and paging that always lands on a real page — wrapping round the ends rather
 * than running off them.
 */

/** A portrait scan fitted into a landscape frame: black bars left and right. */
const portrait = (zoom: number): ViewportMetrics => ({
    frameWidth: 800,
    frameHeight: 600,
    contentWidth: 400,
    contentHeight: 600,
    zoom,
})

describe("clampZoom", () => {
    it("keeps a zoom inside [fit, max]", () => {
        expect(clampZoom(0.2)).toBe(FIT_ZOOM)
        expect(clampZoom(-5)).toBe(FIT_ZOOM)
        expect(clampZoom(2.5)).toBe(2.5)
        expect(clampZoom(999)).toBe(MAX_ZOOM)
    })

    it("falls back to the fit for ANY non-finite input rather than blanking the viewer", () => {
        expect(clampZoom(Number.NaN)).toBe(FIT_ZOOM)
        expect(clampZoom(Number.POSITIVE_INFINITY)).toBe(FIT_ZOOM)
        expect(clampZoom(Number.NEGATIVE_INFINITY)).toBe(FIT_ZOOM)
    })
})

describe("zoomIn / zoomOut", () => {
    it("steps by the multiplier", () => {
        expect(zoomIn(FIT_ZOOM)).toBeCloseTo(ZOOM_STEP)
        expect(zoomOut(ZOOM_STEP)).toBeCloseTo(FIT_ZOOM)
    })

    it("never goes below the fit, however often it is pressed", () => {
        let zoom = FIT_ZOOM
        for (let press = 0; press < 10; press += 1) {
            zoom = zoomOut(zoom)
        }
        expect(zoom).toBe(FIT_ZOOM)
    })

    it("never goes past the max, however often it is pressed", () => {
        let zoom = FIT_ZOOM
        for (let press = 0; press < 20; press += 1) {
            zoom = zoomIn(zoom)
        }
        expect(zoom).toBe(MAX_ZOOM)
    })

    it("reaches a magnification worth reading exam text at", () => {
        // 4 presses must already be past 4× — a fitted A4 scan is ~5× smaller than 1:1.
        expect(zoomIn(zoomIn(zoomIn(zoomIn(FIT_ZOOM))))).toBeGreaterThan(4)
    })
})

describe("zoomByWheel", () => {
    it("zooms IN on a negative deltaY (wheel towards the reader) and out on a positive one", () => {
        expect(zoomByWheel(2, -100)).toBeGreaterThan(2)
        expect(zoomByWheel(2, 100)).toBeLessThan(2)
    })

    it("clamps at both ends and survives a non-finite delta", () => {
        expect(zoomByWheel(FIT_ZOOM, 5000)).toBe(FIT_ZOOM)
        expect(zoomByWheel(MAX_ZOOM, -5000)).toBe(MAX_ZOOM)
        expect(zoomByWheel(2, Number.NaN)).toBe(2)
    })
})

describe("isFitted / toggleZoom", () => {
    it("treats the fit (and float dust around it) as fitted", () => {
        expect(isFitted(FIT_ZOOM)).toBe(true)
        expect(isFitted(1.0000001)).toBe(true)
        expect(isFitted(1.2)).toBe(false)
    })

    it("double-click magnifies from the fit and returns to it from anywhere else", () => {
        expect(toggleZoom(FIT_ZOOM)).toBe(DOUBLE_CLICK_ZOOM)
        expect(toggleZoom(3)).toBe(FIT_ZOOM)
        expect(toggleZoom(MAX_ZOOM)).toBe(FIT_ZOOM)
    })
})

describe("panLimit", () => {
    it("is 0 while the scaled image still fits — a fitted page cannot be dragged", () => {
        expect(panLimit(800, 400, FIT_ZOOM)).toBe(0)
        // Even zoomed, this axis still fits (400 × 1.5 = 600 < 800).
        expect(panLimit(800, 400, 1.5)).toBe(0)
    })

    it("is half the overflow once the image is bigger than the frame", () => {
        // 600 tall × 2 = 1200 in a 600 frame → 600 of overflow, 300 each way.
        expect(panLimit(600, 600, 2)).toBe(300)
    })

    it("never returns a negative limit", () => {
        expect(panLimit(1000, 10, MAX_ZOOM)).toBe(0)
    })
})

describe("clampOffset", () => {
    it("pins a fitted page to the centre on both axes", () => {
        expect(clampOffset({ x: 500, y: -900 }, portrait(FIT_ZOOM))).toEqual({ x: 0, y: 0 })
    })

    it("allows movement only along the axis that actually overflows", () => {
        // zoom 2 → 800×1200 in an 800×600 frame: nothing to pan sideways, 300 vertically.
        const clamped = clampOffset({ x: 250, y: 250 }, portrait(2))
        expect(clamped).toEqual({ x: 0, y: 250 })
    })

    it("stops the page from being dragged out of the frame", () => {
        expect(clampOffset({ x: 0, y: 5000 }, portrait(2))).toEqual({ x: 0, y: 300 })
        expect(clampOffset({ x: 0, y: -5000 }, portrait(2))).toEqual({ x: 0, y: -300 })
    })

    it("survives an unmeasured frame (metrics all zero) by pinning to the centre", () => {
        expect(
            clampOffset(
                { x: 40, y: 40 },
                { frameWidth: 0, frameHeight: 0, contentWidth: 0, contentHeight: 0, zoom: 3 },
            ),
        ).toEqual({ x: 0, y: 0 })
    })

    it("treats a non-finite offset as the origin", () => {
        expect(clampOffset({ x: Number.NaN, y: Number.NaN }, portrait(2))).toEqual({ x: 0, y: 0 })
    })
})

describe("clampIndex / stepIndex", () => {
    it("pins an index inside the album", () => {
        expect(clampIndex(-3, 5)).toBe(0)
        expect(clampIndex(9, 5)).toBe(4)
        expect(clampIndex(2, 5)).toBe(2)
    })

    it("answers 0 for an empty album", () => {
        expect(clampIndex(3, 0)).toBe(0)
        expect(stepIndex(0, 1, 0)).toBe(0)
    })

    it("pages forward and back", () => {
        expect(stepIndex(0, 1, 3)).toBe(1)
        expect(stepIndex(2, -1, 3)).toBe(1)
    })

    // Was "stops at both ends instead of wrapping around" — the owner asked for the
    // opposite ("ở trang cuối bấm nút qua phải thì quay về câu 1"), so the invariant is
    // inverted rather than dropped: paging must still be total, and must still land inside
    // the album, only now by looping instead of by sticking.
    it("wraps around at both ends", () => {
        expect(stepIndex(2, 1, 3)).toBe(0)
        expect(stepIndex(0, -1, 3)).toBe(2)
    })

    it("keeps a jump bigger than the album inside it", () => {
        expect(stepIndex(0, 7, 3)).toBe(1)
        expect(stepIndex(0, -7, 3)).toBe(2)
    })

    it("cannot page a single-page album off itself", () => {
        expect(stepIndex(0, 1, 1)).toBe(0)
        expect(stepIndex(0, -1, 1)).toBe(0)
    })
})
