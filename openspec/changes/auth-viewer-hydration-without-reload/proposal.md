# auth-viewer-hydration-without-reload — đăng nhập tại chỗ phải thay đổi giao diện ngay, không cần F5

> **Change hồi tố.** Code đã ship (đợt 1 vá header, đợt 2 vá dữ liệu enrollment); tài liệu viết SAU
> theo diff thật.

## Why

Đăng nhập xong mà giao diện vẫn là của khách, phải F5 mới đúng. Hai gốc khác nhau, cùng một lớp lỗi
"session bắt đầu mà không có page load":

**(a) Header không đổi.** Token là MỘT NỬA phiên. Danh tính mà navbar render nằm ở
`state.user.user`, và người ghi DUY NHẤT là fetcher của query `me` (`useQueryUserSwr`). Các đường
đăng nhập chỉ lưu token + `setAuthenticated(true)`, rồi TRÔNG CHỜ việc lật cờ đó đổi SWR key
(`["QUERY_USER_SWR", "true"]`) sẽ tự kéo `me` về. Đổi key chỉ fetch khi SWR CHƯA settle key mới —
trong tab đã từng đăng nhập một lần (đăng xuất rồi đăng nhập lại, hoặc phiên bị thu hồi), key
signed-in đã settle sẵn nên SWR trả cache, fetcher không chạy, `setUser` không bao giờ dispatch.
Kết quả: toast "đăng nhập thành công" nằm trên một navbar vẫn hiện avatar khách.

**(b) Danh sách khoá đã ghi danh không xuất hiện.** 4 hook SWR gate key bằng
`window.localStorage.getItem("keycloak:access_token")` ĐỌC LÚC RENDER. localStorage không reactive:
đăng nhập không kèm reload thì token đã ghi nhưng hook không re-render, key vẫn `null`, fetch không
bao giờ chạy. Băng "học tiếp" ở home, badge "đã ghi danh" trên card catalog, trang "Khoá tôi dạy",
và thẻ bán hàng ở trang chi tiết khoá đều đứng nguyên tới khi F5.

## What Changes

- **MỚI `useRevalidateViewerSwr()`** cạnh `useQueryUserSwr`, cùng với key factory
  `queryUserSwrKey(authenticated)` được export. Hook trả một callback `mutate(queryUserSwrKey(true))`
  — bỏ entry đã settle của key signed-in NGAY (kể cả khi hook đang render trên key signed-out), nên
  lần mount sau khi re-render fetch thật: một request `me`, không phải hai.
- **5 đường bắt đầu phiên `await` hydration đó** trước khi coi như đăng nhập xong:
  `usePostKeycloakLoginSwr` (mật khẩu), `usePostLoginWithGoogleSwr`, `usePostVerifyMfaChallengeSwr`,
  `usePostVerifyRegistrationSwr`, và `useExchangeCodeForToken` (OAuth redirect). `trigger()` chỉ
  resolve khi giao diện signed-in thật sự vẽ được.
- **4 hook đổi gate từ localStorage sang redux** `state.keycloak.authenticated` (nguồn reactive,
  cùng nguồn với `useQueryUserSwr`): `useQueryMyCoursesSwr`, `useQueryMyEnrolledSlugsSwr`,
  `useQueryTeachingCoursesSwr`, `useQueryCourseDetailSwr` (key `["my-enrollments", courseId]` +
  cờ `needAccessFallback`). `isLoading` cũng đổi theo (`authenticated && isLoading`) để khách không
  bao giờ "đang tải".
- **Test hồi quy** `signed-in-without-reload.test.tsx` (2 ca) + cập nhật `useQueryCourseDetailSwr.test.tsx`
  (5 ca cũ) cho hợp gate mới (bọc redux Provider, helper `signIn()` ghi CẢ token lẫn cờ redux).

## Impact

- Affected specs: `auth-viewer-hydration` (ADDED — capability mới)
- Affected code: `useQueryUserSwr.ts`, 4 hook mutation đăng nhập, `useExchangeCodeForToken.ts`,
  `components/features/course/hooks/{useQueryMyCoursesSwr,useQueryMyEnrolledSlugsSwr,useQueryTeachingCoursesSwr,useQueryCourseDetailSwr}.ts`
  (+ 2 file test)
- **Đánh đổi có chủ ý:** khi F5 / tải trang mới, `authenticated` khởi tạo `false` và chỉ lật khi
  query `me` resolve → enrollments fetch SAU `me` chừng một vòng request (trước đây song song). Giá
  của việc dùng một nguồn reactive duy nhất.
- **Tồn đọng (KHÔNG vá trong change này):** key `["course-my-courses"]` / `["course-my-enrolled-slugs"]`
  không mang danh tính người dùng → đăng xuất A rồi đăng nhập B trong cùng tab trong `dedupingInterval`
  (60s) có thể ăn lại cache của A. `useQueryUserSwr` không dính vì key có `String(authenticated)`.
- `src/components/features/dashboard/index.tsx` đọc localStorage nhưng SAU khi mount (useEffect +
  state) nên KHÔNG cùng lỗi — cố ý không đụng.
