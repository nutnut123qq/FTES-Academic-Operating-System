import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
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

// Values are echoed into the key so two rows of the rank ladder (same key,
// different tier) stay distinguishable — a bare key would make every locked row
// carry the identical label.
vi.mock("next-intl", () => ({
    useTranslations: () => (key: string, values?: Record<string, unknown>) =>
        values
            ? `${key}(${Object.entries(values).map(([name, value]) => `${name}=${value}`).join(",")})`
            : key,
}))

vi.mock("@heroui/react", () => {
    const Pass = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
    // Closed modal renders NOTHING — the img/glyph counts asserted by the badge
    // cases below depend on the ladder staying out of the tree until opened.
    const Modal = Object.assign(
        ({ isOpen, children }: { isOpen?: boolean; children?: React.ReactNode }) =>
            isOpen ? <div>{children}</div> : null,
        { Backdrop: Pass, Container: Pass, Dialog: Pass, Header: Pass, Body: Pass, Footer: Pass },
    )
    return {
        Typography: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
        cn: (...classes: Array<string | undefined | false>) => classes.filter(Boolean).join(" "),
        Modal,
        Button: ({ children, onPress }: { children?: React.ReactNode; onPress?: () => void }) => (
            <button type="button" onClick={onPress}>{children}</button>
        ),
        Chip: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
    }
})

