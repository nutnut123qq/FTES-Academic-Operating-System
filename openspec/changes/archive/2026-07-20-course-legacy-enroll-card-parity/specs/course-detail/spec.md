# course-detail

## ADDED Requirements

### Requirement: Card mua của khoá LEGACY chỉ hiển thị dữ liệu có thật

Card mua của khoá `saleMode = "LEGACY"` (hoặc thiếu `saleMode`) SHALL hiển thị đúng một lựa chọn trả phí đại diện cho việc mua trọn khoá, với giá bán, giá gạch (chỉ
khi giá gốc thực sự cao hơn giá bán) và % giảm suy ra từ hai giá đó. Card SHALL KHÔNG hiển thị bất kỳ
"gói"/"tier" nào mà BE không trả về — cụ thể là bỏ hai tier "Free"/"Premium" do FE dựng.

Lối vào "Học thử miễn phí" SHALL chỉ render khi khoá thật sự có bài học thử. Danh sách quyền lợi
SHALL chỉ gồm các mục có số liệu thật từ hợp đồng BE (số bài học, số bài học thử); các mục không có
nguồn dữ liệu SHALL bị bỏ khỏi card.

Card SHALL dùng cùng thành phần trình bày một lựa chọn mua với card của khoá `PACKAGE`, để hai loại
khoá có cùng bố cục, cách hiện giá, chip và nút.

Người học đã đăng ký SHALL vẫn thấy card thu về một nút "Tiếp tục học" như hiện tại.

#### Scenario: Khoá legacy trả phí có giảm giá
- **WHEN** một khoá LEGACY có giá gốc 800000 và giá bán 500000 được mở bởi người chưa đăng ký
- **THEN** card hiện một lựa chọn "Trọn khoá" giá 500000, giá gạch 800000 và chip giảm 38%
- **AND** không có tier "Free" hay "Premium" nào xuất hiện

#### Scenario: Khoá legacy không có bài học thử
- **WHEN** khoá LEGACY không có bài nào cho học thử
- **THEN** card không render nút "Học thử miễn phí"

#### Scenario: Không hứa thứ không có dữ liệu
- **WHEN** hợp đồng BE không trả số challenge của khoá
- **THEN** card không hiển thị dòng quyền lợi nào về challenge hay chứng chỉ

#### Scenario: Người đã đăng ký
- **WHEN** người học đã đăng ký khoá LEGACY mở trang
- **THEN** card chỉ hiện nút "Tiếp tục học" kèm dòng ghi chú như hiện tại
