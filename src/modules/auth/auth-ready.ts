/**
 * "Phiên đã ngã ngũ chưa?" — tín hiệu MỘT-LẦN cho cả app, không dính React/redux.
 *
 * Vì sao cần: redux không persist, nên `state.keycloak.authenticated` là `false` ở MỌI
 * lần tải trang, kể cả với người đang đăng nhập. Nó chỉ bật `true` sau khi fetcher của
 * `useQueryUserSwr` chạy xong (GraphQL `me` + REST `/profiles/me`). Trong cửa sổ đó,
 * `false` KHÔNG có nghĩa "khách" — nó có nghĩa "chưa biết". Bất cứ ai coi hai thứ đó là
 * một sẽ vứt cú bấm đầu tiên của người dùng và mở nhầm modal đăng nhập.
 *
 * Module này tách riêng câu hỏi "đã biết chưa" khỏi câu trả lời "là ai": nơi gọi chờ
 * {@link authReady} rồi ĐỌC LẠI store tươi. Trạng thái auth không nằm ở đây.
 *
 * - {@link isAuthReady} — thăm dò ĐỒNG BỘ. Đây là lý do trạng thái ổn định (99.9% cú bấm)
 *   vẫn chạy thẳng, không bị đẩy sang microtask: giữ nguyên chuỗi cử chỉ của trình duyệt
 *   (`preventDefault`, mở tab, focus) và giữ nguyên hành vi với mọi test đang mock hook.
 * - {@link authReady} — promise settle, dùng cho cú bấm rơi đúng vào cửa sổ hydration.
 * - {@link markAuthReady} — idempotent; fetcher gọi trong `finally` nên MỌI đường ra
 *   (khách không token / lỗi mạng / thành công) đều kết thúc chờ.
 */

/**
 * Trần chờ. Cửa sổ hydration có thể gồm ba chặng mạng NỐI TIẾP (refresh token →
 * `me` → `/profiles/me`), nên trần phải rộng hơn một chặng chậm.
 *
 * ponytail: 8 giây là con số CỨNG, chọn theo cảm tính chứ không đo. Nó tồn tại chỉ để
 * không có CTA nào treo vĩnh viễn khi backend chết hoặc SWR không bao giờ settle — chờ
 * mãi còn tệ hơn lỗi đang vá. Hết trần thì rơi về nhánh "khách" (mở modal đăng nhập),
 * tức là người đang đăng nhập gặp mạng cực chậm vẫn có thể thấy modal sai.
 * Đường nâng cấp khi có ai đó thấy đau: bỏ trần cứng, treo vào `AbortSignal`/timeout
 * thật của tầng transport, và cho CTA một trạng thái "đang xác thực phiên" thay vì
 * im lặng chờ.
 */
const AUTH_READY_TIMEOUT_MS = 8_000

/** Hàm resolve của promise hiện tại, giữ lại để `markAuthReady` gọi được. */
let resolveReady: () => void = () => undefined
/** Promise settle của phiên. */
let readyPromise = new Promise<void>((resolve) => {
    resolveReady = resolve
})
/** Đã resolve chưa — cờ đọc đồng bộ. */
let ready = false
/** Handle của net an toàn, chỉ tồn tại khi đã có người thực sự chờ. */
let timer: ReturnType<typeof setTimeout> | null = null

/**
 * Phiên đã ngã ngũ chưa — đọc ĐỒNG BỘ, không await.
 * @returns `true` khi đã biết chắc là khách hay là người đã đăng nhập.
 */
export const isAuthReady = () => ready

/**
 * Chờ phiên ngã ngũ.
 *
 * Net an toàn được lên nòng LƯỜI, ngay lần chờ đầu tiên và chỉ ở trình duyệt — không
 * dựng timer trong SSR, và không dựng timer cho phiên chạy đã xong ngay từ đầu.
 * @returns promise LUÔN resolve, chậm nhất là sau {@link AUTH_READY_TIMEOUT_MS}.
 */
export const authReady = () => {
    if (!ready && !timer && typeof window !== "undefined") {
        timer = setTimeout(markAuthReady, AUTH_READY_TIMEOUT_MS)
    }
    return readyPromise
}

/**
 * Báo phiên đã ngã ngũ. Idempotent — `errorRetryCount: 2` (`SwrProvider`) khiến nhánh
 * lỗi gọi hàm này ba lần, và net an toàn có thể nổ song song với lần settle thật.
 */
export const markAuthReady = () => {
    if (ready) {
        return
    }
    ready = true
    if (timer) {
        clearTimeout(timer)
        timer = null
    }
    resolveReady()
}

/**
 * CHỈ dùng trong test: trả module về trạng thái "chưa biết".
 * Module-level state là singleton, nên không có cái này thì ca test thứ hai trong cùng
 * file luôn thấy phiên đã settle từ ca đầu.
 */
export const __resetAuthReadyForTests = () => {
    if (timer) {
        clearTimeout(timer)
        timer = null
    }
    ready = false
    readyPromise = new Promise<void>((resolve) => {
        resolveReady = resolve
    })
}
