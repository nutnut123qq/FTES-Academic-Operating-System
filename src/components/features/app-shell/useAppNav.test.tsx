import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Unit — `useAppNav`, the single source of the top-level modules. Asserts the
 * Leaderboard tab sits in the fixed order Home · Workplace · Course · Community ·
 * Leaderboard (Leaderboard last) with path `/leaderboard`, and that its active state
 * is a route-prefix match: on it at `/leaderboard` and every `/leaderboard/<sub>`,
 * off it on the home route and on unrelated modules.
 *
 * These cases used to guard the Blog tab, which held the same slot until it was
 * swapped out of the header (2026-08-19) — the SHAPE of the guarantee is unchanged,
 * only the module it applies to.
 *
 * `next-intl` and `@/i18n/navigation` are mocked so the hook can run outside a
 * Next request: `t(key)` is the identity (label === nav key) and the pathname is
 * driven per-test. `pathConfig` is the real (pure string-building) module.
 */

const pathname = vi.fn<() => string>(() => "/")

vi.mock("@/i18n/navigation", () => ({
    usePathname: () => pathname(),
}))

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
}))

import { useAppNav } from "./useAppNav"

const keyed = (route: string) => {
    pathname.mockReturnValue(route)
    return renderHook(() => useAppNav()).result.current
}

describe("useAppNav — Leaderboard is the 5th plain-link module", () => {
    beforeEach(() => {
        pathname.mockReturnValue("/")
    })

    it("returns the modules in order with correct keys and paths", () => {
        const modules = keyed("/")

        expect(modules.map((m) => m.key)).toEqual([
            "home",
            "workplace",
            "course",
            "community",
            "leaderboard",
        ])
        expect(modules.map((m) => m.path)).toEqual([
            "/",
            "/subjects",
            "/courses",
            "/community",
            "/leaderboard",
        ])

        // label comes from t(nav.<key>); the mock returns the key verbatim.
        // Leaderboard is now the LAST module (it took Blog's slot). The Quests board is NOT
        // in the account menu — it is reached from the `DailyQuest` widget on the dashboard
        // Overview tab (5e08bf1).
        const leaderboard = modules.at(-1)
        expect(leaderboard?.key).toBe("leaderboard")
        expect(leaderboard?.label).toBe("leaderboard")
        expect(leaderboard?.path).toBe("/leaderboard")
    })

    it("marks Leaderboard active on the /leaderboard index (and Home inactive there)", () => {
        const modules = keyed("/leaderboard")
        expect(modules.find((m) => m.key === "leaderboard")?.isActive).toBe(true)
        expect(modules.find((m) => m.key === "home")?.isActive).toBe(false)
    })

    it("keeps Leaderboard active on a /leaderboard/<sub> route (prefix match)", () => {
        const modules = keyed("/leaderboard/guide")
        expect(modules.find((m) => m.key === "leaderboard")?.isActive).toBe(true)
    })

    it("does NOT mark Leaderboard active on the home route", () => {
        const modules = keyed("/")
        expect(modules.find((m) => m.key === "leaderboard")?.isActive).toBe(false)
        expect(modules.find((m) => m.key === "home")?.isActive).toBe(true)
    })

    it("does NOT mark Leaderboard active on an unrelated module route", () => {
        const modules = keyed("/subjects")
        expect(modules.find((m) => m.key === "leaderboard")?.isActive).toBe(false)
        expect(modules.find((m) => m.key === "workplace")?.isActive).toBe(true)
    })

    it("does NOT treat a sibling prefix like /leaderboardfoo as a Leaderboard match", () => {
        const modules = keyed("/leaderboardfoo")
        expect(modules.find((m) => m.key === "leaderboard")?.isActive).toBe(false)
    })
})

/**
 * Bề mặt CỦA cộng đồng nằm NGOÀI cây `/community` — `/groups`, `/events`, `/blog`
 * (góp ý #21 bọc cả ba trong `CommunityNavShell`, cùng rail trái). Trước đây
 * `useAppNav` chỉ so-khớp `/community`, nên đứng ở ba route đó header KHÔNG sáng
 * mục nào. Bộ ca này ghim: alias sáng "Cộng đồng", còn module khác thì không.
 */
describe("useAppNav — Community sáng cả ở route alias (/groups · /events · /blog)", () => {
    beforeEach(() => {
        pathname.mockReturnValue("/")
    })

    const communityIsActive = (route: string) =>
        keyed(route).find((m) => m.key === "community")?.isActive

    it.each(["/community", "/community/xyz", "/blog", "/groups", "/events", "/groups/abc"])(
        "sáng Cộng đồng ở %s",
        (route) => {
            expect(communityIsActive(route)).toBe(true)
        },
    )

    it.each(["/", "/leaderboard", "/subjects", "/blogfoo", "/groupsfoo"])(
        "KHÔNG sáng Cộng đồng ở %s",
        (route) => {
            expect(communityIsActive(route)).toBe(false)
        },
    )

    it("không kéo module khác sáng theo ở route alias", () => {
        const modules = keyed("/blog")
        expect(modules.find((m) => m.key === "home")?.isActive).toBe(false)
        expect(modules.find((m) => m.key === "leaderboard")?.isActive).toBe(false)
        expect(modules.filter((m) => m.isActive).map((m) => m.key)).toEqual(["community"])
    })
})
