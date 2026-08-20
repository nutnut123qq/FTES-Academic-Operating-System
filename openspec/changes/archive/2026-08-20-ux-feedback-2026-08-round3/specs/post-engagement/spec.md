# post-engagement

## ADDED Requirements

### Requirement: Đăng lại sinh ra một bài thật, mang theo bài gốc
Một lượt đăng lại (🔁) SHALL sinh ra một bài viết THẬT của người đăng lại, **kể cả khi họ không
viết lời bình nào**. Bài đó SHALL xuất hiện ở bảng tin và ở hồ sơ người đăng lại như mọi bài
khác. Một lượt đăng lại không để lại gì để tìm là một nút không làm gì cả.

Bài đăng lại SHALL nhúng bài gốc dưới dạng card lồng — tác giả, tiêu đề và một đoạn trích — ở
CẢ bảng tin LẪN trang chi tiết. Chỉ hiện lời bình mà mất bài gốc là bài rỗng nghĩa: người đọc
không biết đang bình về cái gì.

Đoạn trích trong card lồng SHALL đi qua đúng cùng một đường xử lý nội dung như thân bài ở hàng
gốc, để cùng một bài không thể in sạch ở chỗ này mà lộ cú pháp markdown thô ở chỗ kia.

Card lồng SHALL đặt NGOÀI vùng liên kết bao thẻ bài: nó chứa liên kết hồ sơ tác giả, mà liên
kết lồng trong liên kết là HTML không hợp lệ.

#### Scenario: Đăng lại không viết gì
- **WHEN** người dùng bấm 🔁, để trống ô bình luận và xác nhận
- **THEN** một bài của họ xuất hiện ở đầu bảng tin, bên trong có card lồng của bài gốc

#### Scenario: Đăng lại kèm lời bình
- **WHEN** người dùng bấm 🔁, gõ một lời bình và xác nhận
- **THEN** bài của họ hiện lời bình ở trên và card lồng của bài gốc ở dưới

#### Scenario: Bài gốc bị gỡ sau khi đã bị đăng lại
- **GIVEN** một bài đăng lại đang tồn tại
- **WHEN** bài gốc bị tác giả xoá hoặc bị kiểm duyệt gỡ
- **THEN** card lồng xuống trạng thái "không còn khả dụng" — không vỡ giao diện, và không hiện
  tiêu đề hay nội dung của bài đã gỡ

### Requirement: Ghi nhận chia sẻ không được sinh ra bài viết
Đường ghi nhận lượt chia sẻ SHALL KHÔNG tạo bài viết nào.

Đường đó phục vụ menu chia sẻ (sao chép liên kết, chia sẻ ra mạng xã hội, chia sẻ qua hệ thống).
Nó là phép đo, chạy ngầm và nuốt lỗi; không có xác nhận nào từ người dùng đứng sau nó.

Hai ý định này SHALL dùng hai giá trị khác nhau ở tầng hợp đồng, và tầng soạn thảo SHALL KHÔNG
gửi giá trị dành cho phép đo — kể cả khi lời bình trống.

#### Scenario: Sao chép liên kết không đẻ bài
- **WHEN** người dùng mở menu chia sẻ và chọn "Sao chép liên kết"
- **THEN** liên kết vào clipboard, lượt chia sẻ được ghi nhận, và KHÔNG có bài viết nào mới xuất
  hiện trên bảng tin

#### Scenario: Chia sẻ qua hệ thống không đẻ bài
- **GIVEN** trình duyệt có hỗ trợ chia sẻ hệ thống
- **WHEN** người dùng chọn "Chia sẻ qua…"
- **THEN** khay chia sẻ mở ra và KHÔNG có bài viết nào mới xuất hiện trên bảng tin
