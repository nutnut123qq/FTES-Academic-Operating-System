# Tasks — settings-shell-and-security

## 1. Shell Cài đặt
- [x] 1.1 Rail điều hướng `/profile/settings/*` (mirror `SubjectWorkspaceShell` + `decision/sidebar.md`:
      Link không phải ListBox, active = `bg-accent/10 text-accent`, MỘT ngữ cảnh cuộn, sticky rail)
- [x] 1.2 Route mới `settings/notifications`, `settings/security`; `settings` giữ Giao diện
- [x] 1.3 Cắm vào nhánh `segment === "settings"` sẵn có trong `profile/layout.tsx` (chỗ đã cố tình bỏ
      qua `ProfileShell`); active dùng `useSelectedLayoutSegment`, KHÔNG `usePathname`
- [x] 1.4 Dùng lại khoá i18n `profileSettings.groups.*` / `items.*` đã dịch sẵn

## 2. Thông báo
- [x] 2.1 NHẤC `PreferencesSurface` sẵn có lên thành section (không dựng lại); Trung tâm thông báo vẫn
      mở được như cũ — cùng một SWR key nên hai nơi luôn khớp
- [x] 2.2 Thay `Spinner` trần bằng skeleton mirror layout (cannon §3.7)

## 3. Bảo mật
- [x] 3.1 Đổi mật khẩu: form RHF + zod (i18n trong `useMemo`), dùng `usePostChangePasswordSwr`,
      nói rõ "sẽ đăng xuất mọi thiết bị khác"; secrets rule: `type="password"`, không nút hiện mật khẩu
- [x] 3.2 2FA: trạng thái từ `useGetMfaStatusSwr`; TOTP dùng `use2fa` sẵn có; **email OTP** dùng hook
      mới (BE `identity-session-liveness-email-2fa`); mỗi thao tác bật/tắt cần nhập mật khẩu hiện tại;
      BE không trả trạng thái một phương thức → ẨN phương thức đó
- [x] 3.3 Thiết bị & phiên: `useGetSessionsSwr`, đánh dấu `current`, nút đăng xuất từng phiên +
      "đăng xuất mọi nơi trừ đây" (`revokeAllSessions(true)`); confirm trước khi chạy; xong revalidate
- [x] 3.4 Lịch sử đăng nhập: `useGetMyLoginHistorySwr` (thành công/thất bại + IP + thời điểm)
- [x] 3.5 Mọi vùng data bọc `AsyncContent` + skeleton mirror layout; confirm huỷ dùng dialog dùng chung
      (tổng quát hoá cái đang hardcode namespace `communityHub`, hoặc truyền nhãn tường minh)

## 4. Phiên bị thu hồi + dọn đăng xuất
- [x] 4.1 REST client bắt `IDENTITY_SESSION_REVOKED` → xoá CẢ access lẫn refresh token, reset Redux,
      xoá cache SWR, đưa về đăng nhập (KHÔNG thử refresh — refresh cũng sẽ hỏng)
- [x] 4.2 `useMutateSignOutSwr`: `finally` xoá CẢ refresh token (hiện chỉ xoá access) và dispatch
      `setAccessToken(undefined)` (hiện không bao giờ xoá) — lỗi mạng lúc logout không được để token lại
- [x] 4.3 Xoá cờ chết `LocalStorageId.AuthTwoFactorEnabled` (không ai đọc/ghi, gây hiểu nhầm là nguồn sự thật)

## 5. Verify
- [x] 5.1 `npx tsc --noEmit` sạch (xoá `.next` nếu type sinh tự động còn sót sau khi đổi nhánh)
- [x] 5.2 `npm run build` (turbopack — KHÔNG đổi sang webpack) xanh
- [x] 5.3 Unit cho hàm thuần mới (map phiên → dòng hiển thị, phân tách current/khác, schema zod đổi mật khẩu)

## Ghi chú khi làm

- **Danh sách thiết bị dùng `SessionView` (`useGetSessionsSwr`), KHÔNG `SecurityDeviceView`**: phiên =
  "đang đăng nhập ngay lúc này", có cờ `current` để đánh dấu "thiết bị này", và `sid` chính là thứ
  `revokeSession`/`revokeAllSessions` nhận. `GET /identity/devices` là bản ghi thiết bị sống lâu hơn
  (phục vụ device-trust), còn lại cả sau khi đăng xuất → liệt kê nó sẽ hiện máy không còn phiên nào.
- **Email-2FA hiện ẨN** vì BE change `identity-session-liveness-email-2fa` chưa ship: `emailOtpEnabled`
  là optional, `undefined` ⇒ không render control (đúng scenario "backend does not support a method").
  Hàm API + hook đã sẵn, bật lên tự động khi BE trả field.
- **`ConfirmDialog` tách thành block props-only** `blocks/feedback/ConfirmDialog` (mọi nhãn truyền vào);
  bản `reuseable/PostEngagementBar/ConfirmDialog` giờ là wrapper mỏng điền nhãn `communityHub` cho ~12
  call site cũ.
- **Bẫy đã vá khi làm**: `runRest(...)` trả `null` CẢ khi thành công với endpoint void (envelope
  `data: null`) → mọi chỗ cần biết "thành công chưa" phải trả sentinel (`return true`) trong action.
