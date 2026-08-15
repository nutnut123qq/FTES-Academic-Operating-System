/**
 * Regression: one account must never read another account's cached answer.
 *
 * `["course-my-courses"]` (and every sibling key gated only on "is somebody signed
 * in") is the SAME cache entry for every user. Sign out of A and into B in the SAME
 * TAB and B's hook re-keys to that identical string, so SWR hands B the settled entry
 * it still holds for A — stale-while-revalidate paints A's courses instantly, and
 * inside `dedupingInterval` the revalidation may not even run. The key now carries the
 * viewer id (`state.user.user.id`), so A's entry is unreachable from B's key.
 *
 * The test signs out WITHOUT flushing the SWR cache on purpose: the sign-out mutation
 * does flush, but a session-revoke / expiry path does not, and the key alone must make
 * the leak impossible. Drop the `viewerId` segment from the key and this test goes red
 * on the `hasCourses` assertion right after B signs in.
 */
import React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { act, renderHook, waitFor } from "@testing-library/react"
import { Provider } from "react-redux"
import { SWRConfig } from "swr"

const enrollmentsMock = vi.fn()

vi.mock("@/modules/api/rest/course", () => ({
    getMyEnrollments: () => enrollmentsMock(),
}))

import { store } from "@/redux/store"
import { setAuthenticated } from "@/redux/slices/keycloak"
import { setUser } from "@/redux/slices/user"
import { useQueryMyCoursesSwr } from "./useQueryMyCoursesSwr"
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

/** One active, published enrollment row for the given course. */
const enrollmentRow = (slug: string) => ({
    courseId: `uuid-${slug}`,
    courseTitle: slug.toUpperCase(),
    slugName: slug,
    active: true,
    completionPercent: "50",
    isPurchased: true,
    published: true,
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

describe("course hooks — cache is scoped to the viewer", () => {
    beforeEach(() => {
        enrollmentsMock.mockReset()
        window.localStorage.clear()
        store.dispatch(setAuthenticated(false))
        store.dispatch(setUser(null))
    })

    it("does not serve user A's courses to user B in the same tab", async () => {
        enrollmentsMock.mockResolvedValue([enrollmentRow("dbi202")])
        const { result } = renderHook(() => useQueryMyCoursesSwr(), { wrapper })

        // A signs in and their course lands in the cache.
        await signIn("user-a")
        await waitFor(() => expect(result.current.hasCourses).toBe(true))
        expect(result.current.courses[0]?.slug).toBe("dbi202")

        await signOut()

        // B's request is left hanging, so anything rendered for B can only have come
        // from the cache — which is exactly the leak under test.
        let releaseB: (rows: Array<unknown>) => void = () => undefined
        enrollmentsMock.mockImplementation(
            () => new Promise((resolve) => {
                releaseB = resolve
            }),
        )
        await signIn("user-b")

        expect(result.current.hasCourses).toBe(false)
        expect(result.current.courses).toEqual([])

        // B's own answer, once it arrives, is what B sees.
        await act(async () => {
            releaseB([enrollmentRow("prf192")])
        })
        await waitFor(() => expect(result.current.courses[0]?.slug).toBe("prf192"))
    })
})
