import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Unit — `useAppNav`, the single source of the five top-level modules
 * (change `blog-nav-and-engagement`, task 1.4). Asserts the Blog tab is the 5th
 * module in the fixed order Home · Workplace · Course · Community · Blog with
 * path `/blog`, and that its active state is a route-prefix match: on it at
 * `/blog` and every `/blog/<slug>`, off it on the home route and on unrelated
 * modules.
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

describe("useAppNav — Blog is the 5th plain-link module", () => {
    beforeEach(() => {
        pathname.mockReturnValue("/")
    })

    it("returns exactly five modules in order with correct keys and paths", () => {
        const modules = keyed("/")

        expect(modules.map((m) => m.key)).toEqual([
            "home",
            "workplace",
            "course",
            "community",
            "blog",
        ])
        expect(modules.map((m) => m.path)).toEqual([
            "/",
            "/subjects",
            "/courses",
            "/community",
            "/blog",
        ])

        // label comes from t(nav.<key>); the mock returns the key verbatim.
        const blog = modules.at(-1)
        expect(blog?.key).toBe("blog")
        expect(blog?.label).toBe("blog")
        expect(blog?.path).toBe("/blog")
    })

    it("marks Blog active on the /blog index (and Home inactive there)", () => {
        const modules = keyed("/blog")
        expect(modules.find((m) => m.key === "blog")?.isActive).toBe(true)
        expect(modules.find((m) => m.key === "home")?.isActive).toBe(false)
    })

    it("keeps Blog active on a /blog/<slug> article route (prefix match)", () => {
        const modules = keyed("/blog/some-article-slug")
        expect(modules.find((m) => m.key === "blog")?.isActive).toBe(true)
    })

    it("does NOT mark Blog active on the home route", () => {
        const modules = keyed("/")
        expect(modules.find((m) => m.key === "blog")?.isActive).toBe(false)
        expect(modules.find((m) => m.key === "home")?.isActive).toBe(true)
    })

    it("does NOT mark Blog active on an unrelated module route", () => {
        const modules = keyed("/subjects")
        expect(modules.find((m) => m.key === "blog")?.isActive).toBe(false)
        expect(modules.find((m) => m.key === "workplace")?.isActive).toBe(true)
    })

    it("does NOT treat a sibling prefix like /blogfoo as a Blog match", () => {
        const modules = keyed("/blogfoo")
        expect(modules.find((m) => m.key === "blog")?.isActive).toBe(false)
    })
})
