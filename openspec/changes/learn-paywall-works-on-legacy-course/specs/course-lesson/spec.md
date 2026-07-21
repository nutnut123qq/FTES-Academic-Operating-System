# course-lesson

## ADDED Requirements

### Requirement: Tường phí trong bài học luôn có đường mua chạy được

Cổng thanh toán mở từ tường phí của một bài bị khoá SHALL luôn cung cấp ít nhất một lựa chọn mua thực
hiện được, kể cả khi khoá không bán theo gói. Khi khoá không có gói nào phù hợp, cổng SHALL resolve
sản phẩm `COURSE_UNLOCK` cấp khoá và chạy đúng luồng thanh toán mà nút đăng ký ở trang chi tiết khoá
dùng (thêm vào giỏ rồi mở PaymentModal). Thông báo "không có gói phù hợp" SHALL chỉ hiển thị khi khoá
cũng không có sản phẩm nào — tức là khoá thật sự không bán được.

Lỗi khi tải danh sách gói SHALL dẫn tới cùng nhánh mua trọn khoá đó, không dẫn tới thẻ báo lỗi không
có hành động.

Hành vi của khoá bán theo gói SHALL không đổi: vẫn liệt kê các gói mở khoá bài hiện tại, sắp rẻ trước.

#### Scenario: Khoá LEGACY không có gói
- **WHEN** người học mở tường phí của một bài thuộc khoá không có gói nào, và khoá có sản phẩm `COURSE_UNLOCK` giá 399.000₫
- **THEN** cổng hiển thị lựa chọn mua trọn khoá kèm giá đó và một nút đăng ký bấm được
- **AND** bấm nút chạy luồng thêm giỏ rồi mở PaymentModal, KHÔNG dừng ở thông báo trống

#### Scenario: Khoá không bán
- **WHEN** khoá vừa không có gói vừa không resolve được sản phẩm nào
- **THEN** cổng hiển thị thông báo không có gói phù hợp và không có nút mua

#### Scenario: Khoá bán theo gói giữ nguyên
- **WHEN** người học mở tường phí của một bài thuộc khoá có gói
- **THEN** cổng liệt kê đúng các gói mở khoá bài đó như trước, không hiện lựa chọn mua trọn khoá

### Requirement: Lớp mờ teaser chỉ vẽ khi có nội dung để mờ

Trang đọc bài SHALL chỉ vẽ lớp mờ chuyển tiếp ở đáy nội dung khi bài bị khoá **và** có nội dung teaser
để mờ dần — chữ markdown, HTML, hoặc danh sách link tài nguyên. Bài bị khoá mà nội dung teaser rỗng
SHALL hiển thị thẳng thẻ tường phí, KHÔNG vẽ lớp mờ.

Lý do: lớp mờ neo theo đáy khung nội dung với chiều cao cố định; khung rỗng cao 0px khiến nó trải
ngược lên trên và phủ tiêu đề bài — che một vùng chưa từng có nội dung.

#### Scenario: Bài khoá, teaser rỗng
- **WHEN** BE trả `bodyMd` rỗng cho một bài DOCUMENT đang bị khoá (nội dung nằm ở file đính kèm)
- **THEN** không có lớp mờ nào được vẽ
- **AND** tiêu đề và mô tả bài hiển thị rõ, không bị phủ

#### Scenario: Bài khoá, có teaser
- **WHEN** BE trả một đoạn teaser cho bài bị khoá
- **THEN** lớp mờ được vẽ ở đáy đoạn teaser như trước

#### Scenario: Bài đã mở khoá
- **WHEN** người học có quyền đọc đầy đủ bài
- **THEN** không có lớp mờ nào được vẽ
