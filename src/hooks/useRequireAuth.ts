"use client"

import { useCallback, useEffect, useRef } from "react"
import { useAppDispatch, useAppSelector, useAppStore } from "@/redux/hooks"
import { AuthenticationModalTab, setAuthenticationModalTab } from "@/redux/slices/tabs"
import { useAuthenticationOverlayState } from "@/hooks/zustand/overlay/hooks"
import { authReady, isAuthReady } from "@/modules/auth/auth-ready"

/**
 * Shared auth guard for guest-gated interactions (like, comment, save/bookmark,
 * enroll, any auth-required CTA) — the SINGLE entry point that consolidates all
 * "must be signed in" handling into the `AuthenticationModal` popup.
 *
 * Signed-in → the action runs. Guest → the modal opens on the SignIn tab with a
 * contextual message (an i18n key stashed in the overlay store, e.g.
 * `auth.context.enroll`) and the action does NOT run; the visitor stays on the
 * current route. The context message is cleared when the modal closes.
 *
 * **Cửa sổ hydration.** Redux không persist: `state.keycloak.authenticated` là `false`
 * ở mọi lần tải trang cho tới khi fetcher của `useQueryUserSwr` chạy xong. Coi `false`
 * trong cửa sổ đó là "khách" chính là lý do "join khoá học phải bấm nhiều lần" — cú bấm
 * đầu bị vứt và modal đăng nhập bật ra với người đang đăng nhập. Nên:
 *
 * 1. `requireAuth` đọc store TƯƠI (`store.getState()`) chứ không đọc biến closure —
 *    biến closure đã stale ngay sau `await`.
 * 2. `guard` CHỜ phiên ngã ngũ (xem `@/modules/auth/auth-ready`) rồi mới quyết, thay vì
 *    vứt hành động. Chờ luôn có trần, hết trần thì rơi về nhánh khách.
 * 3. Đường ổn định vẫn ĐỒNG BỘ nhờ `isAuthReady()`: không có nó thì mọi cú bấm đều bị
 *    đẩy sang microtask vĩnh viễn, `preventDefault` trong action thành quá muộn và chuỗi
 *    cử chỉ của trình duyệt (mở tab, focus) bị mất.
 *
 * @returns `authenticated` (cờ phiên), `requireAuth(contextKey?)` (kiểm đồng bộ),
 * `requireAuthAsync(contextKey?)` (kiểm có chờ hydration, dùng trong hàm `async`) và
 * `guard(action, contextKey?)` (bọc callback, tự chọn đường đồng bộ/chờ).
 */
