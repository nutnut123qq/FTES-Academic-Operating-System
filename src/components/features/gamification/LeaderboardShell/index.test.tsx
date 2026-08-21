import React from "react"
import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { MyGamification } from "../hooks/useQueryMyGamificationSwr"

/**
 * Component — the BADGES strip of `/leaderboard`.
 *
 * The bug this pins: the strip drew ONE hardcoded trophy for every badge, so
 * "Bài học đầu tiên", "Bài viết đầu tiên" and "Top 10" were six identical blue
 * cups, while the profile achievement wall showed the real seeded artwork for
 * the same badges.
 *
 * Three states have to hold, because the backend field is landing separately:
 *  - `iconUrl` present  ⇒ the ARTWORK is drawn (decorative: the label below names it),
 *  - `iconUrl` null     ⇒ the kind glyph and no ACHIEVEMENT `<img>` (the rank badge
 *                         remains; an `<img src="">` would still be a broken image),
 *  - `iconUrl` ABSENT   ⇒ same as null (backend not deployed yet).
 *
 * The fallback glyph is the shared `badgeKindIcon` mapping — the same one the
 * profile badge catalog uses — so the two surfaces cannot disagree.
 */

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
}))

vi.mock("@heroui/react", () => ({
    Typography: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
    cn: (...classes: Array<string | undefined>) => classes.filter(Boolean).join(" "),
}))

// MedalIcon / TrophyIcon are what the SHARED helper resolves to — kept
// distinguishable so a test can prove WHICH fallback was picked.
vi.mock("@phosphor-icons/react", () => ({
    FireIcon: () => <svg />,
    StarIcon: () => <svg />,
    MedalIcon: () => <svg data-testid="glyph-medal" />,
    TrophyIcon: () => <svg data-testid="glyph-trophy" />,
}))

vi.mock("@/i18n/navigation", () => ({
    Link: ({ children }: { children?: React.ReactNode }) => <a>{children}</a>,
}))

vi.mock("@/resources/path", () => ({
    pathConfig: () => ({
        locale: () => ({ leaderboard: () => ({ build: () => "/leaderboard" }) }),
    }),
}))

vi.mock("@/components/reuseable/SectionCard", () => ({
    SectionCard: ({ children }: { children?: React.ReactNode }) => <section>{children}</section>,
}))
vi.mock("@/components/blocks/stats/ProgressMeter", () => ({
    ProgressMeter: ({ value, max, label }: { value: number; max: number; label?: React.ReactNode }) => (
        <div data-testid="rank-progress" data-value={value} data-max={max}>{label}</div>
    ),
}))

// Neighbours of the strip: each has its own suite, none is under test here.
vi.mock("../GamificationEventHost", () => ({ GamificationEventHost: () => <div /> }))
vi.mock("../SeasonBoards", () => ({
    SeasonBoards: ({ rankSummary }: { rankSummary?: React.ReactNode }) => <div>{rankSummary}</div>,
}))

// The label rule is NOT what this suite tests — it only has to prove the strip
// still asks for it with (code, backendName) and renders the answer verbatim.
vi.mock("../useBadgeLabel", () => ({
    useBadgeLabel: () => (code: string, backendName?: string | null) =>
        `label(${code}|${backendName ?? ""})`,
}))

let snapshot: MyGamification | undefined
vi.mock("../hooks/useQueryMyGamificationSwr", () => ({
    useQueryMyGamificationSwr: () => ({ data: snapshot, isLoading: false, error: undefined }),
}))

const { LeaderboardShell } = await import("./index")

/** A snapshot carrying exactly the badges a case needs. */
const withBadges = (badges: MyGamification["badges"]): MyGamification => ({
    xp: 1500,
    level: 5,
    levelProgress: { current: 1500, nextThreshold: 1760 },
    streak: { current: 3, days: [] },
    rank: { position: 2, league: "bronze" },
    badges,
})

beforeEach(() => {
    snapshot = undefined
})

