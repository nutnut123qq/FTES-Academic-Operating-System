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
const getPublicProfile = vi.fn()
const toastDanger = vi.fn()
const requireAuth = vi.fn((_contextKey?: string) => true)

vi.mock("@/modules/api/rest/community", () => ({
    followUser: (userId: string) => followUser(userId),
    unfollowUser: (userId: string) => unfollowUser(userId),
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
        guard: (action: (...args: Array<unknown>) => void) => action,
    }),
}))

import { RestError } from "@/modules/api/rest/client"
import { useQueryUserHovercardSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserHovercardSwr"
import { followErrorMessageKey, useMutateFollowUserSwr } from "./useMutateFollowUserSwr"

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

beforeEach(() => {
    followUser.mockReset()
    unfollowUser.mockReset()
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
        // BE exposes no viewer-scoped follow flag → unknown until the viewer acts.
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

describe("followErrorMessageKey", () => {
    it("maps each handled status to its own message", () => {
        expect(followErrorMessageKey(new RestError("x", 401))).toBe("hovercard.followSessionExpired")
        expect(followErrorMessageKey(new RestError("x", 403))).toBe("hovercard.followForbidden")
        expect(followErrorMessageKey(new RestError("x", 404))).toBe("hovercard.followNotFound")
        expect(followErrorMessageKey(new RestError("x", 429))).toBe("hovercard.followRateLimited")
        expect(followErrorMessageKey(new Error("network down"))).toBe("hovercard.followFailed")
    })
})
