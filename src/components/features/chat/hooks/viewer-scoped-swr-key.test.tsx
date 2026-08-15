/**
 * Regression: one account must never read another account's private conversations.
 *
 * `["GET_CHAT_CONVERSATIONS"]` was ONE cache entry for the whole app. Sign out of A
 * and into B in the SAME TAB and B's hook re-keys to that identical string, so SWR
 * hands B the settled entry it still holds for A — stale-while-revalidate paints A's
 * conversation titles, last-message previews and unread counts instantly, and inside
 * `dedupingInterval` the revalidation may not even run. That is personal-data
 * disclosure, not a cosmetic staleness bug. The key now carries the viewer id
 * (`state.user.user.id`), so A's entry is unreachable from B's key.
 *
 * The test signs out WITHOUT flushing the SWR cache on purpose: the sign-out
 * mutation does flush, but a session-revoke / expiry path does not, and the key
 * alone must make the leak impossible. Drop the `viewerId` segment from the key and
 * this test goes red on the "B sees no conversations yet" assertion.
 */
import React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { act, renderHook, waitFor } from "@testing-library/react"
import { Provider } from "react-redux"
import { SWRConfig } from "swr"

const conversationsMock = vi.fn()

vi.mock("@/modules/api/rest/chat", () => ({
    getConversations: () => conversationsMock(),
    getMessages: vi.fn(),
    sendMessage: vi.fn(),
}))

import { store } from "@/redux/store"
import { setAuthenticated } from "@/redux/slices/keycloak"
import { setUser } from "@/redux/slices/user"
import { useQueryConversationsSwr } from "./useQueryConversationsSwr"
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

/** One conversation page carrying a single, identifiable private thread. */
const conversationPage = (title: string) => ({
    items: [{ id: `c-${title}`, title, lastMessagePreview: `secret of ${title}`, unreadCount: 2 }],
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

describe("chat hooks — the conversation list is scoped to the viewer", () => {
    beforeEach(() => {
        conversationsMock.mockReset()
        window.localStorage.clear()
        store.dispatch(setAuthenticated(false))
        store.dispatch(setUser(null))
    })

    it("does not serve user A's conversations to user B in the same tab", async () => {
        conversationsMock.mockResolvedValue(conversationPage("Nhóm DBI202"))
        const { result } = renderHook(() => useQueryConversationsSwr(), { wrapper })

        // A signs in and their private thread lands in the cache.
        await signIn("user-a")
        await waitFor(() => expect(result.current.conversations[0]?.name).toBe("Nhóm DBI202"))
        expect(result.current.conversations[0]?.lastMessage).toBe("secret of Nhóm DBI202")

        await signOut()

        // B's request is left hanging, so anything rendered for B can only have come
        // from the cache — which is exactly the leak under test.
        let releaseB: (page: unknown) => void = () => undefined
        conversationsMock.mockImplementation(
            () => new Promise((resolve) => {
                releaseB = resolve
            }),
        )
        await signIn("user-b")

        expect(result.current.conversations).toEqual([])

        // B's own answer, once it arrives, is what B sees.
        await act(async () => {
            releaseB(conversationPage("Mentor Huy"))
        })
        await waitFor(() => expect(result.current.conversations[0]?.name).toBe("Mentor Huy"))
    })

    it("never calls the token-only endpoint while signed out", async () => {
        conversationsMock.mockResolvedValue(conversationPage("Nhóm DBI202"))
        renderHook(() => useQueryConversationsSwr(), { wrapper })

        // No viewer resolved → null key → no request at all (a 401 otherwise).
        await act(async () => undefined)
        expect(conversationsMock).not.toHaveBeenCalled()

        await signIn("user-a")
        await waitFor(() => expect(conversationsMock).toHaveBeenCalledTimes(1))
    })
})
