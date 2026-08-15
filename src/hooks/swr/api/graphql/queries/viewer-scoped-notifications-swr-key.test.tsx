/**
 * Regression, notification cluster: one account must never read another account's
 * cached notifications — AND the live SSE push must still reach the list.
 *
 * `["QUERY_MY_NOTIFICATIONS_INFINITE_SWR", unreadOnly, index]` (gated only on "is
 * somebody signed in") serializes to the SAME cache key for every user: sign out of A
 * and into B in the same TAB and B's hook re-keys to that identical entry, so SWR paints
 * A's notifications stale-while-revalidate — and inside `dedupingInterval` without even
 * a refetch. The key now carries the viewer id, so A's pages are unreachable from B's
 * key. Sign-out here is deliberately redux-only, no SWR cache flush: the sign-out button
 * does flush, but a revoked/expired session does not, and the key alone must close it.
 *
 * The second half guards the SILENT part of the change. `useNotificationSseLifecycle`
 * rebuilds this key to push a live notification into the list; if the two sides ever
 * disagree the mutate matches nothing, throws nothing, logs nothing — new notifications
 * simply stop appearing until a reload. Both sides now go through
 * {@link buildMyNotificationsInfiniteKey}, and the tests pin that the builder's
 * serialized `$inf$` key is byte-for-byte the key THIS hook stores its list under.
 *
 * Why the hook's key is captured instead of mounting a real `useSWRInfinite`: a mounted
 * `useSWRInfinite` never settles in this runner (happy-dom + React 19 — the fetcher runs
 * but the resolution never re-renders), which is why every other infinite-list test in
 * this repo asserts against `unstable_serialize`d keys too. The key IS the mechanism
 * under test: SWR serves a cached answer exactly when the serialized key matches.
 */
import React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { act, renderHook } from "@testing-library/react"
import { Provider } from "react-redux"
import { unstable_serialize } from "swr/infinite"
import type { SWRInfiniteKeyLoader } from "swr/infinite"

const notificationsMock = vi.fn()

vi.mock("@/modules/api/rest/notification/notification", () => ({
    getNotifications: (params: unknown) => notificationsMock(params),
}))

/** The last `getKey` / fetcher the hook handed to `useSWRInfinite`. */
let capturedGetKey: SWRInfiniteKeyLoader | null = null
let capturedFetcher: ((key: unknown) => Promise<unknown>) | null = null

vi.mock("swr/infinite", async (importOriginal) => {
    const actual = await importOriginal<typeof import("swr/infinite")>()
    return {
        ...actual,
        // stand-in for the real hook: record what the hook keys on, render nothing
        default: (getKey: SWRInfiniteKeyLoader, fetcher: (key: unknown) => Promise<unknown>) => {
            capturedGetKey = getKey
            capturedFetcher = fetcher
            return { data: undefined, size: 1, setSize: () => undefined }
        },
    }
})

import { store } from "@/redux/store"
import { setAuthenticated } from "@/redux/slices/keycloak"
import { setUser } from "@/redux/slices/user"
import {
    NOTIFICATION_LIST_PAGE_LIMIT,
    buildMyNotificationsInfiniteKey,
    useQueryMyNotificationsInfiniteSwr,
} from "./useQueryMyNotificationsInfiniteSwr"
import type { UserEntity } from "@/modules/types/entities/user"

/** Redux store (session + viewer). */
const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
)

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

/** The `$inf$` meta key SWR would file the currently-rendered list under. */
const mountedListKey = (): string => unstable_serialize(capturedGetKey as SWRInfiniteKeyLoader)

/** Page 0's key for the currently-rendered list, as `getKey` returns it. */
const firstPageKey = () => (capturedGetKey as SWRInfiniteKeyLoader)(0, null)

describe("notification list hook — cache is scoped to the viewer", () => {
    beforeEach(async () => {
        notificationsMock.mockReset()
        capturedGetKey = null
        capturedFetcher = null
        window.localStorage.clear()
        await act(async () => {
            store.dispatch(setAuthenticated(false))
            store.dispatch(setUser(null))
        })
    })

    it("cannot reach user A's cached pages from user B's key in the same tab", async () => {
        const { rerender } = renderHook(() => useQueryMyNotificationsInfiniteSwr(false), {
            wrapper,
        })

        // A signs in; their page 0 settles in the SWR cache under A's key.
        await signIn("user-a")
        rerender()
        const cache = new Map<string, unknown>([
            [mountedListKey(), [[{ id: "a-1" }]]],
        ])
        const keyA = mountedListKey()

        // Sign out WITHOUT flushing the cache, then B signs in — the leak window.
        await signOut()
        rerender()
        expect(firstPageKey()).toBeNull()

        await signIn("user-b")
        rerender()
        const keyB = mountedListKey()

        // B's key is a different cache entry, so A's settled pages are unreachable.
        expect(keyB).not.toBe(keyA)
        expect(cache.has(keyB)).toBe(false)
        expect(keyA).toContain("user-a")
        expect(keyB).toContain("user-b")
    })

    it("keeps a null key (no fetch) while the viewer id has not resolved yet", async () => {
        renderHook(() => useQueryMyNotificationsInfiniteSwr(false), { wrapper })

        // authenticated, but the `me` query is still in flight — a request we cannot
        // attribute to an identity has nowhere safe to cache its answer
        await act(async () => {
            store.dispatch(setAuthenticated(true))
            store.dispatch(setUser(null))
        })
        expect(firstPageKey()).toBeNull()
    })

    it("keys pages through the SAME builder the SSE lifecycle mutates", async () => {
        // both filter variants, because the lifecycle revalidates both
        for (const unreadOnly of [false, true]) {
            renderHook(() => useQueryMyNotificationsInfiniteSwr(unreadOnly), { wrapper })
            await signIn("user-b")

            // the key the SSE lifecycle builds IS the key this list is filed under —
            // drift here is a silent no-op in production (pushed notifications stop
            // showing up), so it has to be an equality, not a resemblance
            expect(mountedListKey()).toBe(
                unstable_serialize(buildMyNotificationsInfiniteKey(unreadOnly, "user-b")),
            )
            // …and another viewer's build of the same filter reaches a different entry
            expect(mountedListKey()).not.toBe(
                unstable_serialize(buildMyNotificationsInfiniteKey(unreadOnly, "user-a")),
            )
            await signOut()
        }
    })

    it("still requests the right page after the viewer segment joined the key", async () => {
        notificationsMock.mockResolvedValue({ items: [], page: 0, total: 0, totalPages: 0 })
        renderHook(() => useQueryMyNotificationsInfiniteSwr(true), { wrapper })
        await signIn("user-b")

        // the fetcher destructures the key positionally — a viewer id inserted in the
        // wrong slot would silently request page "user-b"
        await (capturedFetcher as (key: unknown) => Promise<unknown>)(
            (capturedGetKey as SWRInfiniteKeyLoader)(2, null),
        )
        expect(notificationsMock).toHaveBeenCalledWith({
            page: 2,
            size: NOTIFICATION_LIST_PAGE_LIMIT,
            status: "UNREAD",
        })
    })
})
