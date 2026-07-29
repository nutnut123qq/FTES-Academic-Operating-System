# signup-username-field — Cho phép người dùng tự nhập `username` khi đăng ký (không bắt buộc)

## Why
Form đăng ký hiện chỉ thu `email` + `password` và KHÔNG bao giờ gửi `username`; backend tự suy
username từ phần local của email (`abc@gmail.com → abc`). Chủ dự án muốn người dùng có thể TỰ
CHỌN một username dễ đọc ngay khi đăng ký. Yêu cầu quan trọng: trường này **không bắt buộc** — bỏ
trống thì backend vẫn suy như cũ, nên không phá luồng đăng ký hiện tại. REST DTO
(`RegisterRequest.username?`) và backend đã sẵn sàng nhận field optional này (chỉ suy khi vắng mặt),
nên đây là thay đổi **FE-only**.

## What Changes
- **Component mới** `RegistrationState/UsernameField/` — mirror `EmailField/` (HeroUI
  `TextField` + `Label` + `Input` + `FieldError`), thêm dòng helper "Để trống sẽ tự tạo từ email".
- **Store** `hooks/zustand/signUp/store.ts` — thêm `username: ""` vào state + `initialState` +
  `touched`; thêm `"username"` vào union `SignUpField` và union field-name của `setValue`; bỏ comment
  gây hiểu nhầm "Email (also the username)".
- **Hook submit** `useSignUpForm.ts` — thêm `username` vào `values`/`errors`; **chỉ validate khi
  KHÁC RỖNG**: dài 3–64 ký tự khớp `^[a-zA-Z0-9._-]+$` (đồng bộ charset BE `[a-z0-9._-]`); rỗng =
  hợp lệ. Payload đổi thành gửi `username` (trim + lower-case) khi có, **bỏ hẳn khi rỗng** để BE suy.
- **Render** `RegistrationState/index.tsx` — chèn `<UsernameField>` sau Email, trước Password.
- **i18n** `messages/vi.json` + `messages/en.json` — thêm namespace `auth.signUp.username`
  (label / placeholder / helper / minLength / maxLength / invalid), mirror vi + en cùng thứ tự.

## Capabilities
### Modified Capabilities
- `auth-registration`: bước đăng ký chấp nhận thêm một `username` do người dùng tự nhập (không bắt
  buộc); bỏ trống thì backend tự suy từ email như trước.

## Impact
FE-only, ăn khớp REST DTO đã có (`RegisterRequest.username?`) — KHÔNG đổi type REST, KHÔNG API mới,
KHÔNG migration. Sửa 4 file nguồn (component mới + store + hook + render) và 2 file i18n. Luồng OTP/
verify giữ nguyên. `tsc --noEmit` sạch (EXIT 0), eslint sạch.