export const useRequireAuth = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const dispatch = useAppDispatch()
    const store = useAppStore()
    const { open } = useAuthenticationOverlayState()
    /** Component còn sống không — đọc sau `await` để không chạy action / mở modal trên trang đã rời. */
    const mountedRef = useRef(true)
    /**
     * Những `action` đang chờ phiên ngã ngũ — dedupe theo CHÍNH tham chiếu hàm, KHÔNG
     * theo một cờ boolean cấp hook. Một `useRequireAuth()` thường sinh nhiều CTA khác
     * nhau (`onEnroll`, `onAddToCart`, `onTryLearning` trong `useCourseEnrollment`), nên
     * cờ dùng chung khiến cú bấm vào nút THỨ HAI bị `return` trắng: không action, không
     * modal, không spinner — nút coi như chết cho tới khi phiên ngã ngũ.
     */
    const pendingRef = useRef<Set<unknown>>(new Set())

    // Gán lại `true` khi mount chứ không chỉ dựa vào giá trị khởi tạo: StrictMode ở dev
    // mount → cleanup → mount lại, nên nếu chỉ có nhánh cleanup thì cờ kẹt `false` và
    // mọi hành động chờ bị nuốt im lặng — chỉ ở dev, đúng kiểu bug khó tìm nhất.
    useEffect(
        () => {
            mountedRef.current = true
            return () => {
                mountedRef.current = false
            }
        },
        [],
    )

    /**
     * Kiểm phiên NGAY, không chờ.
     *
     * Đọc `store.getState()` chứ không đọc `authenticated` của render hiện tại: hàm này
     * được gọi lại sau `await` trong {@link requireAuthAsync}, lúc đó giá trị closure đã cũ.
     * Tác dụng phụ có lợi: `authenticated` biến khỏi deps nên callback ổn định định danh.
     *
     * ⚠️ Hàm này KHÔNG chờ hydration: trong cửa sổ đó nó vẫn kết luận "khách" cho người
     * đang đăng nhập. Vì vậy nó CHỈ dành cho hai việc mà kết luận-ngay là đúng ý:
     * (a) nút có nhãn "Đăng nhập để …" — mục đích của nó chính là mở modal;
     * (b) predicate ĐỒNG BỘ mà nơi gọi không await được (ví dụ `onBeforeExpand` của
     * `CommentComposer`).
     * Chốt TRƯỚC một mutation thì dùng {@link requireAuthAsync} (nơi gọi đã `async`) hoặc
     * {@link guard} (event handler) — đừng dùng hàm này, nếu không cú bấm đầu tiên sau khi
     * tải trang lại bị vứt.
     * @param contextKey - i18n key of the contextual message shown in the modal
     * (defaults to the generic "sign in to continue" message).
     * @returns `true` when signed in (caller proceeds); `false` for guests (the
     * modal was opened on SignIn with the context message, caller must abort).
     */
    const requireAuth = useCallback(
        (contextKey?: string): boolean => {
            if (store.getState().keycloak.authenticated) {
                return true
            }
            dispatch(setAuthenticationModalTab(AuthenticationModalTab.SignIn))
            open(contextKey ?? "auth.context.generic")
            return false
        },
        [store, dispatch, open],
    )

    /**
     * Như {@link requireAuth} nhưng CHỜ phiên ngã ngũ trước khi kết luận — dùng cho nơi
     * gọi vốn đã nằm trong hàm `async` (`if (!(await requireAuthAsync(key))) return`).
     * @param contextKey - i18n key of the contextual message shown in the modal.
     * @returns `true` khi được phép chạy tiếp; `false` khi là khách (đã mở modal) hoặc
     * khi component đã unmount trong lúc chờ (không chạy, cũng không làm phiền).
     */
    const requireAuthAsync = useCallback(
        async (contextKey?: string): Promise<boolean> => {
            if (isAuthReady()) {
                return requireAuth(contextKey)
            }
            await authReady()
            if (!mountedRef.current) {
                return false
            }
            return requireAuth(contextKey)
        },
        [requireAuth],
    )

    /**
     * Wrap an action so it only runs when signed in; guests get the modal instead.
     *
     * Phiên đã ngã ngũ → chạy thẳng, đồng bộ, y hệt trước. Chưa ngã ngũ → xếp hàng chờ
     * rồi chạy, và cú bấm tiếp theo vào CÙNG một `action` bị nuốt: bấm hai lần vào
     * "Ghi danh" khi đang hydrate không được phép tạo hai dòng giỏ hàng. Chốt mở lại
     * ngay khi cú bấm đầu quyết xong.
     *
     * Dedupe bám tham chiếu `action`, KHÔNG bám hook instance: hai CTA khác nhau lấy
     * `guard` từ cùng một `useRequireAuth()` không được chặn nhau.
     *
     * ponytail: `action` là arrow inline ở phần lớn nơi gọi, nên một lần re-render xen
     * giữa hai cú bấm sẽ đổi tham chiếu và cú bấm thứ hai lọt. Chấp nhận: đó đúng bằng
     * mức bảo vệ của đường ĐỒNG BỘ (không dedupe gì cả), tức không tệ hơn trạng thái ổn
     * định. Muốn chắc hơn thì chống trùng ở chính action (cờ in-flight), như
     * `pendingLikes` trong `PostCommentThread`.
     * @param action - the auth-required callback to protect.
     * @param contextKey - i18n key of the contextual message shown in the modal.
     * @returns a callback with the same arguments that no-ops (opens the modal) for guests.
     */
    const guard = useCallback(
        <Args extends Array<unknown>>(action: (...args: Args) => void, contextKey?: string) =>
            (...args: Args) => {
                if (isAuthReady()) {
                    if (requireAuth(contextKey)) {
                        action(...args)
                    }
                    return
                }
                const pending = pendingRef.current
                if (pending.has(action)) {
                    return
                }
                pending.add(action)
                void requireAuthAsync(contextKey)
                    .then((allowed) => {
                        if (allowed) {
                            action(...args)
                        }
                    })
                    .finally(() => {
                        pending.delete(action)
                    })
            },
        [requireAuth, requireAuthAsync],
    )

    return { authenticated, requireAuth, requireAuthAsync, guard }
}
