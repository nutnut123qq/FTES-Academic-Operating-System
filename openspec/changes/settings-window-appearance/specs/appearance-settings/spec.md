# appearance-settings (delta)

> **Phạm vi delta này đã bị THU HẸP có chủ đích (2026-08-15).**
> Change này chỉ còn giữ phần **de-modal hoá**: gỡ nút navbar + modal, và đổi cách nói "modal" →
> "trang Cài đặt" ở những requirement mà KHÔNG change nào khác đụng tới.
> Hai requirement **"Chọn màu chủ đạo bằng lưới swatch preset"** và **"Điều khiển hiệu ứng nền
> trong modal"** đã bị **GỠ KHỎI delta này** và thuộc về change `settings-shell-appearance-privacy`
> (accent picker tự do + radiogroup 10 hiệu ứng). Lý do: bản viết ở đây mô tả lưới 6 swatch và một
> **công tắc boolean bật/tắt hiệu ứng** — thứ đã CHẾT trong code. Nếu để nguyên, archive change này
> SAU change kia sẽ ghi đè bản mới bằng bản cũ đã chết.
> **Đừng thêm lại hai requirement đó vào file này.**

## REMOVED Requirements

### Requirement: Nút "Giao diện" trong navbar mở Appearance settings modal

**Reason**: Sếp chốt gỡ icon palette đứng trần khỏi navbar; cài đặt giao diện thuộc về cửa sổ Cài đặt, không phải một nút riêng trên thanh điều hướng. Modal `AppearanceModal` và overlay key `appearance` bị xoá cùng lúc.

**Migration**: Điểm vào duy nhất là menu tài khoản → "Cài đặt" → khu Cài đặt tài khoản (`/profile/settings`), mục Giao diện. Khung điều hướng của khu này được mô tả ở capability `profile-settings-navigation` (change `settings-shell-appearance-privacy`) và `settings-security` (change `settings-shell-and-security`). Mọi lựa chọn đã lưu trong `ftesaos-appearance` giữ nguyên, người dùng không mất cấu hình.

## RENAMED Requirements

- FROM: `### Requirement: A11y của modal giao diện`
- TO: `### Requirement: A11y của mục Giao diện`

## MODIFIED Requirements

### Requirement: Chọn chế độ sáng / tối / hệ thống

Mục Giao diện trong khu Cài đặt SHALL có nhóm "Chế độ" dạng segmented radiogroup với 3 lựa chọn: Sáng, Tối, Hệ thống — đọc/ghi qua next-themes (`setTheme("light"|"dark"|"system")`), giữ nguyên cơ chế persist + chống flash sẵn có của next-themes. Chọn SHALL áp ngay lập tức (live), không cần nút lưu.

#### Scenario: Đổi sang chế độ tối

- **GIVEN** app đang ở chế độ sáng, người dùng đang ở `/profile/settings`
- **WHEN** người dùng chọn "Tối"
- **THEN** toàn app chuyển dark ngay lập tức khi vẫn đang ở trang, và lựa chọn giữ nguyên sau khi reload

#### Scenario: Chọn theo hệ thống

- **GIVEN** hệ điều hành đang đặt dark
- **WHEN** người dùng chọn "Hệ thống"
- **THEN** app hiển thị dark và tự đổi theo khi cài đặt hệ điều hành đổi

### Requirement: i18n cụm khoá appearance.* (vi + en)

Mọi chữ trong mục Giao diện SHALL lấy từ cụm khoá `appearance.*` với bản dịch đủ ở `vi.json` và `en.json`: tiêu đề mục, nhãn từng nhóm điều khiển và nhãn từng lựa chọn trong nhóm (chế độ, tên màu preset, nhãn "(mặc định)", các lựa chọn hiệu ứng nền). Khoá `appearance.*` nào chỉ phục vụ nút navbar / modal đã gỡ MUST được xoá khỏi cả hai file (không để khoá mồ côi).

#### Scenario: Chuyển ngôn ngữ

- **GIVEN** mục Giao diện đang hiển thị bằng tiếng Việt
- **WHEN** người dùng chuyển locale sang English
- **THEN** toàn bộ nhãn (tiêu đề mục, chế độ, tên màu, lựa chọn hiệu ứng) hiển thị tiếng Anh, không key thô nào lộ ra

### Requirement: A11y của mục Giao diện

Các nhóm lựa chọn của mục Giao diện SHALL là radiogroup có label; lưới swatch màu SHALL là `role="radiogroup"` với từng swatch `role="radio"`, `aria-checked` đúng và tên màu đọc được (aria-label = tên i18n, không chỉ là màu). Swatch đang chọn MUST có chỉ báo không-phụ-thuộc-màu (ring + icon check). Mỗi nhóm MUST có heading đọc được trong cấu trúc trang. Điều hướng bàn phím trong radiogroup SHALL hoạt động (mũi tên đổi lựa chọn, focus visible). Requirement này KHÔNG còn nói tới `aria-label` của nút mở modal — nút đó đã bị gỡ.

#### Scenario: Screen reader đọc swatch màu

- **WHEN** người dùng screen reader focus vào lưới màu chủ đạo
- **THEN** nghe được tên nhóm, tên từng màu (ví dụ "Xanh indigo — mặc định"), và trạng thái chọn/không chọn của từng swatch

#### Scenario: Chọn màu bằng bàn phím

- **GIVEN** focus đang ở swatch được chọn
- **WHEN** người dùng bấm phím mũi tên phải rồi Space/Enter
- **THEN** swatch kế được chọn, accent đổi theo, focus ring nhìn thấy rõ
