# appearance-settings (delta)

## MODIFIED Requirements

### Requirement: Chọn màu chủ đạo bằng lưới swatch preset

Cài đặt giao diện SHALL có nhóm "Màu chủ đạo" gồm **lưới 6 swatch preset curated** và **một color
picker tự do** kèm nút Reset. Swatch ĐẦU TIÊN MUST là xanh `#3F51B5` và được đánh dấu là mặc định;
một swatch MUST là màu hồng hiện tại. Mọi preset MUST đủ đậm để foreground trắng đạt contrast ≥ 4.5:1.

Cơ chế áp:
- **Preset** SHALL áp bằng attribute `data-accent` trên `<html>` trỏ vào block CSS khai báo sẵn
  trong `globals.css` (không inline style động).
- **Màu tự do** SHALL áp bằng cặp inline `--accent` / `--accent-foreground` trên `<html>`, vốn
  outrank block `[data-accent]`. `--accent-foreground` SHALL được chọn theo ngưỡng độ sáng cảm nhận
  (YIQ) để chữ trên nền accent vẫn đọc được với mọi màu người dùng chọn.
- Chọn một preset SHALL **xoá màu tự do đang có**, vì hai thứ loại trừ nhau: nếu không, inline
  override sẽ âm thầm nuốt preset vừa chọn.
- Công thức YIQ trong `accentForeground()` MUST giữ đồng bộ với script pre-paint trong
  `[locale]/layout.tsx` (script đó bắt buộc là chuỗi thô vì chạy trước khi module load).

Kéo trong color picker SHALL cập nhật biến CSS NGAY (xem trước live); chỉ thao tác **ghi store /
localStorage** mới được debounce, để việc kéo không serialize store theo từng lần di chuột.

#### Scenario: Chọn màu và giữ sau reload

- **GIVEN** đang ở accent mặc định xanh
- **WHEN** người dùng chọn swatch hồng rồi reload trang
- **THEN** toàn app hiển thị accent hồng ngay từ frame đầu sau reload — không flash màu xanh

#### Scenario: Đặt màu tự do rồi quay lại preset

- **GIVEN** người dùng đã đặt một màu tự do bằng picker
- **WHEN** người dùng bấm một swatch preset
- **THEN** inline `--accent` bị gỡ và app hiển thị đúng preset vừa chọn (không bị màu tự do nuốt)

#### Scenario: Reset

- **WHEN** người dùng bấm Reset
- **THEN** accent trở về preset mặc định và không còn màu tự do nào được áp

#### Scenario: Accent áp cho cả hai chế độ

- **GIVEN** người dùng đã chọn accent tím
- **WHEN** người dùng chuyển giữa chế độ sáng và tối
- **THEN** accent vẫn là tím ở cả hai chế độ, chữ trên nền accent vẫn đọc được

### Requirement: Điều khiển hiệu ứng nền trong modal

Cài đặt giao diện SHALL có nhóm "Hiệu ứng nền" là **một radiogroup gồm 10 lựa chọn**: `none` (tắt),
`ember` (trường đốm sáng của app), `wave`, `snow`, `rain`, `bubbles`, `fireflies`, `stars`, `aurora`,
`circuit`. KHÔNG còn công tắc boolean bật/tắt — `none` chính là trạng thái tắt.

Mỗi ô SHALL xem trước hiệu ứng THẬT, tô theo accent đang chọn, với số hạt giới hạn cho ô xem trước
(một trang có 10 preview chạy cùng lúc).

Hai radiogroup **hướng** ("Bay lên" rise / "Rơi xuống như sao băng" fall) và **tốc độ**
("Chậm"/"Vừa"/"Nhanh") SHALL chỉ hiển thị khi hiệu ứng đang chọn là `ember` — chỉ hiệu ứng đó đọc
hai giá trị này; hiển thị chúng cho hiệu ứng khác là điều khiển không có tác dụng.

Mọi thay đổi SHALL áp ngay lập tức lên nền của trang (live preview). Reduced-motion vẫn thắng ở
tầng CSS.

#### Scenario: Tắt hiệu ứng

