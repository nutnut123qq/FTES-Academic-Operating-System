/**
 * Regression, notification BADGE: the bell must not paint one account's unread count and
 * notification titles for another account.
 *
 * The badge used to key on `["QUERY_MY_NOTIFICATIONS_SWR"]`, gated only on "is somebody
 * signed in", so every viewer shared one cache entry. Sign out of A and into B in the
 * same tab and B's hook re-keys to that identical entry — inside `dedupingInterval`
 * SWR paints A's unread count and A's notification rows without even refetching.
 *
 * Sign-out here is deliberately redux-only, with NO SWR cache flush: the sign-out button
 * does flush, but a revoked or expired session does not, and the key alone must close the
 * hole. The sibling file covers the center's infinite list; this one covers the bell,
 * whose key is rebuilt by hand in `useNotificationSseLifecycle` and `NotificationCenter`.
 */
import React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { act, renderHook, waitFor } from "@testing-library/react"
import { Provider } from "react-redux"
import { SWRConfig } from "swr"

const badgeMock = vi.fn()

vi.mock("@/modules/api/rest/notification/notification", () => ({
    getNotificationBadge: () => badgeMock(),
}))

import { store } from "@/redux/store"
import { setAuthenticated } from "@/redux/slices/keycloak"
import { setUser } from "@/redux/slices/user"
import { useQueryMyNotificationsSwr } from "./useQueryMyNotificationsSwr"
import type { UserEntity } from "@/modules/types/entities/user"

/** Redux + a cache the test owns, so nothing leaks between cases. */
const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>
        <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
            {children}
        </SWRConfig>
    </Provider>
)

/**
 * Reads `unreadCount` DURING RENDER. SWR only re-renders for fields the render pass
 * touched, so a probe that returns the raw response and is read from the test body
 * alone would stay `undefined` forever — a harness artefact that looks exactly like a
 * broken fix.
 */
const useBadgeProbe = () => {
    const swr = useQueryMyNotificationsSwr()
    return swr.data?.unreadCount
}

/** Sign in the way every real sign-in path does: session flag + hydrated viewer. */
const signIn = (id: string) => {
    act(() => {
        store.dispatch(setAuthenticated(true))
        store.dispatch(setUser({ id } as UserEntity))
    })
}

/** Redux-only sign-out — mirrors a revoked session, which never flushes SWR. */
const signOut = () => {
    act(() => {
        store.dispatch(setAuthenticated(false))
        store.dispatch(setUser(null))
    })
}

describe("notification badge SWR key is viewer-scoped", () => {
    beforeEach(() => {
        badgeMock.mockReset()
        signOut()
    })

    it("does not show account A's unread count to account B in the same tab", async () => {
        badgeMock.mockResolvedValueOnce({ items: [], unreadCount: 9 })
        const view = renderHook(() => useBadgeProbe(), { wrapper })

        signIn("user-a")
        await waitFor(() => expect(view.result.current).toBe(9))

        // B's answer is held open: anything rendered before it lands could only have
        // come from the cache.
        let releaseB: (value: unknown) => void = () => undefined
        badgeMock.mockReturnValueOnce(new Promise((resolve) => {
            releaseB = resolve
        }))

        signOut()
        signIn("user-b")

        await waitFor(() => expect(view.result.current).toBeUndefined())
        expect(view.result.current).not.toBe(9)

        await act(async () => {
            releaseB({ items: [], unreadCount: 2 })
        })
        await waitFor(() => expect(view.result.current).toBe(2))
    })

    it("does not call the endpoint while signed out", async () => {
        renderHook(() => useBadgeProbe(), { wrapper })
        await act(async () => undefined)
        expect(badgeMock).not.toHaveBeenCalled()
    })

    it("does not fetch until the viewer has hydrated", async () => {
        const view = renderHook(() => useBadgeProbe(), { wrapper })

        // authenticated flag flipped, but `me` still in flight → no identity to file the
        // answer under, so the request must wait rather than land in a shared entry.
        act(() => {
            store.dispatch(setAuthenticated(true))
        })
        await act(async () => undefined)
        expect(badgeMock).not.toHaveBeenCalled()

        badgeMock.mockResolvedValueOnce({ items: [], unreadCount: 4 })
        act(() => {
            store.dispatch(setUser({ id: "user-c" } as UserEntity))
        })
        await waitFor(() => expect(view.result.current).toBe(4))
    })
})
