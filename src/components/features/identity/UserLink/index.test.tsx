import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { UserHovercardData } from "@/modules/types/user-hovercard"

/**
 * Component — {@link UserLink}'s follow CTA once the state can come FROM OUTSIDE.
 *
 * A list surface reads the follow state for its whole page in one request
 * (`useQueryFollowedUserIdsSwr` over `GET /community/follows/me`) and hands it down,
 * because the public-profile read behind the hovercard does not map the flag. What is
 * pinned here:
 *  - the passed-in state decides the label/variant on the FIRST open (no hovering
 *    every avatar to discover it),
 *  - pressing the CTA toggles from the RESOLVED state — without that, someone the
 *    batch reported as followed would be FOLLOWED AGAIN instead of unfollowed,
 *  - the card's own knowledge (an optimistic toggle already wrote it) still wins over
 *    the batch snapshot,
 *  - surfaces that pass nothing keep the previous neutral behaviour.
 *
 * `t` echoes the key, so assertions key off message ids.
 */

const hoisted = {
    profile: undefined as UserHovercardData | undefined,
    currentUser: null as { id?: string; username?: string } | null,
}
const toggleFollow = vi.fn()

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
}))

vi.mock("@heroui/react", () => ({
    Button: ({
        children,
        onPress,
        variant,
    }: {
        children?: React.ReactNode | ((state: { isPending: boolean }) => React.ReactNode)
        onPress?: () => void
        variant?: string
    }) => (
        <button type="button" data-testid="follow-cta" data-variant={variant} onClick={onPress}>
            {typeof children === "function" ? children({ isPending: false }) : children}
        </button>
    ),
    Typography: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
    Skeleton: () => <div />,
    Spinner: () => <span />,
    cn: (...values: Array<unknown>) => values.filter(Boolean).join(" "),
}))

// The hovercard shell renders its content inline so the CTA is queryable without
// React Aria's overlay machinery.
vi.mock("@/components/blocks/identity", () => ({
    UserHovercard: ({
        children,
        content,
    }: {
        children?: React.ReactNode
        content?: React.ReactNode
    }) => (
        <div>
            {children}
            {content}
        </div>
    ),
}))

vi.mock("@/components/reuseable/UserAvatar", () => ({ UserAvatar: () => <span /> }))
vi.mock("@/i18n/navigation", () => ({
    Link: ({ children }: { children?: React.ReactNode }) => <a>{children}</a>,
}))
vi.mock("@/resources/path", () => ({
    pathConfig: () => ({ profile: (username: string) => ({ build: () => `/profile/${username}` }) }),
}))

vi.mock("@/redux/hooks", () => ({
    useAppSelector: (selector: (state: unknown) => unknown) =>
        selector({ user: { user: hoisted.currentUser } }),
}))

vi.mock("@/hooks/swr/api/graphql/queries", () => ({
    useQueryUserHovercardSwr: () => ({
        data: hoisted.profile,
        error: undefined,
        isLoading: false,
        mutate: vi.fn(),
    }),
}))

vi.mock("./useMutateFollowUserSwr", () => ({
    useMutateFollowUserSwr: () => ({
        toggleFollow: (target: UserHovercardData) => toggleFollow(target),
        isPending: false,
    }),
}))

import { UserLink } from "./index"

const USERNAME = "minh-tran"
const USER_ID = "11111111-2222-3333-4444-555555555555"

/** What the hovercard read maps today — note `isFollowedByMe` is not part of it. */
const profile: UserHovercardData = {
    id: USER_ID,
    username: USERNAME,
    displayName: "Minh Trần",
    bio: null,
    avatar: null,
    followerCount: 10,
    followingCount: 4,
    isFollowedByMe: undefined,
}

beforeEach(() => {
    hoisted.profile = { ...profile }
    hoisted.currentUser = { id: "someone-else", username: "lan" }
    toggleFollow.mockReset()
})

describe("UserLink — follow state handed in from the list", () => {
    it("opens on 'Đang theo dõi' when the batch read says the viewer follows the author", () => {
        render(<UserLink username={USERNAME} displayName="Minh Trần" isFollowing />)

        expect(screen.getByTestId("follow-cta").textContent).toContain("hovercard.unfollow")
        expect(screen.getByTestId("follow-cta").getAttribute("data-variant")).toBe("secondary")
    })

    it("keeps the neutral CTA for surfaces that pass nothing", () => {
        render(<UserLink username={USERNAME} displayName="Minh Trần" />)

        expect(screen.getByTestId("follow-cta").textContent).toContain("hovercard.follow")
        expect(screen.getByTestId("follow-cta").getAttribute("data-variant")).toBe("primary")
    })

    it("shows the neutral CTA when the batch says the author is NOT followed", () => {
        render(<UserLink username={USERNAME} displayName="Minh Trần" isFollowing={false} />)

        expect(screen.getByTestId("follow-cta").textContent).toContain("hovercard.follow")
    })

    it("toggles from the RESOLVED state, so a followed author is unfollowed (not re-followed)", () => {
        render(<UserLink username={USERNAME} displayName="Minh Trần" isFollowing />)

        fireEvent.click(screen.getByTestId("follow-cta"))

        // the hook derives the direction from `isFollowedByMe` — handing it the raw
        // profile (undefined) would fire another PUT instead of the DELETE
        expect(toggleFollow).toHaveBeenCalledWith(
            expect.objectContaining({ id: USER_ID, username: USERNAME, isFollowedByMe: true }),
        )
    })

    it("lets the card's own knowledge win over the batch snapshot", () => {
        // an optimistic unfollow already landed in the hovercard cache; the batch lot
        // this row was rendered with is the stale one
        hoisted.profile = { ...profile, isFollowedByMe: false }

        render(<UserLink username={USERNAME} displayName="Minh Trần" isFollowing />)

        expect(screen.getByTestId("follow-cta").textContent).toContain("hovercard.follow")
    })

    it("never offers the CTA on the viewer's own link", () => {
        hoisted.currentUser = { id: USER_ID, username: USERNAME }

        render(<UserLink username={USERNAME} displayName="Minh Trần" isFollowing />)

        expect(screen.queryByTestId("follow-cta")).toBeNull()
    })
})
