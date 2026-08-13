# locked-login-appeal — Màn "tài khoản bị khoá" nói rõ lý do + gửi đơn xin mở lại

## Why

Đăng nhập vào tài khoản bị khoá hôm nay chỉ hiện **một dòng toast** rồi biến mất. Người dùng không
biết mình bị khoá **vì sao** (backend có ghi lý do, nhưng trước change `identity-device-ban-appeal`
nó không đi ra tới client), và không có chỗ nào để kêu — khoá thu hồi mọi phiên, nên mọi màn hình
sau đăng nhập đều đóng với họ.

## What Changes

- **Bước `Locked` trong luồng đăng nhập** (`SignInState.Locked`): hiện lý do khoá do backend soạn từ
  thiết bị có thật, thời điểm khoá, số lần đã vi phạm, và (với khoá AUTO) thời điểm tự mở.
- **Form xin mở khoá ngay tại đó**: gửi `POST /auth/appeals` kèm `identifier + password` đang có
  trong store — tài khoản bị khoá không còn phiên nào, mật khẩu là bằng chứng sở hữu duy nhất còn
  dùng được. Gửi xong hiện xác nhận; đã có đơn chờ thì báo và không cho gửi tiếp.
- **Đọc payload phòng thủ** (`readAccountLockedPayload`): backend chưa có change kia chỉ trả
  `unlockAt` ⇒ màn hình vẫn tử tế và **không** mời gửi đơn (nút sẽ 404).

## Capabilities

### New Capabilities
- `auth-account-lock`: hiển thị lý do khoá lúc đăng nhập + gửi đơn xin mở khoá không cần phiên.

## Impact
- `SignInState` thêm một bước; store sign-in giữ thêm `lockInfo` (setter riêng để không nới kiểu
  `setValue` của cả form).
- i18n `auth.signIn.locked.*` + `common.close` (vi/en).
- Cần backend `FunnyCodeEdu/FTES-AOS-Backend#120`.
