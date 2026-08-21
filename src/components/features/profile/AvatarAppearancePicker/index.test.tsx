import React from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { BadgeCatalogItem } from "@/modules/api/rest/gamification"
import type { SelfProfile } from "@/modules/api/rest/profile"

/**
 * Component — the THÀNH TÍCH block of the "setup khung" screen.
 *
 * The owner asked for the pinned achievement to be chosen in the SAME screen as
 * the avatar frame ("cũng cho nó setup trong cái phần setup khung luôn nhé"), so
 * it copies the frame block exactly: apply on click (no Save button), the write
 * goes down the same `PATCH /me` path, and the returned profile is fed straight
 * into the shared self-profile cache.
 *
 * What is pinned here:
 *  - picking sends the CODE,
 *  - the "none" tile sends the EMPTY STRING — the same clear-sentinel `avatarFrame`
 *    already uses; sending `null` would mean "leave the field alone" and the mark
 *    could never be taken off,
 *  - only EARNED achievements are offered (the backend rejects an unearned code
 *    with a 400, so an always-failing tile is worse than no tile),
 *  - but EVERY kind of them — BADGE, TITLE and TROPHY are one pool, and `kind`
 *    never gates what may be pinned,
 *  - the header carries the WHOLE-catalog tally ("Đã đạt X/Y", the Thành tích
 *    tab's own key and numbers) so the earned-only list cannot be misread as a
 *    smaller, separate collection,
 *  - the whole block disappears when nothing has been earned / the backend has
 *    not shipped, exactly how the frame block degrades on an empty catalog.
 */

const updateSelfProfile = vi.fn()
const setDefaultAvatar = vi.fn()
const mutate = vi.fn()

let profile: SelfProfile | undefined
let catalogItems: Array<BadgeCatalogItem> = []
let catalogCounts: { earnedCount: number; totalCount: number } | null = null

// Keys render as themselves; a key WITH ICU values renders "key a=1 b=2" so a case can
// assert the interpolated numbers (the "Đã đạt X/Y" line) and not just the key name.
vi.mock("next-intl", () => ({
    useTranslations: () => {
        const t = (key: string, values?: Record<string, unknown>) =>
            values
                ? `${key} ${Object.entries(values)
                    .map(([name, value]) => `${name}=${String(value)}`)
                    .join(" ")}`
                : key
        t.has = () => false
        return t
    },
}))

vi.mock("@heroui/react", () => ({
    Typography: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
    cn: (...values: Array<unknown>) => values.filter(Boolean).join(" "),
}))

vi.mock("@phosphor-icons/react", () => ({
    CheckIcon: () => <svg />,
    LockSimpleIcon: () => <svg />,
    ProhibitIcon: () => <svg />,
    MedalIcon: () => <svg data-testid="glyph-medal" />,
    TrophyIcon: () => <svg data-testid="glyph-trophy" />,
}))

vi.mock("@/modules/api/rest/profile", () => ({
    getSelfProfile: vi.fn(),
    setDefaultAvatar: (code: string) => setDefaultAvatar(code),
    updateSelfProfile: (body: unknown) => updateSelfProfile(body),
}))

vi.mock("swr", () => ({
    default: () => ({ data: profile, mutate }),
}))

vi.mock("@/components/features/profile/hooks/useQueryProfileSwr", () => ({
    useSelfProfileKey: () => ["SELF_PROFILE"],
}))

// The avatar/frame catalog is empty on purpose: those two blocks have their own
// behaviour and hiding them keeps the queried tiles unambiguous.
vi.mock("@/components/features/profile/hooks/useAppearanceCatalogSwr", () => ({
    useAppearanceCatalogSwr: () => ({ avatars: [], frames: [], isLoading: false }),
}))