// MedalIcon / TrophyIcon are what the SHARED helper resolves to — kept
// distinguishable so a test can prove WHICH fallback was picked.
vi.mock("@phosphor-icons/react", () => ({
    FireIcon: () => <svg />,
    StarIcon: () => <svg />,
    MedalIcon: () => <svg data-testid="glyph-medal" />,
    TrophyIcon: () => <svg data-testid="glyph-trophy" />,
    LockSimpleIcon: () => <svg data-testid="glyph-lock" />,
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
let snapshotLoading = false
const revalidate = vi.fn()
vi.mock("../hooks/useQueryMyGamificationSwr", () => ({
    useQueryMyGamificationSwr: () => ({
        data: snapshot,
        isLoading: snapshotLoading,
        error: undefined,
        mutate: revalidate,
    }),
}))

// Phiên đăng nhập là BA trạng thái, không hai — xem khối "rank summary" cuối file.
let sessionSettled = true
let sessionAuthenticated = true
vi.mock("@/redux/hooks", () => ({
    useAppSelector: (select: (state: unknown) => unknown) =>
        select({
            keycloak: { initialized: sessionSettled, authenticated: sessionAuthenticated },
        }),
}))

vi.mock("@/components/blocks/skeleton/Skeleton", () => ({
    Skeleton: { Typography: () => <div data-testid="rank-skeleton" /> },
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
    snapshotLoading = false
    sessionSettled = true
    sessionAuthenticated = true
    revalidate.mockClear()
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

/**
 * The RANK LADDER opened by clicking the rank badge.
 *
 * The branch worth pinning is the one that can lie: which tiers get a padlock.
 * "Locked" must mean "we KNOW the viewer is short of the threshold" — a viewer
 * with no snapshot at all (guest, or `/me/*` still in flight) must see the ladder
 * unlocked and unmarked, because padlocking all five reads as "sign in to view
 * the rank ladder", which is not true.
 */
describe("LeaderboardShell — rank ladder popup", () => {
    it("opens from the rank badge and padlocks only the tiers above the viewer's XP", () => {
        // 1 500 XP ⇒ Bronze; Silver upward are out of reach.
        snapshot = withBadges([])

        render(<LeaderboardShell />)
        expect(screen.queryByTestId("glyph-lock")).toBeNull()

        fireEvent.click(screen.getByLabelText("rankTiers.openAria"))

        // All five tiers, ascending, each named once inside the ladder.
        expect(screen.getByText("rankTiers.currentAria(tier=tiers.bronze)")).toBeTruthy()
        expect(screen.getByText("rankTiers.lockedAria(tier=tiers.silver,xp=25k)")).toBeTruthy()
        expect(screen.getByText("rankTiers.lockedAria(tier=tiers.gold,xp=75k)")).toBeTruthy()
        expect(screen.getByText("rankTiers.lockedAria(tier=tiers.platinum,xp=125k)")).toBeTruthy()
        expect(screen.getByText("rankTiers.lockedAria(tier=tiers.diamond,xp=200k)")).toBeTruthy()

        // Four padlocks + four greyed arts, and the current tier carries the chip.
        expect(screen.getAllByTestId("glyph-lock")).toHaveLength(4)
        expect(document.querySelectorAll("img.grayscale")).toHaveLength(4)
        expect(screen.getByText("rankTiers.current")).toBeTruthy()
    })

    it("shows every tier UNLOCKED when the viewer's XP is unknown (guest / snapshot pending)", () => {
        snapshot = undefined

        render(<LeaderboardShell />)

        // The entry point survives without a snapshot — the ladder is public.
        fireEvent.click(screen.getByLabelText("rankTiers.openAria"))

        expect(screen.queryAllByTestId("glyph-lock")).toHaveLength(0)
        expect(screen.getByText("rankTiers.unlockedAria(tier=tiers.bronze)")).toBeTruthy()
        expect(screen.getByText("rankTiers.unlockedAria(tier=tiers.diamond)")).toBeTruthy()
        // …and nothing is claimed to be the viewer's current tier.
        expect(screen.queryByText("rankTiers.current")).toBeNull()
        expect(screen.queryByText(/^rankTiers\.currentAria/)).toBeNull()
    })
})

/**
 * KHỐI "HẠNG HIỆN TẠI" — ba trạng thái KHÔNG được gộp.
 *
 * Lỗi đã vá: nhánh dự phòng chỉ hỏi `my && rankTier`, mà `my` là `undefined` cho cả ba ca
 * (khách · phiên chưa ngã ngũ · `/me/progression` lỗi), nên NGƯỜI ĐANG ĐĂNG NHẬP bị đọc câu
 * "Đăng nhập để biết bạn đang ở hạng nào" — vĩnh viễn ở ca lỗi, và mỗi lần tải trang ở ca
 * hydrate, ngay bên trên bảng theo kỳ vẫn in `#hạng` của chính họ.
 */
describe("LeaderboardShell — rank summary tells the three session states apart", () => {
    it("says NOTHING about rank while the session has not settled (a signed-in user is here too)", () => {
        snapshot = undefined
        sessionSettled = false
        // Chính là ca bẫy: redux không persist nên `authenticated` là false ở MỌI lần tải
        // trang, kể cả với người đang đăng nhập.
        sessionAuthenticated = false

        render(<LeaderboardShell />)

        expect(screen.getByTestId("rank-skeleton")).toBeTruthy()
        expect(screen.queryByText("rankTiers.guestHint")).toBeNull()
        // Lối vào thang hạng vẫn còn — thang hạng là thông tin công khai.
        expect(screen.getByLabelText("rankTiers.openAria")).toBeTruthy()
    })

    it("says nothing about rank while /me/progression is still in flight", () => {
        snapshot = undefined
        snapshotLoading = true

        render(<LeaderboardShell />)

        expect(screen.getByTestId("rank-skeleton")).toBeTruthy()
        expect(screen.queryByText("rankTiers.guestHint")).toBeNull()
    })

    it("invites a GUEST to sign in — the one case that sentence is true", () => {
        snapshot = undefined
        sessionSettled = true
        sessionAuthenticated = false

        render(<LeaderboardShell />)

        expect(screen.getByText("rankTiers.guestHint")).toBeTruthy()
        expect(screen.queryByTestId("rank-skeleton")).toBeNull()
        expect(screen.queryByText("currentRank.unavailable")).toBeNull()
    })

    it("tells a SIGNED-IN viewer the rank could not be read, and offers a retry", () => {
        snapshot = undefined
        sessionSettled = true
        sessionAuthenticated = true

        render(<LeaderboardShell />)

        expect(screen.getByText("currentRank.unavailable")).toBeTruthy()
        // Không bao giờ được mời một người đang đăng nhập đi đăng nhập.
        expect(screen.queryByText("rankTiers.guestHint")).toBeNull()

        fireEvent.click(screen.getByText("currentRank.retry"))
        expect(revalidate).toHaveBeenCalledTimes(1)
    })
})
