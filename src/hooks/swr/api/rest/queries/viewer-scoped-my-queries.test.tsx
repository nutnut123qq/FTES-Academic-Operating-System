/**
 * Regression: the `useGetMy*Swr` family must never serve one account's answer to another.
 *
 * Every hook in this family asks a `me`-shaped endpoint but used to cache under a key
 * that named only the RESOURCE (`"GET_MY_RBAC_PERMISSIONS_SWR"`, `["GET_MY_ORDERS_SWR",
 * page, size]`, `[COURSE_ACCESS_SWR, courseId]`). A key like that is the SAME cache entry
 * for every user: sign out of A and into B in the SAME TAB and B's hook re-keys to that
 * identical entry, so SWR paints A's settled data immediately (stale-while-revalidate)
 * and, inside `dedupingInterval`, may not even re-fetch. The keys now carry the viewer id
 * (`state.user.user.id`), so A's entry is simply unreachable from B's key.
 *
 * The tests sign out WITHOUT flushing the SWR cache on purpose: the sign-out button does
 * flush, but a revoked/expired session does not, and the key alone must make the leak
 * impossible. Each test leaves B's request HANGING, so anything B renders can only have
 * come from the cache — which is exactly the bug under test.
 *
 * Three representatives stand in for the family: PERMISSIONS (worst blast radius — leaked
 * rights paint admin affordances for a student), ORDERS (money + PII), and COURSE ACCESS
 * (a leaked `fullAccess: true` unlocks paid content client-side).
 *
 * MUTATION CHECK — each assertion was verified to fail when the fix is reverted; see the
 * per-test notes for which key segment to drop.
 */
import React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { act, renderHook, waitFor } from "@testing-library/react"
import { Provider } from "react-redux"
import { SWRConfig } from "swr"

const rbacMock = vi.fn()
const ordersMock = vi.fn()
const accessMock = vi.fn()

vi.mock("@/modules/api/rest/identity-rbac", () => ({
    getMyRbacPermissions: () => rbacMock(),
}))
vi.mock("@/modules/api/rest/commerce", () => ({
    getMyOrders: (params?: unknown) => ordersMock(params),
}))
vi.mock("@/modules/api/rest/course", () => ({
    getMyCourseAccess: (courseRawId: string) => accessMock(courseRawId),
}))

import { store } from "@/redux/store"
import { setAuthenticated } from "@/redux/slices/keycloak"
import { setUser } from "@/redux/slices/user"
import { useGetMyRbacPermissionsSwr } from "./useGetMyRbacPermissionsSwr"
import { useGetMyOrdersSwr } from "./useGetMyOrdersSwr"
import { useGetMyCourseAccessSwr } from "./useGetMyCourseAccessSwr"
import type { UserEntity } from "@/modules/types/entities/user"

/** Redux store (session + viewer) + an SWR cache private to this file. */
const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>
        <SWRConfig
            value={{
                provider: () => new Map(),
                revalidateOnFocus: false,
                revalidateOnReconnect: false,
            }}
        >
            {children}
        </SWRConfig>
    </Provider>
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

/**
 * Read `.data` DURING render, the way a real component's `const { data } = ...` does.
 *
 * SWR tracks which fields a render actually touched and only re-renders for those. A
 * `renderHook` that returns the raw SWR object without reading `data` in the render pass
 * registers no dependency, so the hook never re-renders when the fetch settles and every
 * assertion sees `undefined` forever — a harness artefact, not the bug under test.
 */
const readData = <T,>(swr: { data?: T }) => ({ data: swr.data })

/** A never-settling fetch, plus the handle that releases it with B's own answer. */
const hangingFetch = <T,>(mock: ReturnType<typeof vi.fn>) => {
    let release: (value: T) => void = () => undefined
    mock.mockImplementation(
        () =>
            new Promise<T>((resolve) => {
                release = resolve
            }),
    )
    return { release: (value: T) => release(value) }
}