describe("LeaderboardShell — badge strip draws the real art", () => {
    it("renders the seeded artwork when the badge has an iconUrl", () => {
        snapshot = withBadges([
            {
                id: "FIRST_LESSON",
                badgeKey: "FIRST_LESSON",
                fallbackName: "Bài học đầu tiên",
                earnedDate: "2026-07-10",
                kind: "BADGE",
                iconUrl: "https://cdn.example/first-lesson.png",
            },
        ])

        render(<LeaderboardShell />)

        const art = document.querySelector("img[src='https://cdn.example/first-lesson.png']")
        expect(art?.getAttribute("src")).toBe("https://cdn.example/first-lesson.png")
        // Decorative: the label right below already names the badge, so the image
        // must not be announced twice.
        expect(art?.getAttribute("alt")).toBe("")
        expect(art?.getAttribute("aria-hidden")).toBe("true")
        expect(art?.classList.contains("size-12")).toBe(true)
        // Art present ⇒ no glyph beside it.
        expect(screen.queryByTestId("glyph-medal")).toBeNull()
        expect(screen.queryByTestId("glyph-trophy")).toBeNull()
        // …and the label still comes from the shared resolver, untouched.
        expect(screen.getByText("label(FIRST_LESSON|Bài học đầu tiên)")).toBeTruthy()
    })

    it("shows the total-XP rank before the seasonal leaderboard", () => {
        snapshot = withBadges([])

        render(<LeaderboardShell />)

        expect(screen.getByText("currentRank.title")).toBeTruthy()
        expect(screen.getByText("tiers.bronze")).toBeTruthy()
        expect(screen.getByText("#2")).toBeTruthy()
        const rankBadge = document.querySelector("img[src='/gamification/badges/badge-bronze.png']")
        expect(rankBadge).toBeTruthy()
        expect(rankBadge?.getAttribute("alt")).toBe("")
        expect(rankBadge?.getAttribute("aria-hidden")).toBe("true")
        expect(rankBadge?.classList.contains("size-16")).toBe(true)
        const progress = screen.getByTestId("rank-progress")
        expect(progress.getAttribute("data-value")).toBe("1500")
        expect(progress.getAttribute("data-max")).toBe("25000")
    })

    it("falls back to the kind glyph without broken achievement art when iconUrl is null", () => {
        snapshot = withBadges([
            {
                id: "TOP_10",
                badgeKey: "TOP_10",
                fallbackName: "Top 10",
                earnedDate: "2026-07-11",
                kind: "TROPHY",
                iconUrl: null,
            },
        ])

        render(<LeaderboardShell />)

        // Only the always-present rank badge remains: no empty/broken achievement image.
        expect(document.querySelectorAll("img")).toHaveLength(1)
        expect(document.querySelector("img[src='']")).toBeNull()
        // TROPHY → trophy, exactly as the profile badge catalog maps it.
        expect(screen.getByTestId("glyph-trophy")).toBeTruthy()
        expect(screen.getByText("label(TOP_10|Top 10)")).toBeTruthy()
    })

    it("falls back to the kind glyph when the art field is ABSENT (backend not deployed)", () => {
        snapshot = withBadges([
            // No `iconUrl` key at all — the shape today's backend returns.
            {
                id: "FIRST_POST",
                badgeKey: "FIRST_POST",
                fallbackName: "Bài viết đầu tiên",
                earnedDate: "2026-07-12",
                kind: "BADGE",
            },
        ])

        render(<LeaderboardShell />)

        expect(document.querySelectorAll("img")).toHaveLength(1)
        expect(document.querySelector("img[src='']")).toBeNull()
        // BADGE → medal (the catalog's mapping), not the old hardcoded trophy.
        expect(screen.getByTestId("glyph-medal")).toBeTruthy()
        expect(screen.queryByTestId("glyph-trophy")).toBeNull()
    })

    it("still renders a badge whose kind is unknown/absent, using the medal default", () => {
        snapshot = withBadges([
            {
                id: "SEEDED_TOMORROW",
                badgeKey: "SEEDED_TOMORROW",
                fallbackName: "Huy hiệu mới",
                earnedDate: "2026-07-13",
            },
        ])

        render(<LeaderboardShell />)

        expect(screen.getByTestId("glyph-medal")).toBeTruthy()
        expect(screen.getByText("label(SEEDED_TOMORROW|Huy hiệu mới)")).toBeTruthy()
    })

    it("shows the empty copy (and no glyph) when the viewer has no badges", () => {
        snapshot = withBadges([])

        render(<LeaderboardShell />)

        expect(screen.getByText("badgesEmpty")).toBeTruthy()
        expect(screen.queryByTestId("glyph-medal")).toBeNull()
        expect(document.querySelectorAll("img")).toHaveLength(1)
        expect(document.querySelector("img[src='']")).toBeNull()
    })
})
