import { describe, expect, it } from "vitest"

import { badgeCodeFromTitle, toEarnedDateLabel } from "./model"

/**
 * Unit — the read-path guards behind the profile achievements section.
 *
 * The two defects these cover were both visible on the live profile: a row
 * rendering "Earned Invalid Date" (the backend sends `achievedAt: null` on most
 * system-awarded rows) and a row titled "Badge FIRST_LESSON" (the backend's
 * fallback title when the award event carried no `badgeName`).
 */

describe("toEarnedDateLabel", () => {
    it("formats a full ISO instant", () => {
        expect(toEarnedDateLabel("2026-07-28T10:15:00Z", "en-US")).toBe("07/28/2026")
    })

    it("formats a date-only string on the day the backend meant", () => {
        // Parsed naively this is UTC midnight, which renders as 07/27 west of
        // Greenwich; the helper pins it to local midnight instead.
        expect(toEarnedDateLabel("2026-07-28", "en-US")).toBe("07/28/2026")
    })

    it("returns null when the backend sent no date", () => {
        expect(toEarnedDateLabel(null, "en-US")).toBeNull()
        expect(toEarnedDateLabel(undefined, "en-US")).toBeNull()
        expect(toEarnedDateLabel("", "en-US")).toBeNull()
        expect(toEarnedDateLabel("   ", "en-US")).toBeNull()
    })

    it("returns null — never the string 'Invalid Date' — for garbage", () => {
        for (const garbage of ["not-a-date", "T00:00:00", "0000-99-99", "??"]) {
            const label = toEarnedDateLabel(garbage, "en-US")
            expect(label).toBeNull()
            expect(label ?? "").not.toContain("Invalid Date")
        }
    })
})

describe("badgeCodeFromTitle", () => {
    it("recovers the code from the backend fallback title", () => {
        expect(badgeCodeFromTitle("Badge FIRST_LESSON")).toBe("FIRST_LESSON")
        expect(badgeCodeFromTitle("Badge streak_7")).toBe("STREAK_7")
    })

    it("recovers a bare SCREAMING_SNAKE code", () => {
        expect(badgeCodeFromTitle("LESSON_100")).toBe("LESSON_100")
    })

    it("leaves a human title alone", () => {
        expect(badgeCodeFromTitle("Bài học đầu tiên")).toBeNull()
        expect(badgeCodeFromTitle("Challenger")).toBeNull()
        expect(badgeCodeFromTitle("Badge of Honour is mine")).toBeNull()
        expect(badgeCodeFromTitle("")).toBeNull()
        expect(badgeCodeFromTitle(null)).toBeNull()
    })
})
