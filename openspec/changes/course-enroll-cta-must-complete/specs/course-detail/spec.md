# course-detail

## ADDED Requirements

### Requirement: Nút đăng ký ở trang chi tiết chỉ bấm được khi mua được thật

Nút đăng ký trên thẻ mua của trang chi tiết khoá SHALL chỉ ở trạng thái bấm được khi hệ thống đã
resolve được sản phẩm `COURSE_UNLOCK` của khoá. Khi không resolve được, nút SHALL bị vô hiệu hoá và
mang nhãn trạng thái "chưa mở bán" kèm một dòng giải thích, thay vì nhãn đăng ký bình thường.

Hành động đăng ký SHALL không bao giờ điều hướng về chính trang đang hiển thị: khi không có sản phẩm,
nó SHALL không làm gì cả (nút đã vô hiệu hoá), chứ không giả vờ điều hướng.

Lối "Học thử miễn phí" SHALL giữ nguyên trong mọi trạng thái trên — khoá chưa mở bán vẫn học thử được.

#### Scenario: Khoá không có sản phẩm để bán
- **WHEN** trang chi tiết mở một khoá mà endpoint sản phẩm trả về rỗng
- **THEN** nút đăng ký bị vô hiệu hoá và hiển thị nhãn "chưa mở bán"
- **AND** không có điều hướng nào xảy ra khi tương tác với nút

#### Scenario: Khoá bán được
- **WHEN** sản phẩm `COURSE_UNLOCK` của khoá resolve thành công
- **THEN** nút đăng ký bấm được với nhãn đăng ký như cũ
- **AND** bấm nút chạy luồng thêm giỏ rồi mở PaymentModal

#### Scenario: Đang resolve sản phẩm
- **WHEN** yêu cầu resolve sản phẩm còn đang chạy
- **THEN** nút chưa bị gán nhãn "chưa mở bán" (không kết luận sớm khi chưa có câu trả lời)

### Requirement: Khoá bán theo gói mà danh sách gói rỗng vẫn phải mua được

Thẻ mua của khoá bán theo gói SHALL cung cấp lựa chọn mua trọn khoá khi danh sách gói của khoá rỗng,
bằng cách tái dùng đúng thẻ mua trọn khoá mà cổng thanh toán trong trang học đang dùng — resolve sản
phẩm `COURSE_UNLOCK` cấp khoá rồi chạy luồng thêm giỏ rồi mở PaymentModal (gói giá 0 đi thẳng
checkout). Trang chi tiết SHALL KHÔNG tự viết một bản sao khác của luồng thanh toán đó.

Thông báo "đang cập nhật gói" SHALL chỉ còn hiển thị khi khoá vừa không có gói vừa không resolve được
sản phẩm nào.

#### Scenario: Khoá PACKAGE không có gói nhưng có sản phẩm khoá
- **WHEN** danh sách gói trả về rỗng và khoá có sản phẩm `COURSE_UNLOCK`
- **THEN** thẻ mua hiển thị lựa chọn mua trọn khoá kèm giá và một nút đăng ký bấm được
- **AND** bấm nút chạy luồng thanh toán thật, không dừng ở thông báo trống

#### Scenario: Khoá không có gói lẫn sản phẩm
- **WHEN** danh sách gói rỗng và không resolve được sản phẩm nào
- **THEN** thẻ mua hiển thị thông báo không có gói và không có nút mua

### Requirement: Lỗi tải danh sách gói phải báo là lỗi và cho thử lại

Khi yêu cầu tải danh sách gói THẤT BẠI, thẻ mua SHALL hiển thị thông báo lỗi tải dữ liệu kèm nút thử
lại chạy revalidate, và SHALL KHÔNG dùng câu chữ "đang cập nhật gói" — câu đó mô tả trạng thái dữ
liệu, trong khi đây là lỗi mạng hoặc lỗi xác thực.

#### Scenario: Yêu cầu tải gói thất bại
- **WHEN** endpoint danh sách gói trả lỗi
- **THEN** thẻ mua hiển thị thông báo lỗi tải kèm nút thử lại
- **AND** bấm thử lại phát lại yêu cầu tải gói