- **GIVEN** một hiệu ứng đang bật
- **WHEN** người dùng chọn ô "Tắt" (`none`)
- **THEN** lớp nền ambient không render nữa, và hai nhóm hướng/tốc độ không hiển thị

#### Scenario: Đổi sang hiệu ứng khác ember

- **WHEN** người dùng chọn `aurora`
- **THEN** nền đổi sang aurora ngay lập tức, tô theo accent hiện tại, và hai nhóm hướng/tốc độ ẩn đi

#### Scenario: Đổi hướng rơi ↔ bay

- **GIVEN** hiệu ứng đang là `ember` với hướng "Rơi xuống như sao băng"
- **WHEN** người dùng chọn "Bay lên"
- **THEN** nền chuyển sang đốm sáng bay từ đáy lên ngay lập tức

### Requirement: Persist cấu hình giao diện qua localStorage, hydration-safe

Cấu hình giao diện SHALL lưu trong một zustand store có `persist` middleware xuống localStorage (key
`ftesaos-appearance`). Hình dạng đã lưu gồm: **preset accent**, **màu accent tự do** (`null` khi đang
dùng preset), **tên hiệu ứng nền** (`none` = tắt), **hướng** và **tốc độ** của hiệu ứng đốm sáng.
KHÔNG còn cờ boolean bật/tắt hiệu ứng — trạng thái tắt là tên hiệu ứng `none`.

Accent MUST được áp trước first paint bằng script inline trong root layout đọc localStorage rồi set
`data-accent` (preset) hoặc cặp inline `--accent` / `--accent-foreground` (màu tự do) trên `<html>`
— bọc try/catch, hỏng/thiếu localStorage thì rơi về mặc định. Cấu hình hiệu ứng SHALL áp sau khi
store hydrate. Server markup và client markup MUST khớp (không hydration mismatch).

#### Scenario: Mặc định lần đầu ghé thăm

- **GIVEN** trình duyệt chưa từng có localStorage của app
- **WHEN** người dùng mở trang lần đầu
- **THEN** accent là preset xanh `#3F51B5`, không có màu tự do, và hiệu ứng nền là đốm sáng `ember`
  hướng rơi xuống

#### Scenario: Cấu hình sống sót qua reload

- **GIVEN** người dùng đã đặt một màu tự do và chọn hiệu ứng `none`
- **WHEN** người dùng reload hoặc mở tab mới cùng origin
- **THEN** màu tự do áp từ trước paint và không lớp nền ambient nào render

#### Scenario: localStorage hỏng không phá app

- **GIVEN** giá trị `ftesaos-appearance` trong localStorage là chuỗi rác không parse được
- **WHEN** trang tải
- **THEN** app render bình thường với mặc định, không lỗi runtime

## ADDED Requirements

### Requirement: Cấu hình giao diện đã lưu được migrate khi đổi hình dạng

Store `appearance` persist SHALL khai báo `version` và một hàm `migrate`. Bản v1 lưu hiệu ứng dưới
dạng công tắc boolean `effectEnabled` trên một trường đốm sáng duy nhất; v2 lưu **tên** hiệu ứng.
Migrate SHALL map `effectEnabled === false` → `"none"` và mọi trường hợp còn lại → hiệu ứng mặc
định, để không ai bị mất nền một cách âm thầm sau khi deploy.

Khi rehydrate, store SHALL loại bỏ giá trị mà bản build hiện tại không render được (tên hiệu ứng lạ,
chuỗi màu không phải hex hợp lệ) trước khi đưa vào state, rồi mới áp lên `<html>`.

#### Scenario: Người dùng đã tắt hiệu ứng ở bản cũ

- **GIVEN** localStorage còn state v1 với `effectEnabled: false`
- **WHEN** người dùng mở bản mới
- **THEN** hiệu ứng là `none` (vẫn tắt), không phải hiệu ứng mặc định bật lên

#### Scenario: Giá trị rác trong localStorage

- **WHEN** state đã lưu chứa tên hiệu ứng không tồn tại hoặc chuỗi màu hỏng
- **THEN** giá trị đó bị bỏ và store dùng mặc định tương ứng, không ném lỗi và không áp style rác
