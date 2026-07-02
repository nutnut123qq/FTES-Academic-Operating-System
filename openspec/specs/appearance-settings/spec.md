# appearance-settings Specification

## Purpose
TBD - created by archiving change appearance-settings. Update Purpose after archive.
## Requirements
### Requirement: Nút "Giao diện" trong navbar mở Appearance settings modal

Hệ thống SHALL thay thế nút gạt dark/light hiện tại trong navbar thật (`features/navbar`) — ở cả hàng inline desktop lẫn hàng "Giao diện" trong mobile drawer — bằng một nút cài đặt giao diện (icon palette, `aria-label` có tên). Nút SHALL mở Appearance settings modal dưới dạng HeroUI Modal global, mount tại `ModalContainer`, điều khiển bằng overlay key `appearance`. Nút MUST hiển thị và hoạt động cho cả người đã đăng nhập lẫn khách (navbar không phân biệt auth). Trên mobile, drawer chứa nút MUST đóng trước khi modal mở (không chồng overlay).

#### Scenario: Người dùng đăng nhập mở modal từ navbar desktop

- **GIVEN** người dùng đã đăng nhập, viewport desktop
- **WHEN** người dùng bấm nút "Giao diện" cạnh nút đổi ngôn ngữ trên navbar
- **THEN** Appearance settings modal mở giữa màn hình với 3 nhóm: Chế độ, Màu chủ đạo, Hiệu ứng nền

#### Scenario: Khách mở modal từ mobile drawer

- **GIVEN** khách chưa đăng nhập, viewport mobile, drawer điều hướng đang mở
- **WHEN** khách bấm nút "Giao diện" trong drawer
- **THEN** drawer đóng lại rồi Appearance settings modal mở, đầy đủ chức năng như người đăng nhập

#### Scenario: Nút gạt dark/light cũ không còn

- **WHEN** người dùng quan sát navbar (desktop và mobile drawer) sau thay đổi
- **THEN** không còn Switch sun/moon nào; vị trí cũ là nút icon mở modal, và component `DarkLightModeSwitch` của cây navbar live không còn được import

### Requirement: Chọn chế độ sáng / tối / hệ thống

Modal SHALL có nhóm "Chế độ" dạng segmented radiogroup với 3 lựa chọn: Sáng, Tối, Hệ thống — đọc/ghi qua next-themes (`setTheme("light"|"dark"|"system")`), giữ nguyên cơ chế persist + chống flash sẵn có của next-themes. Chọn SHALL áp ngay lập tức (live), không cần nút lưu.

#### Scenario: Đổi sang chế độ tối

- **GIVEN** app đang ở chế độ sáng
- **WHEN** người dùng chọn "Tối" trong modal
- **THEN** toàn app chuyển dark ngay lập tức khi modal vẫn mở, và lựa chọn giữ nguyên sau khi reload

#### Scenario: Chọn theo hệ thống

- **GIVEN** hệ điều hành đang đặt dark
- **WHEN** người dùng chọn "Hệ thống"
- **THEN** app hiển thị dark và tự đổi theo khi cài đặt hệ điều hành đổi

### Requirement: Chọn màu chủ đạo bằng lưới swatch preset

Modal SHALL có nhóm "Màu chủ đạo" là lưới 6 swatch preset curated. Swatch ĐẦU TIÊN MUST là xanh `#3F51B5` và được đánh dấu là mặc định; một swatch MUST là màu hồng hiện tại (`oklch(70.03% 0.2092 354.13)`). Chọn swatch SHALL override token `--accent` (kèm `--accent-foreground` tương ứng) trên toàn app cho CẢ chế độ sáng lẫn tối, áp ngay lập tức. Mọi preset MUST đủ đậm để foreground trắng đạt contrast ≥ 4.5:1. Cơ chế áp SHALL là attribute `data-accent` trên `<html>` trỏ vào block CSS khai báo sẵn trong `globals.css` (không inline style động).

#### Scenario: Chọn màu và giữ sau reload

- **GIVEN** modal đang mở với accent mặc định xanh
- **WHEN** người dùng chọn swatch hồng, đóng modal, rồi reload trang
- **THEN** toàn app (nút primary, link, hiệu ứng nền) hiển thị accent hồng ngay từ frame đầu sau reload — không flash màu xanh trước đó

#### Scenario: Accent áp cho cả hai chế độ

- **GIVEN** người dùng đã chọn accent tím
- **WHEN** người dùng chuyển giữa chế độ sáng và tối
- **THEN** accent vẫn là tím ở cả hai chế độ, chữ trên nền accent vẫn đọc được

### Requirement: Điều khiển hiệu ứng nền trong modal

