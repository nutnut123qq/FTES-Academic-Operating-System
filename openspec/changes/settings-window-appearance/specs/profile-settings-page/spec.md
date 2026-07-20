## ADDED Requirements

### Requirement: Trang hub Cài đặt tại /profile/settings

Hệ thống SHALL có route `/[locale]/profile/settings` render trang hub Cài đặt, nằm trong `ProfileShell` như mọi trang profile khác (cùng khung identity + tabs, không tự dựng layout riêng). Mục "Cài đặt" trong menu tài khoản (`AccountMenuAuthed`, `GearIcon`, `pathConfig().locale().profile().settings()`) SHALL dẫn tới đúng trang này thay vì 404. Trang SHALL có tiêu đề `profileSettings.title` và mô tả `profileSettings.subtitle` (đã có sẵn trong i18n).

#### Scenario: Vào Cài đặt từ menu tài khoản

- **GIVEN** người dùng đã đăng nhập
- **WHEN** người dùng mở menu tài khoản và bấm "Cài đặt"
- **THEN** trình duyệt điều hướng tới `/vi/profile/settings` và trang Cài đặt render trong khung profile — không còn màn 404

#### Scenario: Truy cập trực tiếp bằng URL

- **WHEN** người dùng mở thẳng `/en/profile/settings`
- **THEN** trang Cài đặt render với tiêu đề tiếng Anh, không lỗi runtime

### Requirement: Trang Cài đặt chứa mục Giao diện

Trang hub SHALL chứa mục "Giao diện" gồm đúng 3 nhóm đã có: Chế độ, Màu chủ đạo, Hiệu ứng nền. Mục này SHALL tái dùng nguyên các component section hiện hữu (`ModeSection`, `AccentSection`, `EffectSection`) — KHÔNG viết lại logic theme/accent/effect và KHÔNG đổi store `ftesaos-appearance`. Các mục cài đặt khác trong `pathConfig` (security, sessions, ai-settings, membership, …) NẰM NGOÀI phạm vi và MUST NOT được render như link chết trên trang này.

#### Scenario: Đổi giao diện ngay trong trang

- **GIVEN** người dùng đang ở `/profile/settings`
- **WHEN** người dùng chọn chế độ Tối rồi chọn swatch accent khác
- **THEN** cả app đổi ngay lập tức trong lúc vẫn ở trang, và lựa chọn giữ nguyên sau reload

#### Scenario: Không có link chết

- **WHEN** người dùng quan sát trang Cài đặt
- **THEN** mọi mục hiển thị đều dẫn tới surface có thật; không có mục nào trỏ tới route chưa dựng
