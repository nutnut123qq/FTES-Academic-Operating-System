/**
 * Regression: `keycloak.initialized` phải được set THẬT.
 *
 * Không dòng nào trong `src/` dispatch `setInitialized`, nên cờ này kẹt `false` vĩnh
 * viễn và mọi chỗ đọc nó là code chết — `HomeLanding` (`signedIn = initialized &&
 * authenticated`) chưa từng chuyển hướng ai, `AccountMenuDropdown` phải tự chế heuristic
 * riêng. Cờ chỉ có nghĩa khi được bật ở CẢ hai nhánh: có user, và khách/lỗi.
 *
 * Cái gì được mock và vì sao:
 * - `queryMe` / `getSelfProfile` — hai chặng mạng, không thể chạy thật trong unit test.
 * - `hydrateAppearanceFromServer` — side effect về giao diện, không liên quan tới cờ.
 * - Redux KHÔNG mock: khẳng định đúng thứ mà app đọc, `store.getState().keycloak`.
 * - SWR được cho một cache RIÊNG mỗi ca, nếu không thì ca hai bị dedup và fetcher không
 *   chạy lại.
 */
import React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { Provider } from "react-redux"
import { SWRConfig } from "swr"

const queryMeMock = vi.fn()
const getSelfProfileMock = vi.fn()

vi.mock("@/modules/api/graphql/queries/query-me", () => ({
    queryMe: () => queryMeMock(),
}))
vi.mock("@/modules/api/rest/profile", () => ({
    getSelfProfile: () => getSelfProfileMock(),
}))
vi.mock("@/hooks/zustand/appearance/store", () => ({
    hydrateAppearanceFromServer: () => Promise.resolve(),
}))

import { store } from "@/redux/store"
import { setAuthenticated, setInitialized } from "@/redux/slices/keycloak"
import { setUser } from "@/redux/slices/user"
import { __resetAuthReadyForTests } from "@/modules/auth/auth-ready"
import { useQueryUserSwr } from "./useQueryUserSwr"

/** Redux thật + một cache SWR riêng cho file này. */
const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>
        <SWRConfig value={{
            provider: () => new Map(),
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            errorRetryCount: 0,
        }}>
            {children}
        </SWRConfig>
    </Provider>
)

/** Viewer tối thiểu đủ để fetcher đi hết nhánh thành công. */
const viewer = {
    user: {
        id: "viewer-1",
        username: "viewer",
        displayName: "Viewer",
        avatarUrl: null,
    },
    progression: { totalXp: 10 },
    permissions: [],
    scopedGrants: [],
}

describe("useQueryUserSwr — chốt phiên đã ngã ngũ", () => {
    beforeEach(() => {
        queryMeMock.mockReset()
        getSelfProfileMock.mockReset()
        getSelfProfileMock.mockResolvedValue(null)
        window.localStorage.clear()
        __resetAuthReadyForTests()
        // store là module singleton — mọi ca bắt đầu ở "chưa ngã ngũ"
        store.dispatch(setInitialized(false))
        store.dispatch(setAuthenticated(false))
        store.dispatch(setUser(null))
    })

    it("ca 4a: nhánh CÓ user → initialized + authenticated đều bật", async () => {
        window.localStorage.setItem("keycloak:access_token", "tok")
        queryMeMock.mockResolvedValue({ data: { me: viewer } })

        renderHook(() => useQueryUserSwr(), { wrapper })

        await waitFor(() => expect(store.getState().keycloak.initialized).toBe(true))
        expect(store.getState().keycloak.authenticated).toBe(true)
        expect(store.getState().user.user?.id).toBe("viewer-1")
    })

    it("ca 4b: nhánh KHÁCH (không token) → initialized vẫn bật, authenticated vẫn false", async () => {
        renderHook(() => useQueryUserSwr(), { wrapper })

        await waitFor(() => expect(store.getState().keycloak.initialized).toBe(true))
        expect(store.getState().keycloak.authenticated).toBe(false)
        expect(queryMeMock).not.toHaveBeenCalled()
    })

    it("ca 4c: nhánh LỖI (me ném) → initialized vẫn bật, không kẹt ở 'đang xác thực'", async () => {
        window.localStorage.setItem("keycloak:access_token", "tok")
        queryMeMock.mockRejectedValue(new Error("network down"))

        renderHook(() => useQueryUserSwr(), { wrapper })

        await waitFor(() => expect(store.getState().keycloak.initialized).toBe(true))
        expect(store.getState().keycloak.authenticated).toBe(false)
    })
})
