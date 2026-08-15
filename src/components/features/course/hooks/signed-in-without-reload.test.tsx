/**
 * Regression: the enrollment-scoped course hooks must start fetching the moment the
 * viewer signs in, WITHOUT a remount or an F5.
 *
 * These hooks gate their SWR key on "is there a session". That gate used to be
 * `window.localStorage.getItem("keycloak:access_token")`, read during render — a
 * value React cannot subscribe to. Signing in from inside the app writes the token
 * but re-renders nothing, so the key stayed `null` forever: the "continue learning"
 * band on home stayed empty and every catalog card kept its not-enrolled CTA until
 * the user reloaded the page. The gate now reads `state.keycloak.authenticated`,
 * which every sign-in path dispatches, so the key flips on the same render pass the
 * rest of the signed-in shell does.
 *
 * The test signs in the way the app does — token into local storage AND the redux
 * flag — so it fails against the old localStorage gate for the right reason: nothing
 * re-renders the hook, not "the token was missing".
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
import { useQueryMyEnrolledSlugsSwr } from "./useQueryMyEnrolledSlugsSwr"
import type { UserEntity } from "@/modules/types/entities/user"

/** Redux store (session flag) + an SWR cache private to this file. */
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

/** One active, published, half-finished enrollment. */
const enrollmentRow = {
    courseId: "uuid-dbi202",
    courseTitle: "Database Systems",
    slugName: "dbi202",
    active: true,
    completionPercent: "50",
    isPurchased: true,
    published: true,
}

describe("course hooks — sign-in without a reload", () => {
    beforeEach(() => {
        enrollmentsMock.mockReset()
        enrollmentsMock.mockResolvedValue([enrollmentRow])
        window.localStorage.clear()
        // the redux store is a module singleton — start every case signed out
        store.dispatch(setAuthenticated(false))
        store.dispatch(setUser(null))
    })

    it("fetches my courses as soon as the session flag flips, with no remount", async () => {
        const { result } = renderHook(() => useQueryMyCoursesSwr(), { wrapper })

        // Signed out: the key is null, so nothing is requested and nothing "loads".
        expect(enrollmentsMock).not.toHaveBeenCalled()
        expect(result.current.hasCourses).toBe(false)
        expect(result.current.isLoading).toBe(false)

        // Sign in exactly like the app does — token stored, the redux flag set AND the
        // viewer resolved (the `me` query hydrates `state.user.user`, whose id is part
        // of the cache key).
        await act(async () => {
            window.localStorage.setItem("keycloak:access_token", "tok")
            store.dispatch(setAuthenticated(true))
            store.dispatch(setUser({ id: "viewer-1" } as UserEntity))
        })

        // Same mounted hook, no reload: the band now has its course.
        await waitFor(() => expect(result.current.hasCourses).toBe(true))
        expect(result.current.courses[0]?.slug).toBe("dbi202")
        expect(result.current.courses[0]?.completionPercent).toBe(50)
    })

    it("fills the enrolled-slug set on sign-in, with no remount", async () => {
        const { result } = renderHook(() => useQueryMyEnrolledSlugsSwr(), { wrapper })

        expect(enrollmentsMock).not.toHaveBeenCalled()
        expect(result.current.enrolledSlugs.size).toBe(0)

        await act(async () => {
            window.localStorage.setItem("keycloak:access_token", "tok")
            store.dispatch(setAuthenticated(true))
            store.dispatch(setUser({ id: "viewer-1" } as UserEntity))
        })

        await waitFor(() => expect(result.current.enrolledSlugs.has("dbi202")).toBe(true))
    })
})