describe("useGetMy* queries — cache is scoped to the viewer", () => {
    beforeEach(() => {
        rbacMock.mockReset()
        ordersMock.mockReset()
        accessMock.mockReset()
        window.localStorage.clear()
        store.dispatch(setAuthenticated(false))
        store.dispatch(setUser(null))
    })

    /**
     * MUTATION CHECK: drop `viewerId` from `myRbacPermissionsKey` and the
     * `permissions` assertion right after B signs in goes red — B is handed
     * `["course.manage", "user.manage"]`, i.e. the admin menu renders for a student.
     */
    it("does not serve admin A's permissions to student B in the same tab", async () => {
        rbacMock.mockResolvedValue({ permissions: ["course.manage", "user.manage"] })
        const { result } = renderHook(() => readData(useGetMyRbacPermissionsSwr()), { wrapper })

        await signIn("admin-a")
        await waitFor(() =>
            expect(result.current.data?.permissions).toEqual([
                "course.manage",
                "user.manage",
            ]),
        )

        await signOut()

        const b = hangingFetch<{ permissions: Array<string> }>(rbacMock)
        await signIn("student-b")

        // Nothing may be rendered for B while B's own answer is still in flight.
        expect(result.current.data).toBeUndefined()

        await act(async () => {
            b.release({ permissions: [] })
        })
        await waitFor(() => expect(result.current.data?.permissions).toEqual([]))
    })

    /**
     * MUTATION CHECK: drop `viewerId` from `myOrdersKey` and the `items` assertion
     * after B signs in goes red — B's order list paints A's purchase (`order-a`,
     * 1.500.000đ). Paging params alone never identified the account.
     */
    it("does not serve buyer A's orders to buyer B in the same tab", async () => {
        ordersMock.mockResolvedValue({
            items: [{ orderId: "order-a", totalPrice: 1_500_000 }],
            totalElements: 1,
        })
        const { result } = renderHook(
            () => readData(useGetMyOrdersSwr({ page: 0, size: 10 })),
            { wrapper },
        )

        await signIn("buyer-a")
        await waitFor(() =>
            expect(result.current.data?.items?.[0]?.orderId).toBe("order-a"),
        )

        await signOut()

        const b = hangingFetch<{ items: Array<{ orderId: string }> }>(ordersMock)
        await signIn("buyer-b")

        expect(result.current.data).toBeUndefined()

        await act(async () => {
            b.release({ items: [] })
        })
        await waitFor(() => expect(result.current.data?.items).toEqual([]))
    })

    /**
     * MUTATION CHECK: drop `viewerId` from `courseAccessKey` and the `fullAccess`
     * assertion after B signs in goes red — B reads `fullAccess: true` for a course B
     * never bought, which is what the paywall and the challenge attempt-cap key off.
     * The course UUID names the COURSE, not the buyer, so it cannot separate the two.
     */
    it("does not serve purchaser A's course access to viewer B in the same tab", async () => {
        accessMock.mockResolvedValue({
            enrolled: true,
            purchased: true,
            fullAccess: true,
        })
        const { result } = renderHook(
            () => readData(useGetMyCourseAccessSwr("course-uuid-dbi202")),
            { wrapper },
        )

        await signIn("purchaser-a")
        await waitFor(() => expect(result.current.data?.fullAccess).toBe(true))

        await signOut()

        const b = hangingFetch<unknown>(accessMock)
        await signIn("viewer-b")

        expect(result.current.data).toBeUndefined()

        await act(async () => {
            b.release({ enrolled: false, purchased: false, fullAccess: false })
        })
        await waitFor(() => expect(result.current.data?.fullAccess).toBe(false))
    })

    /** A guest must not fetch at all — the key is null, so no request is made. */
    it("keeps every key null while signed out", async () => {
        renderHook(() => readData(useGetMyRbacPermissionsSwr()), { wrapper })
        renderHook(() => useGetMyOrdersSwr(), { wrapper })
        renderHook(() => useGetMyCourseAccessSwr("course-uuid-dbi202"), { wrapper })

        await act(async () => {
            await Promise.resolve()
        })

        expect(rbacMock).not.toHaveBeenCalled()
        expect(ordersMock).not.toHaveBeenCalled()
        expect(accessMock).not.toHaveBeenCalled()
    })
})
