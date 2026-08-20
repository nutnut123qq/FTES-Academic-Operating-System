/**
 * Regression: cú bấm ĐẦU TIÊN sau khi tải trang bị nuốt ("join khoá học phải bấm nhiều
 * lần mới ăn").
 *
 * Redux không persist, nên `state.keycloak.authenticated` là `false` ở MỌI lần tải
 * trang — kể cả với người đang đăng nhập — cho tới khi fetcher của `useQueryUserSwr`
 * chạy xong (`me` + `/profiles/me`). `guard()` cũ coi `false` là "khách": nó mở modal
 * đăng nhập và VỨT hành động. Ca 1 dưới đây fail với code cũ đúng vì lý do đó.
 *
 * Cái gì được mock và vì sao:
 * - `@/hooks/zustand/overlay/hooks` — chỉ cần biết modal CÓ mở không và mở với
 *   contextKey nào; store zustand thật không thêm thông tin gì cho ba ca này.
 * - Redux thì KHÔNG mock: dùng store singleton thật, vì thứ đang test chính là
 *   "đọc lại state tươi sau khi chờ" chứ không phải một biến closure.
 * - `__resetAuthReadyForTests` phải chạy mỗi ca: tín hiệu settle là module singleton,
 *   ca sau sẽ thấy phiên đã ngã ngũ từ ca trước.
 *
 * PHẠM VI. Ba bề mặt của hook được phủ riêng, đừng đọc nhầm ca này sang ca kia:
 * - `guard` — đường ổn định phải ĐỒNG BỘ (ca 0), đường hydration phải CHỜ (ca 1) và
 *   không được để hai CTA khác nhau chặn nhau (ca 4).
 * - `requireAuthAsync` — chờ rồi mới kết luận (ca 6).
 * - `requireAuth` — CỐ Ý kết luận ngay, kể cả khi phiên chưa ngã ngũ (ca 5). Đó là hợp
 *   đồng của nó, không phải bug còn sót: nó chỉ dành cho nút "Đăng nhập để …" và cho
 *   predicate đồng bộ không await được. Mọi chốt TRƯỚC mutation đã chuyển sang
 *   `requireAuthAsync`/`guard`.
 */
import React from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { act, renderHook, waitFor } from "@testing-library/react"
import { Provider } from "react-redux"

const open = vi.fn()

vi.mock("@/hooks/zustand/overlay/hooks", () => ({
    useAuthenticationOverlayState: () => ({ open }),
}))

import { store } from "@/redux/store"
import { setAuthenticated } from "@/redux/slices/keycloak"
import { AuthenticationModalTab, setAuthenticationModalTab } from "@/redux/slices/tabs"
import { __resetAuthReadyForTests, markAuthReady } from "@/modules/auth/auth-ready"
import { useRequireAuth } from "./useRequireAuth"

/** Redux store thật — bản vá sống nhờ đọc `store.getState()` sau khi chờ. */
const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
)

