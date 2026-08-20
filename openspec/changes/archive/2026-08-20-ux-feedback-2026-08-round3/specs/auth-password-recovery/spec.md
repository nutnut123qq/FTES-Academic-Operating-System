# auth-password-recovery

## MODIFIED Requirements

### Requirement: Password recovery
A user SHALL request a password reset and set a new password via a verified channel.

Màn hình quên mật khẩu SHALL là **guest-only**: khi phiên đã ngã ngũ là ĐANG ĐĂNG NHẬP, trang
SHALL chuyển hướng khỏi đó thay vì giữ nguyên thân trang cũ. Chốt này SHALL chỉ hành động một
chiều — khi cờ đăng nhập là `true`. Cờ `false` SHALL KHÔNG bị coi là "khách": redux của app
không persist nên `false` là *"chưa biết"* ở mọi lần tải trang, đọc nó là đá nhầm chính người
đang hydrate.

Chốt guest-only SHALL KHÔNG được áp cho các route xác thực còn lại: `two-factor` cần access
token để bật 2FA, `verify-otp` phục vụ cả `purpose=LOGIN` lẫn `purpose=VERIFY_PHONE`,
`reset-password` do token trong email cầm quyền, và các route callback/logout OAuth cần phiên
để chạy. Chặn chúng là giết tính năng, không phải bảo vệ.

Đường quay lại từ màn hình quên mật khẩu SHALL mở màn ĐĂNG NHẬP, không phải trang chủ.

#### Scenario: Request reset
- **WHEN** a user submits a known email with captcha passed
- **THEN** a reset instruction is dispatched and a neutral confirmation is shown (no account enumeration)

#### Scenario: Set new password
- **WHEN** a user with a valid reset token submits matching new passwords
- **THEN** the password is updated and they can sign in

#### Scenario: Đăng nhập trong lúc đang đứng ở màn hình quên mật khẩu
- **GIVEN** người dùng đã gửi link đặt lại và đang thấy card xác nhận "check your inbox"
- **WHEN** họ đăng nhập bằng một tài khoản khác ngay trên trang đó
- **THEN** trang rời khỏi màn hình quên mật khẩu, card xác nhận biến mất — không còn cảnh thanh
  điều hướng đã là trạng thái đã-đăng-nhập trong khi thân trang vẫn là màn hình khách

#### Scenario: Khách vào thẳng màn hình quên mật khẩu
- **WHEN** một người chưa đăng nhập mở `/authentication/forgot-password`
- **THEN** form hiện bình thường, không chuyển hướng đi đâu

#### Scenario: Cửa sổ hydration không bị đá nhầm
- **GIVEN** một người ĐANG đăng nhập vừa tải lại trang quên mật khẩu, cờ phiên còn `false` vì
  chưa hydrate xong
- **WHEN** cờ chuyển `false → true`
- **THEN** chuyển hướng xảy ra đúng một lần tại thời điểm đó — không có cú chuyển hướng nào bị
  bắn ra trong lúc cờ còn `false`

#### Scenario: Quay lại màn đăng nhập
- **WHEN** người dùng bấm "Back to sign in" trên màn hình quên mật khẩu
- **THEN** màn đăng nhập mở ra, không phải trang chủ trống
