# settings-shell-and-security — Trang Cài đặt đầy đủ: Giao diện · Thông báo · Bảo mật

## Why

`/profile/settings` hiện **chỉ có mục Giao diện**. Trong khi đó **toàn bộ tầng dữ liệu cho phần Bảo
mật đã viết xong từ lâu và KHÔNG có màn hình nào dùng** (0 consumer):

| Việc | Hàm gọi API | Hook SWR | Đang dùng ở đâu |
|---|---|---|---|
| Đổi mật khẩu | `changePassword` | `usePostChangePasswordSwr` | **không ai** |
| Danh sách phiên | `listSessions` | `useGetSessionsSwr` | **không ai** |
| Đăng xuất 1 phiên | `revokeSession` | `usePostRevokeSessionSwr` | **không ai** |
| Đăng xuất mọi nơi | `revokeAllSessions` | `usePostRevokeAllSessionsSwr` | **không ai** |
| Thiết bị + tin cậy/thu hồi | `listSecurityDevices`… | `useGetSecurityDevicesSwr`… | **không ai** |
| Lịch sử đăng nhập | `getMyLoginHistory` | `useGetMyLoginHistorySwr` | **không ai** |
| Trạng thái 2FA / TOTP | `getMfaStatus`… | `use2fa` | trang `/authentication/two-factor` rời |

Cấu trúc menu Cài đặt cũng đã tồn tại nhưng chết: `pathConfig().profile()` có sẵn builder
`security`/`sessions`/…, và `vi/en.json` đã dịch sẵn `profileSettings.groups.*` / `items.*` — tàn dư
của một sidebar đã bị xoá. Layout `profile/layout.tsx` còn cố tình **bỏ qua `ProfileShell`** khi
segment là `settings`, tức chỗ cắm shell đã chừa sẵn.

Ngoài ra `AuthTwoFactorEnabled` trong localStorage là **cờ chết** (không ai đọc/ghi) — tàn dư của
bản mock 2FA cũ, phải xoá để không ai tưởng nó là nguồn sự thật.

## What Changes

- **Shell Cài đặt** ở `/profile/settings/*`: rail điều hướng bên trái (mirror `SubjectWorkspaceShell`,
  theo `decision/sidebar.md`) + 3 mục: **Giao diện** (giữ nguyên phần đang có), **Thông báo**,
  **Bảo mật**.
- **Thông báo**: **nhấc `PreferencesSurface` sẵn có lên thành một mục** (hiện nó nằm sau nút bánh
  răng trong Trung tâm thông báo, mở bằng `useState`) — KHÔNG dựng lại từ đầu.
- **Bảo mật**:
  - **Đổi mật khẩu** — form RHF, nói rõ hệ quả *"đổi xong sẽ đăng xuất mọi thiết bị khác"* (backend
    đã làm đúng vậy).
  - **2FA**: bật/tắt **TOTP** (dùng `use2fa` sẵn có) và **email OTP** (endpoint mới ở BE change
    `identity-session-liveness-email-2fa`); mỗi thao tác cần nhập lại mật khẩu.
  - **Thiết bị & phiên đăng nhập**: danh sách kèm thiết bị / IP / lần dùng cuối, đánh dấu rõ **"thiết
    bị này"**, nút **đăng xuất từng thiết bị** và **đăng xuất mọi nơi trừ đây**.
  - **Lịch sử đăng nhập** gần đây (thành công/thất bại) — dữ liệu đã có sẵn.
- **Bắt phiên bị thu hồi**: khi backend trả `IDENTITY_SESSION_REVOKED`, client **xoá sạch token và
  đưa về đăng nhập** thay vì thử lại vô ích (backend nay từ chối ngay khi phiên bị thu hồi).
- **Vá 2 lỗ nhỏ ở luồng đăng xuất**: nếu `POST /auth/logout` lỗi thì refresh token vẫn nằm lại trong
  localStorage, và `accessToken` trong Redux không bao giờ được xoá.

## Capabilities

### New Capabilities
- `settings-security`: trang Cài đặt có shell điều hướng; đổi mật khẩu; bật/tắt 2FA (TOTP + email);
  xem và đăng xuất thiết bị/phiên; xem lịch sử đăng nhập; xử lý phiên bị thu hồi.

## Impact

- Route mới `/profile/settings/{notifications,security}` + shell ở `profile/layout.tsx`.
- Component mới dưới `features/profile/Settings/`; `PreferencesSurface` được nhấc lên dùng chung.
- `src/modules/api/rest/identity/identity.ts` thêm 2 hàm 2FA-email + hook tương ứng.
- Xoá cờ chết `LocalStorageId.AuthTwoFactorEnabled`; sửa `pathConfig().profile().edit()` đang trỏ sai
  (`/profile/settings/edit` trong khi route thật là `/profile/edit`).
- i18n: dùng lại `profileSettings.*` đã dịch sẵn, bổ sung khoá mới cho vi + en.
- **Phụ thuộc BE**: change `identity-session-liveness-email-2fa` (endpoint 2FA-email + mã lỗi
  `IDENTITY_SESSION_REVOKED`). Không có nó thì mục 2FA-email ẩn, phần còn lại vẫn chạy.
