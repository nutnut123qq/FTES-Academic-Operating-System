/**
 * Regression: one account must never read another account's cached self-profile.
 *
 * `["profiles", "me"]` was ONE cache entry for the whole app, shared by every
 * self-profile reader (identity sidebar, portfolio, personal + academic tabs, the
 * edit form and the privacy toggles). Sign out of A and into B in the SAME TAB and
 * B's hooks re-key to that identical string, so SWR hands B the settled entry it
 * still holds for A — stale-while-revalidate paints A's name, avatar, contact
 * details and privacy settings instantly, and inside `dedupingInterval` the
 * revalidation may not even run. The key now carries the viewer id
 * (`state.user.user.id`), so A's entry is unreachable from B's key.
 *
 * The test signs out WITHOUT flushing the SWR cache on purpose: the sign-out
 * mutation does flush, but a session-revoke / expiry path does not, and the key
 * alone must make the leak impossible. Drop the `viewerId` segment from
 * `useSelfProfileKey` and this test goes red on the "B sees nothing yet"
 * assertion right after B signs in.
 */
import React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { act, renderHook, waitFor } from "@testing-library/react"
import { Provider } from "react-redux"
import { SWRConfig } from "swr"

const selfProfileMock = vi.fn()

vi.mock("@/modules/api/rest/profile", () => ({
    getSelfProfile: () => selfProfileMock(),
}))

import { store } from "@/redux/store"
import { setAuthenticated } from "@/redux/slices/keycloak"
import { setUser } from "@/redux/slices/user"
import { useQueryProfileSwr } from "./useQueryProfileSwr"
import { useQueryMyPortfolioSwr } from "./useQueryMyPortfolioSwr"
import type { UserEntity } from "@/modules/types/entities/user"

/** Redux store (session + viewer) + an SWR cache private to this file. */
const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>
        <SWRConfig value={{
            provider: () => new Map(),
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
        }}>
            {children}
        </SWRConfig>
    </Provider>
)

/** A minimal `GET /profiles/me` payload identifiable by username. */
const profileRow = (username: string) => ({
    username,
    displayName: username.toUpperCase(),
    projects: [{ id: `p-${username}`, title: `${username} project`, highlighted: true }],
})

/** Sign a viewer in the way every real sign-in path does (flag + hydrated viewer). */
const signIn = async (id: string) => {
    await act(async () => {
        window.localStorage.setItem("keycloak:access_token", `tok-${id}`)
        store.dispatch(setAuthenticated(true))
        store.dispatch(setUser({ id } as UserEntity))
    })
}

/** Sign out the redux way only — no SWR cache flush (mirrors a revoked session). */
const signOut = async () => {
    await act(async () => {
        window.localStorage.clear()
        store.dispatch(setAuthenticated(false))
        store.dispatch(setUser(null))
    })
}

describe("profile hooks — the self-profile cache is scoped to the viewer", () => {
    beforeEach(() => {
        selfProfileMock.mockReset()
        window.localStorage.clear()
        store.dispatch(setAuthenticated(false))
        store.dispatch(setUser(null))
    })

    it("does not serve user A's profile to user B in the same tab", async () => {
        selfProfileMock.mockResolvedValue(profileRow("an_le"))
        const { result } = renderHook(() => useQueryProfileSwr(), { wrapper })

        // A signs in and their profile lands in the cache.
        await signIn("user-a")
        await waitFor(() => expect(result.current.profile?.username).toBe("an_le"))

        await signOut()

        // B's request is left hanging, so anything rendered for B can only have come
        // from the cache — which is exactly the leak under test.
        let releaseB: (row: unknown) => void = () => undefined
        selfProfileMock.mockImplementation(
            () => new Promise((resolve) => {
                releaseB = resolve
            }),
        )
        await signIn("user-b")

        expect(result.current.profile).toBeUndefined()

        // B's own answer, once it arrives, is what B sees.
        await act(async () => {
            releaseB(profileRow("huy_tran"))
        })
        await waitFor(() => expect(result.current.profile?.username).toBe("huy_tran"))
    })

    it("does not serve user A's portfolio to user B in the same tab", async () => {
        selfProfileMock.mockResolvedValue(profileRow("an_le"))
        const { result } = renderHook(() => useQueryMyPortfolioSwr(), { wrapper })

        await signIn("user-a")
        await waitFor(() => expect(result.current.data?.projects[0]?.id).toBe("p-an_le"))

        await signOut()

        let releaseB: (row: unknown) => void = () => undefined
        selfProfileMock.mockImplementation(
            () => new Promise((resolve) => {
                releaseB = resolve
            }),
        )
        await signIn("user-b")

        expect(result.current.data).toBeUndefined()

        await act(async () => {
            releaseB(profileRow("huy_tran"))
        })
        await waitFor(() => expect(result.current.data?.projects[0]?.id).toBe("p-huy_tran"))
    })

    it("never calls the token-only endpoint while signed out", async () => {
        selfProfileMock.mockResolvedValue(profileRow("an_le"))
        renderHook(() => useQueryProfileSwr(), { wrapper })

        // No viewer resolved → null key → no request at all (a 401 otherwise).
        await act(async () => undefined)
        expect(selfProfileMock).not.toHaveBeenCalled()

        await signIn("user-a")
        await waitFor(() => expect(selfProfileMock).toHaveBeenCalledTimes(1))
    })
})
