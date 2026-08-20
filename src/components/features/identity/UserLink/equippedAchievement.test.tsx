import React from "react"
import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Component — the pinned THÀNH TÍCH riding along with the NAME.
 *
 * The owner's complaint was "chưa thấy gắn cái huy hiệu sau tên nhỉ": the award
 * existed but no name anywhere showed it. It is wired into {@link UserLink} —
 * the ONE shared identity link behind feeds, comments, @mentions and member
 * lists — precisely so it cannot be pasted into each surface and drift.
 *
 * What is pinned here:
 *  - a pinned achievement is drawn next to the name,
 *  - nothing pinned ⇒ the tree this component has ALWAYS returned, with no extra
 *    wrapper span (a JSX element is always truthy, so the guard has to live in
 *    the caller, not in the child's own `null` return),
 *  - `hideName` ⇒ no mark: surfaces render this component TWICE for one person
 *    (avatar column + name row) and the mark belongs to the NAME, exactly the
 *    rule the staff badge already follows.
 */

vi.mock("next-intl", () => ({
    useTranslations: () => {
        const t = (key: string) => key
        t.has = () => false
        return t
    },
}))

vi.mock("@heroui/react", () => ({
    Button: ({ children }: { children?: React.ReactNode }) => <button type="button">{children}</button>,
    Typography: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
    Skeleton: () => <div />,
    Spinner: () => <span />,
    cn: (...values: Array<unknown>) => values.filter(Boolean).join(" "),
}))

vi.mock("@phosphor-icons/react", () => ({
    MedalIcon: () => <svg data-testid="glyph-medal" />,
    TrophyIcon: () => <svg data-testid="glyph-trophy" />,
}))

vi.mock("@/components/blocks/identity", () => ({
    UserHovercard: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}))
vi.mock("@/components/reuseable/UserAvatar", () => ({ UserAvatar: () => <span /> }))
vi.mock("@/components/reuseable/StaffBadge", () => ({ StaffBadge: () => <span /> }))
vi.mock("@/i18n/navigation", () => ({
    Link: ({ children }: { children?: React.ReactNode }) => <a>{children}</a>,
}))
vi.mock("@/resources/path", () => ({
    pathConfig: () => ({ profile: (username: string) => ({ build: () => `/profile/${username}` }) }),
}))
vi.mock("@/redux/hooks", () => ({
    useAppSelector: (selector: (state: unknown) => unknown) =>
        selector({ user: { user: null } }),
}))
vi.mock("@/hooks/swr/api/graphql/queries", () => ({
    useQueryUserHovercardSwr: () => ({
        data: undefined,
        error: undefined,
        isLoading: false,
        mutate: vi.fn(),
    }),
}))
vi.mock("./useMutateFollowUserSwr", () => ({
    useMutateFollowUserSwr: () => ({ toggleFollow: vi.fn(), isPending: false }),
}))

const { UserLink } = await import("./index")

const USERNAME = "minh-tran"

beforeEach(() => {
    vi.clearAllMocks()
})

describe("UserLink — the pinned achievement next to the name", () => {
    it("draws the artwork beside the name when the person has one pinned", () => {
        const { container } = render(
            <UserLink
                username={USERNAME}
                displayName="Minh Trần"
                achievement={{
                    code: "FIRST_LESSON",
                    name: "Bài học đầu tiên",
                    kind: "TROPHY",
                    iconUrl: "https://cdn.example/first-lesson.png",
                }}
            />,
        )

        expect(screen.getByRole("img", { name: "Bài học đầu tiên" })).toBeTruthy()
        expect(container.querySelector("img")?.getAttribute("src")).toBe(
            "https://cdn.example/first-lesson.png",
        )
        // The name is still the primary thing on the row.
        expect(container.textContent).toContain("Minh Trần")
    })

    it("draws the kind glyph when the pinned achievement has no artwork", () => {
        const { container } = render(
            <UserLink
                username={USERNAME}
                displayName="Minh Trần"
                achievement={{ code: "STREAK_7", name: "Tuần Lửa", kind: "TROPHY" }}
            />,
        )

        expect(screen.getByTestId("glyph-trophy")).toBeTruthy()
        expect(container.querySelector("img")).toBeNull()
    })

    it("renders no mark at all — and no extra wrapper — when nothing is pinned", () => {
        for (const achievement of [undefined, null, { code: "" }]) {
            const { container } = render(
                <UserLink username={USERNAME} displayName="Minh Trần" achievement={achievement} />,
            )
            expect(screen.queryByTestId("equipped-achievement")).toBeNull()
            // No badge and no pin ⇒ the trigger is the root, not a wrapping span.
            expect(container.firstElementChild?.tagName.toLowerCase()).toBe("div")
        }
    })

    it("suppresses the mark on the avatar-only instance (hideName)", () => {
        render(
            <UserLink
                username={USERNAME}
                displayName="Minh Trần"
                hideName
                achievement={{ code: "FIRST_LESSON", name: "Bài học đầu tiên", iconUrl: "u" }}
            />,
        )

        expect(screen.queryByTestId("equipped-achievement")).toBeNull()
    })
})
