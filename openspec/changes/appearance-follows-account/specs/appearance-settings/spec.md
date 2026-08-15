# appearance-settings (delta)

## ADDED Requirements

### Requirement: Lựa chọn giao diện đi theo tài khoản, localStorage là bộ đệm

Accent (preset id HOẶC hex tự do, lưu chung MỘT chuỗi) và hiệu ứng nền SHALL được lưu trên hồ sơ của
tài khoản và áp lại khi người dùng đăng nhập trên máy/trình duyệt khác. `localStorage` SHALL vẫn
được ghi như trước, vì đó là thứ script pre-paint đọc để không nháy màu ở lần tải sau.

Quy tắc hoà giải khi nạp viewer SHALL là **server thắng KHI CÓ giá trị, xét theo TỪNG FIELD**:

- khách (không có hồ sơ) → giữ nguyên giá trị local, không gọi gì lên server;
- field tài khoản chưa từng chọn (`null`) → giữ giá trị local;
- giá trị bản build hiện tại không render được (tên hiệu ứng lạ, chuỗi màu hỏng) → giữ giá trị local,
  **KHÔNG** snap về mặc định cứng;
- accent là preset id → xoá màu tự do đang có ở local (hai thứ loại trừ nhau);
- accent là hex → giữ preset id local ở dưới, vì tài khoản chỉ lưu một chuỗi accent còn preset là chỗ
  picker rơi về khi reset.

Việc áp giá trị từ server SHALL KHÔNG kích hoạt một lượt ghi ngược lên server, và SHALL chờ
localStorage rehydrate xong trước khi ghi (store dùng `skipHydration`, nếu không chờ thì giá trị từ
server sẽ bị bản rehydrate về sau đạp lại).

Ghi lên server SHALL được gộp/debounce (bấm thử 10 ô hiệu ứng là MỘT ý định, không phải 10 lần ghi),
SHALL no-op khi chưa đăng nhập, và lỗi SHALL bị nuốt — lựa chọn đã áp và đã lưu local, không đáng
bung lỗi lên giao diện.

Hướng và tốc độ của hiệu ứng đốm sáng SHALL vẫn là thiết lập theo MÁY, không đồng bộ theo tài khoản.

Giá trị gửi lên SHALL được server validate (preset id hoặc hex; tên hiệu ứng thuộc danh sách đã
biết) và từ chối phần còn lại — FE ghi thẳng chuỗi này vào `data-accent` / `--accent` trên `<html>`.

#### Scenario: Đăng nhập trên máy khác

- **GIVEN** tài khoản đã chọn accent hồng và hiệu ứng `aurora` ở máy A
- **WHEN** người dùng đăng nhập ở máy B chưa từng đặt gì
- **THEN** máy B áp accent hồng + `aurora`, và lần tải trang sau ở máy B không nháy màu mặc định

#### Scenario: Tài khoản chưa từng chọn

- **GIVEN** hồ sơ trả `null` cho cả hai field
- **WHEN** người dùng đăng nhập trên một máy đã có lựa chọn trong localStorage
- **THEN** lựa chọn của máy đó được giữ nguyên, không bị reset

#### Scenario: Không vọng ngược

- **WHEN** giá trị từ server được áp vào store
- **THEN** không có request ghi nào được phát đi với đúng giá trị vừa nhận

#### Scenario: Khách

- **WHEN** người chưa đăng nhập đổi accent
- **THEN** lựa chọn chỉ vào localStorage, không có request nào được gửi

#### Scenario: Server từ chối

- **WHEN** server từ chối giá trị gửi lên
- **THEN** giao diện vẫn giữ lựa chọn đã áp cục bộ và không hiện lỗi; hệ quả là máy khác sẽ không
  thấy lựa chọn đó