describe("useRequireAuth — cửa sổ hydration", () => {
    beforeEach(() => {
        open.mockReset()
        window.localStorage.clear()
        __resetAuthReadyForTests()
        // store là module singleton — mọi ca bắt đầu ở trạng thái "chưa biết"
        store.dispatch(setAuthenticated(false))
        store.dispatch(setAuthenticationModalTab(AuthenticationModalTab.SignIn))
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it("ca 0: phiên đã ngã ngũ + đã đăng nhập → action chạy NGAY trong cùng tick", () => {
        // Ca này ghim nhánh ĐỒNG BỘ của `guard`. Nếu ai đó bỏ `isAuthReady()` đi và cho
        // mọi cú bấm chạy qua promise, ca này đỏ — còn ca 1/3/3b thì không, vì chúng đều
        // `await`/`waitFor` nên không phân biệt được "cùng tick" với "microtask sau".
        act(() => {
            store.dispatch(setAuthenticated(true))
            markAuthReady()
        })
        const { result } = renderHook(() => useRequireAuth(), { wrapper })

        let ranSync = false
        act(() => {
            result.current.guard(() => {
                ranSync = true
            })()
        })

        // KHÔNG await ở đâu cả: `guard` mà đẩy action sang `.then` thì cờ này còn `false`.
        expect(ranSync).toBe(true)
        expect(open).not.toHaveBeenCalled()
    })

    it("ca 1: đang hydrate mà bấm → hành động CHỜ rồi chạy, không mở modal", async () => {
        window.localStorage.setItem("keycloak:access_token", "tok")
        const action = vi.fn()
        const { result } = renderHook(() => useRequireAuth(), { wrapper })

        // Phiên chưa ngã ngũ: bấm hai phát liên tiếp như người dùng sốt ruột.
        act(() => {
            result.current.guard(action, "auth.context.enroll")()
            result.current.guard(action, "auth.context.enroll")()
        })
        expect(action).not.toHaveBeenCalled()
        expect(open).not.toHaveBeenCalled()

        // `me` trả về: phiên ngã ngũ và người này ĐANG đăng nhập.
        await act(async () => {
            store.dispatch(setAuthenticated(true))
            markAuthReady()
        })

        // Hành động chạy — và chạy ĐÚNG MỘT LẦN (chốt chống double-fire).
        await waitFor(() => expect(action).toHaveBeenCalledTimes(1))
        expect(open).not.toHaveBeenCalled()
    })

    it("ca 2: khách thật → không chạy hành động, mở modal đúng contextKey", async () => {
        const action = vi.fn()
        const { result } = renderHook(() => useRequireAuth(), { wrapper })

        // Không có token: fetcher `me` return sớm và chốt settle ngay.
        act(() => {
            markAuthReady()
        })
        act(() => {
            result.current.guard(action, "auth.context.enroll")()
        })

        expect(action).not.toHaveBeenCalled()
        expect(open).toHaveBeenCalledTimes(1)
        expect(open).toHaveBeenCalledWith("auth.context.enroll")
        expect(store.getState().tabs.authenticationModalTab).toBe(AuthenticationModalTab.SignIn)
    })

    it("ca 3: backend không bao giờ trả lời → chờ vẫn kết thúc trong trần, rơi về khách", async () => {
        vi.useFakeTimers()
        window.localStorage.setItem("keycloak:access_token", "tok")
        const action = vi.fn()
        const { result } = renderHook(() => useRequireAuth(), { wrapper })

        act(() => {
            result.current.guard(action, "auth.context.enroll")()
        })
        // `markAuthReady` KHÔNG bao giờ được gọi — mô phỏng SWR không settle.
        expect(action).not.toHaveBeenCalled()
        expect(open).not.toHaveBeenCalled()

        await act(async () => {
            await vi.advanceTimersByTimeAsync(8_000)
        })

        // Không treo: rơi về nhánh khách, CTA có phản hồi thay vì im lặng mãi.
        expect(action).not.toHaveBeenCalled()
        expect(open).toHaveBeenCalledWith("auth.context.enroll")
    })

    it("ca 3b: component unmount trong lúc chờ → không chạy hành động, cũng không mở modal", async () => {
        window.localStorage.setItem("keycloak:access_token", "tok")
        const action = vi.fn()
        const { result, unmount } = renderHook(() => useRequireAuth(), { wrapper })

        act(() => {
            result.current.guard(action, "auth.context.enroll")()
        })
        unmount()

        await act(async () => {
            markAuthReady()
        })

        expect(action).not.toHaveBeenCalled()
        expect(open).not.toHaveBeenCalled()
    })

    it("ca 4: hai CTA KHÁC NHAU của cùng một hook không được chặn nhau khi đang hydrate", async () => {
        // Hồi quy: chốt chống double-fire từng là MỘT cờ boolean cho cả hook instance, nên
        // `useCourseEnrollment` (một `useRequireAuth()` đẻ ra `onEnroll` + `onAddToCart` +
        // `onTryLearning`) nuốt im lặng cú bấm vào nút thứ hai: không action, không modal,
        // không spinner. Dedupe phải bám THAM CHIẾU action, không bám hook instance.
        window.localStorage.setItem("keycloak:access_token", "tok")
        const addToCart = vi.fn()
        const enroll = vi.fn()
        const { result } = renderHook(() => useRequireAuth(), { wrapper })
        const onAddToCart = result.current.guard(addToCart, "auth.context.enroll")
        const onEnroll = result.current.guard(enroll, "auth.context.enroll")

        act(() => {
            onAddToCart()
            onEnroll()
        })
        expect(addToCart).not.toHaveBeenCalled()
        expect(enroll).not.toHaveBeenCalled()

        await act(async () => {
            store.dispatch(setAuthenticated(true))
            markAuthReady()
        })

        await waitFor(() => expect(addToCart).toHaveBeenCalledTimes(1))
        expect(enroll).toHaveBeenCalledTimes(1)
        expect(open).not.toHaveBeenCalled()
    })

    it("ca 5: `requireAuth` đồng bộ CỐ Ý kết luận ngay — kể cả khi phiên chưa ngã ngũ", () => {
        // Hợp đồng, không phải bug còn sót: nút "Đăng nhập để bình luận" muốn đúng hành vi
        // này. Ghim lại để không ai lỡ tay đem `requireAuth` ra chốt trước một mutation —
        // chỗ đó phải là `requireAuthAsync`/`guard` (ca 1, ca 6).
        window.localStorage.setItem("keycloak:access_token", "tok")
        const { result } = renderHook(() => useRequireAuth(), { wrapper })

        // `markAuthReady` chưa được gọi: phiên vẫn "chưa biết".
        let allowed: boolean | undefined
        act(() => {
            allowed = result.current.requireAuth("auth.context.like")
        })

        expect(allowed).toBe(false)
        expect(open).toHaveBeenCalledWith("auth.context.like")
    })

    it("ca 6: `requireAuthAsync` CHỜ phiên ngã ngũ rồi mới kết luận", async () => {
        window.localStorage.setItem("keycloak:access_token", "tok")
        const { result } = renderHook(() => useRequireAuth(), { wrapper })

        let settled: boolean | undefined
        act(() => {
            void result.current.requireAuthAsync("auth.context.like").then((value) => {
                settled = value
            })
        })

        // Chưa ngã ngũ → chưa kết luận, và tuyệt đối chưa mở modal.
        await act(async () => {
            await Promise.resolve()
        })
        expect(settled).toBeUndefined()
        expect(open).not.toHaveBeenCalled()

        await act(async () => {
            store.dispatch(setAuthenticated(true))
            markAuthReady()
        })

        await waitFor(() => expect(settled).toBe(true))
        expect(open).not.toHaveBeenCalled()
    })
})
