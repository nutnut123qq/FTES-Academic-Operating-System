import React from "react"
import { SWRConfig } from "swr"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Unit — {@link useMutateFollowUserSwr} (hovercard follow, REST rewire).
 *
 * Only the network edges are mocked (`community` follow API + the public-profile
 * read that seeds the card); SWR itself is REAL, so these pin:
 *  - the optimistic flip lands in the cache keyed by USERNAME — i.e. the very key
 *    `useQueryUserHovercardSwr` subscribes to, which is what makes every
 *    `<UserLink>` for that user re-render together,
 *  - a failed write ROLLS BACK to the exact pre-toggle snapshot (flag + counter),
 *  - a guest never reaches the network (the auth guard aborts first),
 *  - HTTP status → message-key mapping (403/404/429 are not "try again").
 */

const followUser = vi.fn()
const unfollowUser = vi.fn()
const getFollowedUserIds = vi.fn()
const getPublicProfile = vi.fn()
const toastDanger = vi.fn()
// typed with the context-key argument so the assertions can read `mock.calls`
const requireAuth = vi.fn((contextKey?: string): boolean => Boolean(contextKey) || true)

vi.mock("@/modules/api/rest/community", () => ({
    followUser: (userId: string) => followUser(userId),
    unfollowUser: (userId: string) => unfollowUser(userId),
    getFollowedUserIds: (ids: ReadonlyArray<string>) => getFollowedUserIds(ids),
    FOLLOW_BATCH_LIMIT: 100,
}))

// the batch hook only fetches for a signed-in viewer, and keys its cache by that viewer
vi.mock("@/redux/hooks", () => ({
    useAppSelector: (selector: (state: unknown) => unknown) =>
        selector({ keycloak: { authenticated: true }, user: { user: { id: "viewer-1" } } }),
}))

vi.mock("@/modules/api/rest/profile", () => ({
    getPublicProfile: (username: string) => getPublicProfile(username),
}))

vi.mock("@heroui/react", () => ({
    toast: { danger: (message: string) => toastDanger(message) },
}))

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
}))

vi.mock("@/hooks/useRequireAuth", () => ({
    useRequireAuth: () => ({
        authenticated: true,
        requireAuth: (contextKey?: string) => requireAuth(contextKey),
        requireAuthAsync: async (contextKey?: string) => requireAuth(contextKey),
        guard: (action: (...args: Array<unknown>) => void) => action,
    }),
}))