// `earnedCount`/`totalCount` are the BACKEND's own tallies and cover the WHOLE catalog —
// `totalCount` counts locked rows the picker never lists. A case sets `catalogCounts` to
// pull them apart from `items.length`; otherwise they derive realistically from `items`.
vi.mock("@/hooks/swr/api/rest/queries/useGetBadgeCatalogSwr", () => ({
    useGetBadgeCatalogSwr: () => ({
        data: {
            earnedCount: catalogCounts?.earnedCount ?? catalogItems.filter((i) => i.earned).length,
            totalCount: catalogCounts?.totalCount ?? catalogItems.length,
            items: catalogItems,
        },
    }),
}))

vi.mock("@/components/reuseable/UserAvatar", () => ({ UserAvatar: () => <span /> }))
vi.mock("@/components/features/gamification/AvatarWithFrame", () => ({
    AvatarWithFrame: () => <span />,
}))

// The rest wrapper is toast/error plumbing; here it only has to resolve to what
// the API returned, which is what the cache write is proven against.
vi.mock("@/modules/toast/hooks", () => ({
    useRestWithToast: () => (action: () => Promise<unknown>) => action(),
}))

const { AvatarAppearancePicker } = await import("./index")

/** A catalog row, earned unless a case says otherwise. */
const item = (over: Partial<BadgeCatalogItem> = {}): BadgeCatalogItem => ({
    code: "FIRST_LESSON",
    kind: "TROPHY",
    name: "Bài học đầu tiên",
    description: "Hoàn thành bài học đầu tiên",
    iconUrl: "https://cdn.example/first-lesson.png",
    counterKey: null,
    threshold: 1,
    progress: 1,
    earned: true,
    awardedAt: "2026-08-01T00:00:00Z",
    sortOrder: 1,
    ...over,
})

const selfProfile = (over: Partial<SelfProfile> = {}): SelfProfile =>
    ({
        userId: "u-1",
        username: "minh",
        displayName: "Minh Trần",
        avatarUrl: null,
        avatarFrame: null,
        equippedAchievement: null,
        ...over,
    }) as SelfProfile

beforeEach(() => {
    updateSelfProfile.mockReset().mockResolvedValue(selfProfile({ username: "fresh" }))
    setDefaultAvatar.mockReset()
    mutate.mockReset()
    profile = selfProfile()
    catalogItems = [item(), item({ code: "STREAK_7", name: "Tuần Lửa", iconUrl: null })]
    catalogCounts = null
})