Modal SHALL có nhóm "Hiệu ứng nền" gồm: (a) toggle bật/tắt hiệu ứng ambient, (b) radiogroup 2 hướng — "Bay lên" (rise) và "Rơi xuống như sao băng" (fall). Khi toggle tắt, nhóm hướng MUST bị disabled (cả hiển thị lẫn aria). Mọi thay đổi SHALL áp ngay lập tức lên nền phía sau modal (live preview).

#### Scenario: Tắt hiệu ứng

- **GIVEN** hiệu ứng nền đang bật
- **WHEN** người dùng gạt tắt toggle "Hiệu ứng nền"
- **THEN** lớp AmbientBackground biến mất ngay lập tức (không render), và lựa chọn hướng bị disabled

#### Scenario: Đổi hướng rơi ↔ bay

- **GIVEN** hiệu ứng đang bật với hướng "Rơi xuống như sao băng"
- **WHEN** người dùng chọn "Bay lên"
- **THEN** nền chuyển sang đốm sáng tròn bay từ đáy lên (hành vi cũ) ngay khi modal còn mở

### Requirement: Persist cấu hình giao diện qua localStorage, hydration-safe

Cấu hình giao diện (accent, hiệu ứng bật/tắt, hướng) SHALL lưu trong một zustand store có `persist` middleware xuống localStorage (key `ftesaos-appearance`). Accent MUST được áp trước first paint bằng script inline trong root layout đọc localStorage và set `data-accent` trên `<html>` (bọc try/catch — hỏng/thiếu localStorage thì rơi về mặc định). Cấu hình hiệu ứng SHALL áp sau khi store hydrate (chấp nhận được vì spark khởi đầu opacity 0 và chỉ hiện dần sau ~1 giây — không flash cảm nhận được). Server markup và client markup MUST khớp (không hydration mismatch).

#### Scenario: Mặc định lần đầu ghé thăm

- **GIVEN** trình duyệt chưa từng có localStorage của app
- **WHEN** người dùng mở trang lần đầu
- **THEN** accent là xanh #3F51B5 và hiệu ứng nền bật với hướng rơi xuống như sao băng

#### Scenario: Cấu hình sống sót qua reload

- **GIVEN** người dùng đã đặt accent hổ phách, hiệu ứng tắt
- **WHEN** người dùng reload hoặc mở tab mới cùng origin
- **THEN** accent hổ phách áp từ trước paint và hiệu ứng nền không xuất hiện

#### Scenario: localStorage hỏng không phá app

- **GIVEN** giá trị `ftesaos-appearance` trong localStorage là chuỗi rác không parse được
- **WHEN** trang tải
- **THEN** app render bình thường với mặc định (xanh + rơi), không lỗi runtime

### Requirement: i18n cụm khoá appearance.* (vi + en)

Mọi chữ trong modal và aria-label của nút SHALL lấy từ cụm khoá `appearance.*` với bản dịch đủ ở `vi.json` và `en.json`: tiêu đề, nhãn 3 nhóm, 3 chế độ, tên từng màu preset, nhãn "(mặc định)", nhãn toggle, hai hướng ("Bay lên" / "Rơi xuống như sao băng").

#### Scenario: Chuyển ngôn ngữ

- **GIVEN** modal đang mở bằng tiếng Việt
- **WHEN** người dùng chuyển locale sang English và mở lại modal
- **THEN** toàn bộ nhãn (tiêu đề, chế độ, tên màu, hướng hiệu ứng) hiển thị tiếng Anh, không key thô nào lộ ra

### Requirement: A11y của modal giao diện

Nhóm chế độ và nhóm hướng hiệu ứng SHALL là radiogroup có label; lưới swatch màu SHALL là `role="radiogroup"` với từng swatch `role="radio"`, `aria-checked` đúng và tên màu đọc được (aria-label = tên i18n, không chỉ là màu). Swatch đang chọn MUST có chỉ báo không-phụ-thuộc-màu (ring + icon check). Nút mở modal MUST có `aria-label`. Điều hướng bàn phím trong radiogroup SHALL hoạt động (mũi tên đổi lựa chọn, focus visible).

#### Scenario: Screen reader đọc swatch màu

- **WHEN** người dùng screen reader focus vào lưới màu chủ đạo
- **THEN** nghe được tên nhóm, tên từng màu (ví dụ "Xanh indigo — mặc định"), và trạng thái chọn/không chọn của từng swatch

#### Scenario: Chọn màu bằng bàn phím

- **GIVEN** focus đang ở swatch được chọn
- **WHEN** người dùng bấm phím mũi tên phải rồi Space/Enter
- **THEN** swatch kế được chọn, accent đổi theo, focus ring nhìn thấy rõ

