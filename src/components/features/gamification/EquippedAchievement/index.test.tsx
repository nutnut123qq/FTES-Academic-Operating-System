import React from "react"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

/**
 * Component — the pinned-THÀNH TÍCH mark drawn after a person's name.
 *
 * Three states have to hold, and the middle one is the whole reason the shared
 * helpers exist:
 *  - `iconUrl` present ⇒ the seeded ARTWORK is drawn,
 *  - `iconUrl` null / ABSENT ⇒ the kind glyph from the SHARED `badgeKindIcon`
 *    map, and NO `<img>` at all — an `<img src="">` is a broken-image icon, and
 *    the backend field is landing separately so "no field" is a normal reading,
 *  - nothing pinned ⇒ NOTHING rendered: no empty box, no placeholder span. Most
 *    accounts pin nothing, so their markup must stay exactly as it was.
 *
 * The accessible name comes from the shared `useBadgeLabel` precedence, because
 * the artwork alone tells a screen reader nothing.
 */

vi.mock("next-intl", () => ({
    useTranslations: () => {
        // No curated milestone name in this catalog → the resolver falls through to
        // the backend name, then to the humanized code. That IS the case under test.
        const t = (key: string) => key
        t.has = () => false
        return t
    },
}))

vi.mock("@heroui/react", () => ({
    cn: (...values: Array<unknown>) => values.filter(Boolean).join(" "),
}))

// The two glyphs the SHARED helper resolves to — kept distinguishable so a case
// can prove WHICH fallback was picked, not merely that something was drawn.
vi.mock("@phosphor-icons/react", () => ({
    MedalIcon: () => <svg data-testid="glyph-medal" />,
    TrophyIcon: () => <svg data-testid="glyph-trophy" />,
}))

const { EquippedAchievement } = await import("./index")

describe("EquippedAchievement — the mark after a name", () => {
    it("draws the seeded artwork when the pinned achievement has one", () => {
        const { container } = render(
            <EquippedAchievement
                achievement={{
                    code: "FIRST_LESSON",
                    name: "Bài học đầu tiên",
                    kind: "TROPHY",
                    iconUrl: "https://cdn.example/first-lesson.png",
                }}
            />,
        )

        const art = container.querySelector("img")
        expect(art?.getAttribute("src")).toBe("https://cdn.example/first-lesson.png")
        // Art is decorative: the wrapper already carries the accessible name, so a
        // screen reader must not hear the badge twice.
        expect(art?.getAttribute("alt")).toBe("")
        expect(screen.queryByTestId("glyph-trophy")).toBeNull()
    })

    it("falls back to the kind glyph — and renders no <img> — when the art is null", () => {
        const { container } = render(
            <EquippedAchievement
                achievement={{ code: "STREAK_7", name: "Tuần Lửa", kind: "TROPHY", iconUrl: null }}
            />,
        )

        expect(screen.getByTestId("glyph-trophy")).toBeTruthy()
        expect(container.querySelector("img")).toBeNull()
    })

    it("treats an ABSENT iconUrl exactly like null (backend not deployed yet)", () => {
        const { container } = render(
            <EquippedAchievement achievement={{ code: "FIRST_POST", name: "Bài đăng đầu tiên" }} />,
        )

        // Unknown/absent kind must still draw something — the medal default.
        expect(screen.getByTestId("glyph-medal")).toBeTruthy()
        expect(container.querySelector("img")).toBeNull()
    })

    it("renders NOTHING AT ALL when nothing is pinned", () => {
        for (const achievement of [null, undefined, { code: "   " }]) {
            const { container } = render(<EquippedAchievement achievement={achievement} />)
            expect(container.innerHTML).toBe("")
        }
    })

    it("names the mark for a screen reader, resolved through the shared label rule", () => {
        render(
            <EquippedAchievement
                achievement={{ code: "STREAK_30", name: "Tháng Bền Bỉ", iconUrl: "u" }}
            />,
        )

        // No curated translation in this catalog ⇒ the BACKEND name, never the key
        // path and never the raw code.
        const mark = screen.getByRole("img", { name: "Tháng Bền Bỉ" })
        expect(mark.getAttribute("title")).toBe("Tháng Bền Bỉ")
    })

    it("humanizes the code when the backend sent no name either", () => {
        render(<EquippedAchievement achievement={{ code: "FIRST_ENROLL", iconUrl: "u" }} />)

        expect(screen.getByRole("img", { name: "First Enroll" })).toBeTruthy()
    })
})