import { RestError } from "@/modules/api/rest/client"
import { useQueryUserHovercardSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserHovercardSwr"
import { followErrorMessageKey, useMutateFollowUserSwr } from "./useMutateFollowUserSwr"
import { useQueryFollowedUserIdsSwr } from "./useQueryFollowedUserIdsSwr"

const USERNAME = "minh-tran"
const USER_ID = "11111111-2222-3333-4444-555555555555"

/** Minimal `GET /profiles/{username}` payload — only the fields the card maps. */
const profileDto = {
    userId: USER_ID,
    username: USERNAME,
    displayName: "Minh Trần",
    avatarUrl: null,
    bio: null,
    counters: { followers: 10, following: 4 },
}

/** A one-shot deferred so a test can hold the follow write in flight, then settle it. */
const deferred = <T,>() => {
    let resolve!: (value: T) => void
    let reject!: (reason?: unknown) => void
    const promise = new Promise<T>((res, rej) => {
        resolve = res
        reject = rej
    })
    return { promise, resolve, reject }
}

/** Reads the hovercard cache entry and drives the toggle from the same render. */
const Probe = () => {
    const { data } = useQueryUserHovercardSwr(USERNAME)
    const { toggleFollow, isPending } = useMutateFollowUserSwr()
    return (
        <div>
            <span data-testid="followed">{String(data?.isFollowedByMe)}</span>
            <span data-testid="followers">{String(data?.followerCount)}</span>
            <span data-testid="pending">{String(isPending)}</span>
            <button type="button" onClick={() => data && void toggleFollow(data)}>
                toggle
            </button>
        </div>
    )
}

const renderProbe = () =>
    render(
        <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
            <Probe />
        </SWRConfig>,
    )

/**
 * Same toggle, but rendered next to a LIST that already read its follow state in batch
 * (`GET /community/follows/me`) — the row label must move with the hovercard.
 */
const BatchProbe = ({ otherId = "aaaa-other" }: { otherId?: string }) => {
    const { data } = useQueryUserHovercardSwr(USERNAME)
    const { toggleFollow } = useMutateFollowUserSwr()
    const { isFollowing } = useQueryFollowedUserIdsSwr([USER_ID, otherId])
    return (
        <div>
            <span data-testid="row-following">{String(isFollowing(USER_ID))}</span>
            <span data-testid="other-following">{String(isFollowing(otherId))}</span>
            <button type="button" onClick={() => data && void toggleFollow(data)}>
                toggle
            </button>
        </div>
    )
}

const renderBatchProbe = () =>
    render(
        <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
            <BatchProbe />
        </SWRConfig>,
    )

beforeEach(() => {
    followUser.mockReset()
    unfollowUser.mockReset()
    getFollowedUserIds.mockReset()
    getFollowedUserIds.mockResolvedValue([])
    toastDanger.mockReset()
    requireAuth.mockReset()
    requireAuth.mockReturnValue(true)
    getPublicProfile.mockReset()
    getPublicProfile.mockResolvedValue(profileDto)
})

describe("useMutateFollowUserSwr", () => {
    it("writes the follow optimistically into the username-keyed cache", async () => {
        const write = deferred<void>()
        followUser.mockReturnValue(write.promise)

        renderProbe()
        await waitFor(() => expect(screen.getByTestId("followers").textContent).toBe("10"))
        // The hovercard read does not MAP a viewer-scoped follow flag, so the card's
        // own state is unknown until the viewer acts; a list surface fills that gap
        // with the batch read (`useQueryFollowedUserIdsSwr`).
        expect(screen.getByTestId("followed").textContent).toBe("undefined")

        fireEvent.click(screen.getByText("toggle"))

        await waitFor(() => expect(screen.getByTestId("followed").textContent).toBe("true"))
        expect(screen.getByTestId("followers").textContent).toBe("11")
        expect(screen.getByTestId("pending").textContent).toBe("true")
        expect(followUser).toHaveBeenCalledWith(USER_ID)

        await act(async () => {
            write.resolve()
            await write.promise
        })

        // Committed: the optimistic state stands, nothing was rolled back.
        expect(screen.getByTestId("followed").textContent).toBe("true")
        expect(screen.getByTestId("followers").textContent).toBe("11")
        await waitFor(() => expect(screen.getByTestId("pending").textContent).toBe("false"))
        expect(toastDanger).not.toHaveBeenCalled()
    })

    it("rolls back the flag AND the counter when the write fails", async () => {
        const write = deferred<void>()
        followUser.mockReturnValue(write.promise)

        renderProbe()
        await waitFor(() => expect(screen.getByTestId("followers").textContent).toBe("10"))

        fireEvent.click(screen.getByText("toggle"))
        await waitFor(() => expect(screen.getByTestId("followed").textContent).toBe("true"))

        await act(async () => {
            write.reject(new RestError("boom", 500))
            await write.promise.catch(() => {})
        })

        await waitFor(() => expect(screen.getByTestId("followed").textContent).toBe("undefined"))
        expect(screen.getByTestId("followers").textContent).toBe("10")
        expect(screen.getByTestId("pending").textContent).toBe("false")
        expect(toastDanger).toHaveBeenCalledWith("hovercard.followFailed")
    })

    it("unfollows (DELETE) and decrements once the viewer is following", async () => {
        followUser.mockResolvedValue(undefined)
        unfollowUser.mockResolvedValue(undefined)

        renderProbe()
        await waitFor(() => expect(screen.getByTestId("followers").textContent).toBe("10"))

        await act(async () => {
            fireEvent.click(screen.getByText("toggle"))
        })
        await waitFor(() => expect(screen.getByTestId("followed").textContent).toBe("true"))

        await act(async () => {
            fireEvent.click(screen.getByText("toggle"))
        })

        await waitFor(() => expect(screen.getByTestId("followed").textContent).toBe("false"))
        expect(screen.getByTestId("followers").textContent).toBe("10")
        expect(unfollowUser).toHaveBeenCalledWith(USER_ID)
    })

    it("never touches the network for a guest (auth guard aborts)", async () => {
        requireAuth.mockReturnValue(false)

        renderProbe()
        await waitFor(() => expect(screen.getByTestId("followers").textContent).toBe("10"))

        await act(async () => {
            fireEvent.click(screen.getByText("toggle"))
        })

        expect(requireAuth).toHaveBeenCalledWith("auth.context.follow")
        expect(followUser).not.toHaveBeenCalled()
        expect(screen.getByTestId("followed").textContent).toBe("undefined")
        expect(screen.getByTestId("followers").textContent).toBe("10")
    })
})

describe("useMutateFollowUserSwr — batch follow-state lots", () => {
    it("patches every lot that contains the user (and only that user)", async () => {
        followUser.mockResolvedValue(undefined)

        renderBatchProbe()
        await waitFor(() => expect(getFollowedUserIds).toHaveBeenCalled())
        expect(screen.getByTestId("row-following").textContent).toBe("false")

        await act(async () => {
            fireEvent.click(screen.getByText("toggle"))
        })

        // the LIST row flips with the hovercard — no refetch, no 60s of stale label
        await waitFor(() => expect(screen.getByTestId("row-following").textContent).toBe("true"))
        expect(screen.getByTestId("other-following").textContent).toBe("false")
        expect(getFollowedUserIds).toHaveBeenCalledTimes(1)
    })

    it("takes the user back out of the lots when the write fails", async () => {
        const write = deferred<void>()
        followUser.mockReturnValue(write.promise)

        renderBatchProbe()
        await waitFor(() => expect(getFollowedUserIds).toHaveBeenCalled())

        fireEvent.click(screen.getByText("toggle"))
        await waitFor(() => expect(screen.getByTestId("row-following").textContent).toBe("true"))

        await act(async () => {
            write.reject(new RestError("boom", 500))
            await write.promise.catch(() => {})
        })

        await waitFor(() => expect(screen.getByTestId("row-following").textContent).toBe("false"))
    })

    it("drops the user from the lots on unfollow", async () => {
        followUser.mockResolvedValue(undefined)
        unfollowUser.mockResolvedValue(undefined)
        getFollowedUserIds.mockResolvedValue([USER_ID])

        renderBatchProbe()
        await waitFor(() => expect(screen.getByTestId("row-following").textContent).toBe("true"))

        // the card itself starts "not following" (the profile read is not mapped to a
        // viewer-scoped flag), so the first press follows and the second one unfollows
        await act(async () => {
            fireEvent.click(screen.getByText("toggle"))
        })
        await act(async () => {
            fireEvent.click(screen.getByText("toggle"))
        })

        await waitFor(() => expect(unfollowUser).toHaveBeenCalledWith(USER_ID))
        await waitFor(() => expect(screen.getByTestId("row-following").textContent).toBe("false"))
    })
})

describe("followErrorMessageKey", () => {
    it("maps each handled status to its own message", () => {
        expect(followErrorMessageKey(new RestError("x", 401))).toBe("hovercard.followSessionExpired")
        expect(followErrorMessageKey(new RestError("x", 403))).toBe("hovercard.followForbidden")
        expect(followErrorMessageKey(new RestError("x", 404))).toBe("hovercard.followNotFound")
        expect(followErrorMessageKey(new RestError("x", 429))).toBe("hovercard.followRateLimited")
        expect(followErrorMessageKey(new Error("network down"))).toBe("hovercard.followFailed")
    })
})
