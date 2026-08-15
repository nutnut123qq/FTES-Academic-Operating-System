import { describe, expect, it } from "vitest"
import {
    accentForeground,
    isAccentHex,
    isBackgroundEffect,
} from "./appearance"

/**
 * The custom-accent helpers are the only non-trivial logic in the appearance
 * constants: they decide what gets written onto `<html>` when a user picks a
 * free-form colour, so a wrong branch means unreadable text app-wide.
 */
describe("accentForeground", () => {
    it("uses the dark foreground on light accents and white on dark ones", () => {
        // YIQ(#ffffff) = 255 -> dark text; YIQ(#000000) = 0 -> white text
        expect(accentForeground("#ffffff")).toBe("oklch(21.03% 0.0015 354.13)")
        expect(accentForeground("#000000")).toBe("oklch(100% 0 0)")
        // #3F51B5 (the default indigo) is dark enough to keep white text
        expect(accentForeground("#3F51B5")).toBe("oklch(100% 0 0)")
    })

    it("expands the 3-digit shorthand instead of misreading it", () => {
        expect(accentForeground("#fff")).toBe(accentForeground("#ffffff"))
    })

    it("falls back to the white foreground when the hex is garbage", () => {
        // NaN comparisons are false -> the safe, preset-matching branch
        expect(accentForeground("#zzzzzz")).toBe("oklch(100% 0 0)")
    })
})

describe("isAccentHex", () => {
    it("accepts #rgb and #rrggbb only", () => {
        expect(isAccentHex("#fff")).toBe(true)
        expect(isAccentHex("#3F51B5")).toBe(true)
        expect(isAccentHex("3F51B5")).toBe(false)
        expect(isAccentHex("#3F51B")).toBe(false)
        expect(isAccentHex("red")).toBe(false)
        expect(isAccentHex(null)).toBe(false)
    })
})

describe("isBackgroundEffect", () => {
    it("guards persisted values against unknown effects", () => {
        expect(isBackgroundEffect("aurora")).toBe(true)
        expect(isBackgroundEffect("none")).toBe(true)
        expect(isBackgroundEffect("sparkles")).toBe(false)
        expect(isBackgroundEffect(undefined)).toBe(false)
    })
})
