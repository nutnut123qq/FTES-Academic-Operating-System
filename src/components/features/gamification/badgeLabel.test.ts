import { describe, expect, it, vi } from "vitest"

import { humanizeBadgeCode, resolveBadgeLabel, type MilestoneCatalog } from "./badgeLabel"

/**
 * Unit — the precedence that keeps a raw i18n key path off the badges grid.
 *
 * The defect this covers was on the live profile: the owner's badge cards read
 * `gamification.milestones.FIRST_ENROLL.name`, `…STREAK_3.name`,
 * `…FIRST_COMMENT.name`, `…FIRST_POST.name` — milestone rows the backend awards
 * but the FE catalog never heard of. Milestones are DATA, so the catalog can
 * always fall behind; the chain (curated → backend name → humanized code) is
 * what has to hold, for ANY code, not a hardcoded list of known ones.
 */

/** A catalog carrying exactly the curated entries passed in. */
const catalogOf = (entries: Record<string, string>): MilestoneCatalog => ({
    has: (key) => key in entries,
    get: (key) => entries[key],
})

/** The six curated milestones, as they read in the English catalog. */
const curated = catalogOf({
    "FIRST_LESSON.name": "First Lesson",
    "STREAK_7.name": "Week of Fire",
})

describe("resolveBadgeLabel", () => {
    it("prefers the curated translation for a code the catalog knows", () => {
        expect(resolveBadgeLabel(curated, "FIRST_LESSON", "Bài học đầu tiên")).toBe("First Lesson")
        // The curated name wins even against a backend name — it is the localized,
        // hand-written one.
        expect(resolveBadgeLabel(curated, "STREAK_7", "Streak 7")).toBe("Week of Fire")
    })

    it("falls back to the backend name for a milestone the catalog never heard of", () => {
        // Exactly the four codes that leaked their key path onto the profile.
        expect(resolveBadgeLabel(curated, "FIRST_ENROLL", "Ghi danh đầu tiên")).toBe(
            "Ghi danh đầu tiên",
        )
        expect(resolveBadgeLabel(curated, "STREAK_3", "Chuỗi 3 ngày")).toBe("Chuỗi 3 ngày")
        expect(resolveBadgeLabel(curated, "FIRST_COMMENT", "Bình luận đầu tiên")).toBe(
            "Bình luận đầu tiên",
        )
        expect(resolveBadgeLabel(curated, "FIRST_POST", "Bài đăng đầu tiên")).toBe(
            "Bài đăng đầu tiên",
        )
    })

    it("humanizes the code when there is neither a translation nor a backend name", () => {
        for (const [code, expected] of [
            ["FIRST_ENROLL", "First Enroll"],
            ["STREAK_3", "Streak 3"],
            ["FIRST_COMMENT", "First Comment"],
            ["FIRST_POST", "First Post"],
        ] as const) {
            for (const missing of [undefined, null, "", "   "]) {
                const label = resolveBadgeLabel(curated, code, missing)
                expect(label).toBe(expected)
                // The whole point: a key path can NEVER reach the screen.
                expect(label).not.toContain("gamification.milestones")
            }
        }
    })

    it("never reads the catalog for a code it did not confirm (soft probe only)", () => {
        const get = vi.fn(() => "should not be called")
        const label = resolveBadgeLabel({ has: () => false, get }, "BRAND_NEW_BADGE", null)

        expect(get).not.toHaveBeenCalled()
        expect(label).toBe("Brand New Badge")
    })

    it("degrades to the backend name when the badge carries no code at all", () => {
        expect(resolveBadgeLabel(curated, null, "Mystery Badge")).toBe("Mystery Badge")
        expect(resolveBadgeLabel(curated, "  ", "Mystery Badge")).toBe("Mystery Badge")
        expect(resolveBadgeLabel(curated, undefined, undefined)).toBe("")
    })
})

describe("humanizeBadgeCode", () => {
    it("never leaves an underscore or an all-caps code on screen", () => {
        expect(humanizeBadgeCode("FIRST_LESSON")).toBe("First Lesson")
        expect(humanizeBadgeCode("STREAK_100")).toBe("Streak 100")
        expect(humanizeBadgeCode("CHALLENGER")).toBe("Challenger")
    })
})