describe("AvatarAppearancePicker — pinning an achievement", () => {
    it("sends the achievement CODE down the same PATCH /me path as the frame", async () => {
        render(<AvatarAppearancePicker />)

        fireEvent.click(screen.getByRole("button", { name: "Bài học đầu tiên" }))

        await waitFor(() =>
            expect(updateSelfProfile).toHaveBeenCalledWith({ equippedAchievement: "FIRST_LESSON" }),
        )
    })

    it("sends the EMPTY-STRING clear sentinel from the 'none' tile", async () => {
        profile = selfProfile({
            equippedAchievement: { code: "FIRST_LESSON", name: "Bài học đầu tiên" },
        })
        render(<AvatarAppearancePicker />)

        fireEvent.click(screen.getByRole("button", { name: "achievementNone" }))

        await waitFor(() => expect(updateSelfProfile).toHaveBeenCalledWith({ equippedAchievement: "" }))
    })

    it("writes the returned profile straight into the shared self-profile cache", async () => {
        const fresh = selfProfile({ username: "fresh" })
        updateSelfProfile.mockResolvedValue(fresh)
        render(<AvatarAppearancePicker />)

        fireEvent.click(screen.getByRole("button", { name: "Bài học đầu tiên" }))

        // revalidate:false because the PATCH response IS the truth — a follow-up GET
        // would only cost a round-trip to learn what we already hold.
        await waitFor(() => expect(mutate).toHaveBeenCalledWith(fresh, { revalidate: false }))
    })

    it("marks the currently pinned achievement as the selected tile", () => {
        profile = selfProfile({
            equippedAchievement: { code: "STREAK_7", name: "Tuần Lửa" },
        })
        render(<AvatarAppearancePicker />)

        expect(screen.getByRole("button", { name: "Tuần Lửa" }).getAttribute("aria-pressed")).toBe(
            "true",
        )
        expect(screen.getByRole("button", { name: "achievementNone" }).getAttribute("aria-pressed")).toBe(
            "false",
        )
    })

    it("offers only EARNED achievements — an unearned code is a guaranteed 400", () => {
        catalogItems = [item(), item({ code: "STREAK_100", name: "Trăm Ngày Lửa", earned: false })]
        render(<AvatarAppearancePicker />)

        expect(screen.getByRole("button", { name: "Bài học đầu tiên" })).toBeTruthy()
        expect(screen.queryByRole("button", { name: "Trăm Ngày Lửa" })).toBeNull()
    })

    it("prints the WHOLE-catalog tally, reusing the Thành tích tab's own key", () => {
        // The block lists only what is EARNED, so without a total it reads as a small,
        // separate collection — which is exactly how the owner read it ("my huy hiệu
        // aren't pinnable"). The counts come from the RESPONSE, not from `items.length`,
        // so the picker and the Thành tích tab can never print two different totals for
        // one collection. `total` here (43) deliberately exceeds the two listed tiles.
        catalogCounts = { earnedCount: 2, totalCount: 43 }
        render(<AvatarAppearancePicker />)

        expect(screen.getByText("summary earned=2 total=43")).toBeTruthy()
    })

    it("offers EVERY kind — BADGE, TITLE and TROPHY are one pool, not three", () => {
        // `kind` is a LABEL on a badge, never a gate: one pin slot, and anything
        // earned may fill it. The owner read the block as "achievements only, my
        // huy hiệu are missing", so the rule is pinned down here — a `kind`
        // predicate sneaked in anywhere on the read path drops a tile and fails.
        //
        // The TITLE row carries no art on purpose: `badgeKindIcon` has no TITLE
        // entry and falls back to the medal, so this also proves an un-arted,
        // un-mapped kind still DRAWS a tile instead of collapsing to a blank row
        // that reads as "not offered".
        catalogItems = [
            item({ code: "FIRST_LESSON", name: "Bài học đầu tiên", kind: "BADGE" }),
            item({ code: "HELPFUL_10", name: "Người trợ giúp", kind: "TITLE", iconUrl: null }),
            item({ code: "FIRST_COURSE", name: "Khoá học đầu tiên", kind: "TROPHY" }),
        ]
        render(<AvatarAppearancePicker />)

        expect(screen.getByRole("button", { name: "Bài học đầu tiên" })).toBeTruthy()
        expect(screen.getByRole("button", { name: "Người trợ giúp" })).toBeTruthy()
        expect(screen.getByRole("button", { name: "Khoá học đầu tiên" })).toBeTruthy()
        // the art-less TITLE tile still renders a glyph rather than nothing
        expect(
            screen.getByRole("button", { name: "Người trợ giúp" }).querySelector("svg"),
        ).toBeTruthy()
    })

    it("hides the whole block when nothing has been earned (or the backend has not shipped)", () => {
        catalogItems = []
        render(<AvatarAppearancePicker />)

        expect(screen.queryByText("achievementTitle")).toBeNull()
        expect(screen.queryByRole("button", { name: "achievementNone" })).toBeNull()
    })

    it("still shows the block when the profile carries no equippedAchievement field at all", () => {
        // A not-yet-deployed backend simply omits the field; that must read as
        // "nothing pinned", not as a crash or a hidden block.
        profile = selfProfile({ equippedAchievement: undefined })
        render(<AvatarAppearancePicker />)

        expect(screen.getByRole("button", { name: "achievementNone" }).getAttribute("aria-pressed")).toBe(
            "true",
        )
    })
})
