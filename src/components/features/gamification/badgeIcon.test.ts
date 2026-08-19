import { describe, expect, it, vi } from "vitest"

/**
 * Unit — the ONE badge fallback-glyph mapping (`badgeKindIcon`).
 *
 * It is shared by the leaderboard badge strip, the profile Progress grid and the
 * three profile badge-catalog surfaces, so what is pinned here is the property
 * that made it worth lifting: every kind resolves to exactly one component, and
 * an unknown / missing kind still resolves to SOMETHING (never `undefined`,
 * which would crash the JSX that renders it as `<Icon />`).
 */

vi.mock("@phosphor-icons/react", () => ({
    MedalIcon: () => null,
    TrophyIcon: () => null,
}))

const { badgeKindIcon } = await import("./badgeIcon")
const { MedalIcon, TrophyIcon } = await import("@phosphor-icons/react")

describe("badgeKindIcon", () => {
    it("maps the seeded kinds the backend uses today", () => {
        expect(badgeKindIcon("TROPHY")).toBe(TrophyIcon)
        expect(badgeKindIcon("BADGE")).toBe(MedalIcon)
        expect(badgeKindIcon("TITLE")).toBe(MedalIcon)
    })

    it("degrades to the medal for a kind seeded after this release", () => {
        // Kinds are DATA, not a frontend enum — `STREAK` is already awarded today.
        expect(badgeKindIcon("STREAK")).toBe(MedalIcon)
    })

    it("degrades to the medal when there is no kind at all", () => {
        expect(badgeKindIcon(null)).toBe(MedalIcon)
        expect(badgeKindIcon(undefined)).toBe(MedalIcon)
        expect(badgeKindIcon("")).toBe(MedalIcon)
    })
})
