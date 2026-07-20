## REMOVED Requirements

### Requirement: Nút "Giao diện" trong navbar mở Appearance settings modal

**Reason**: Sếp chốt gỡ icon palette đứng trần khỏi navbar; cài đặt giao diện thuộc về cửa sổ Cài đặt, không phải một nút riêng trên thanh điều hướng. Modal `AppearanceModal` và overlay key `appearance` bị xoá cùng lúc.

**Migration**: Điểm vào duy nhất là menu tài khoản → "Cài đặt" → trang `/profile/settings`, mục Giao diện (xem capability `profile-settings-page`). Mọi lựa chọn đã lưu trong `ftesaos-appearance` giữ nguyên, người dùng không mất cấu hình.

## MODIFIED Requirements

### Requirement: Chọn chế độ sáng / tối / hệ thống

Mục Giao diện trong trang Cài đặt SHALL có nhóm "Chế độ" dạng segmented radiogroup với 3 lựa chọn: Sáng, Tối, Hệ thống — đọc/ghi qua next-themes (`setTheme("light"|"dark"|"system")`), giữ nguyên cơ chế persist + chống flash sẵn có của next-themes. Chọn SHALL áp ngay lập tức (live), không cần nút lưu.

#### Scenario: Đổi sang chế độ tối

- **GIVEN** app đang ở chế độ sáng, người dùng đang ở `/profile/settings`
- **WHEN** người dùng chọn "Tối"
- **THEN** toàn app chuyển dark ngay lập tức khi vẫn đang ở trang, và lựa chọn giữ nguyên sau khi reload

#### Scenario: Chọn theo hệ thống

- **GIVEN** hệ điều hành đang đặt dark
- **WHEN** người dùng chọn "Hệ thống"
- **THEN** app hiển thị dark và tự đổi theo khi cài đặt hệ điều hành đổi

### Requirement: Chọn màu chủ đạo bằng lưới swatch preset

Mục Giao diện SHALL có nhóm "Màu chủ đạo" là lưới 6 swatch preset curated. Swatch ĐẦU TIÊN MUST là xanh `#3F51B5` và được đánh dấu là mặc định; một swatch MUST là màu hồng hiện tại (`oklch(70.03% 0.2092 354.13)`). Chọn swatch SHALL override token `--accent` (kèm `--accent-foreground` tương ứng) trên toàn app cho CẢ chế độ sáng lẫn tối, áp ngay lập tức. Mọi preset MUST đủ đậm để foreground trắng đạt contrast ≥ 4.5:1. Cơ chế áp SHALL là attribute `data-accent` trên `<html>` trỏ vào block CSS khai báo sẵn trong `globals.css` (không inline style động).

#### Scenario: Chọn màu và giữ sau reload

- **GIVEN** trang Cài đặt đang mở với accent mặc định xanh
- **WHEN** người dùng chọn swatch hồng, rời trang, rồi reload
- **THEN** toàn app (nút primary, link, hiệu ứng nền) hiển thị accent hồng ngay từ frame đầu sau reload — không flash màu xanh trước đó

#### Scenario: Accent áp cho cả hai chế độ

- **GIVEN** người dùng đã chọn accent tím
- **WHEN** người dùng chuyển giữa chế độ sáng và tối
- **THEN** accent vẫn là tím ở cả hai chế độ, chữ trên nền accent vẫn đọc được

### Requirement: Điều khiển hiệu ứng nền trong mục Giao diện

Mục Giao diện SHALL có nhóm "Hiệu ứng nền" gồm: (a) toggle bật/tắt hiệu ứng ambient, (b) radiogroup 2 hướng — "Bay lên" (rise) và "Rơi xuống như sao băng" (fall). Khi toggle tắt, nhóm hướng MUST bị disabled (cả hiển thị lẫn aria). Mọi thay đổi SHALL áp ngay lập tức lên nền của chính trang Cài đặt (live preview).

#### Scenario: Tắt hiệu ứng

- **GIVEN** hiệu ứng nền đang bật
- **WHEN** người dùng gạt tắt toggle "Hiệu ứng nền"
- **THEN** lớp AmbientBackground biến mất ngay lập tức (không render), và lựa chọn hướng bị disabled

#### Scenario: Đổi hướng rơi ↔ bay

- **GIVEN** hiệu ứng đang bật với hướng "Rơi xuống như sao băng"
- **WHEN** người dùng chọn "Bay lên"
- **THEN** nền chuyển sang đốm sáng tròn bay từ đáy lên (hành vi cũ) ngay khi vẫn ở trang Cài đặt

### Requirement: i18n cụm khoá appearance.* (vi + en)

Mọi chữ trong mục Giao diện SHALL lấy từ cụm khoá `appearance.*` với bản dịch đủ ở `vi.json` và `en.json`: tiêu đề mục, nhãn 3 nhóm, 3 chế độ, tên từng màu preset, nhãn "(mặc định)", nhãn toggle, hai hướng ("Bay lên" / "Rơi xuống như sao băng"). Khoá `appearance.*` nào chỉ phục vụ nút navbar / modal đã gỡ MUST được xoá khỏi cả hai file (không để khoá mồ côi).

#### Scenario: Chuyển ngôn ngữ

- **GIVEN** trang Cài đặt đang hiển thị bằng tiếng Việt
- **WHEN** người dùng chuyển locale sang English
- **THEN** toàn bộ nhãn (tiêu đề mục, chế độ, tên màu, hướng hiệu ứng) hiển thị tiếng Anh, không key thô nào lộ ra

### Requirement: A11y của mục Giao diện

Nhóm chế độ và nhóm hướng hiệu ứng SHALL là radiogroup có label; lưới swatch màu SHALL là `role="radiogroup"` với từng swatch `role="radio"`, `aria-checked` đúng và tên màu đọc được (aria-label = tên i18n, không chỉ là màu). Swatch đang chọn MUST có chỉ báo không-phụ-thuộc-màu (ring + icon check). Mỗi nhóm MUST có heading đọc được trong cấu trúc trang. Điều hướng bàn phím trong radiogroup SHALL hoạt động (mũi tên đổi lựa chọn, focus visible).

#### Scenario: Screen reader đọc swatch màu

- **WHEN** người dùng screen reader focus vào lưới màu chủ đạo
- **THEN** nghe được tên nhóm, tên từng màu (ví dụ "Xanh indigo — mặc định"), và trạng thái chọn/không chọn của từng swatch

#### Scenario: Chọn màu bằng bàn phím

- **GIVEN** focus đang ở swatch được chọn
- **WHEN** người dùng bấm phím mũi tên phải rồi Space/Enter
- **THEN** swatch kế được chọn, accent đổi theo, focus ring nhìn thấy rõ
