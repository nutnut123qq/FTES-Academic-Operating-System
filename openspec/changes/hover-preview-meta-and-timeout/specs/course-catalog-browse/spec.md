# course-catalog-browse

## ADDED Requirements

### Requirement: Thẻ hover-preview hiện cấp độ MỘT lần và có một hàng chi tiết khoá bổ sung

Thẻ hover-preview khoá học SHALL hiển thị cấp độ (level) của khoá **đúng một lần**. Cấp độ SHALL nằm
trong dòng meta ngay dưới tiêu đề, **cùng một hàng** với số bài học theo dạng "{cấp độ} · {N} bài";
panel SHALL KHÔNG hiển thị thêm một chip cấp độ đứng riêng (cấp độ SHALL KHÔNG xuất hiện hai lần).

Panel SHALL hiển thị thêm **một hàng chi tiết khoá** trong vùng header được ghim (không thuộc vùng
danh sách "Khoá học này bao gồm" có thể cuộn). Khi card mang đánh giá và/hoặc số học viên, hàng này
SHALL hiện đánh giá (sao + điểm trung bình) và/hoặc số học viên; khi không có, hàng này SHALL hiện một
dòng mô tả ngắn (một dòng, cắt bớt) lấy từ dữ liệu chi tiết khoá đã tải; khi không có dữ liệu nào để
hiện, hàng này SHALL được bỏ qua. Hàng chi tiết SHALL chỉ dùng dữ liệu khoá sẵn có (không phát sinh
lời gọi backend mới) và SHALL nằm trong phạm vi chiều cao card cùng với header (giữ nguyên giới hạn
chiều cao panel = chiều cao card).

#### Scenario: Cấp độ chỉ hiện một lần, cạnh số bài học
- **WHEN** người xem rê chuột mở thẻ hover-preview của một khoá
- **THEN** cấp độ khoá chỉ xuất hiện một lần, trong dòng meta cùng hàng với số bài học ("{cấp độ} · {N} bài")
- **AND** panel không hiển thị một chip cấp độ đứng riêng bên trên dòng meta

#### Scenario: Card có đánh giá và số học viên
- **WHEN** người xem mở thẻ hover-preview của một khoá có đánh giá và số học viên
- **THEN** panel hiển thị một hàng chi tiết trong vùng header ghim gồm đánh giá (sao + điểm) và số học viên
- **AND** hàng này không nằm trong vùng danh sách includes có thể cuộn

#### Scenario: Card không có đánh giá lẫn số học viên
- **WHEN** người xem mở thẻ hover-preview của một khoá không có đánh giá và không có số học viên
- **THEN** panel hiển thị một dòng mô tả ngắn (một dòng) thay cho hàng đánh giá/học viên nếu có mô tả
- **AND** nếu không có cả mô tả thì panel không hiển thị hàng chi tiết bổ sung nào

### Requirement: Thẻ hover-preview chỉ đóng khi con trỏ rời cả card lẫn panel, không tự đóng theo thời gian

Thẻ hover-preview SHALL mở khi người xem rê chuột lên card (sau một độ trễ mở ngắn để tránh nhấp nháy)
và SHALL **giữ mở suốt thời gian** con trỏ còn nằm trên card HOẶC trên panel. Panel SHALL KHÔNG có bất
kỳ hành vi "hiển thị trong N mili-giây rồi tự ẩn" nào — thời gian mở SHALL KHÔNG bị giới hạn bởi một
bộ đếm hiển thị.

Panel SHALL chỉ đóng khi con trỏ đã rời **cả** card lẫn panel, và chỉ sau một khoảng ân hạn ngắn để
con trỏ kịp di chuyển từ card sang panel (và ngược lại); việc con trỏ vào lại card HOẶC panel trong
khoảng ân hạn SHALL huỷ lần đóng đang chờ. Việc cuộn **nội dung bên trong panel** (danh sách "Khoá học
này bao gồm") SHALL KHÔNG làm panel đóng. Một lần cuộn trang / khối cha (làm card trôi khỏi vị trí panel
đang ghim) hoặc thay đổi kích thước cửa sổ VẪN đóng panel như trước.

#### Scenario: Giữ hover thì panel không tự tắt
- **WHEN** người xem mở panel và giữ con trỏ trên card hoặc trên panel mà không rời đi
- **THEN** panel vẫn mở, không tự đóng sau một khoảng thời gian nào

#### Scenario: Di chuyển con trỏ từ card sang panel
- **WHEN** người xem rời card để đưa con trỏ sang panel qua khoảng trống giữa chúng
- **THEN** panel không đóng trong lúc con trỏ băng qua khoảng trống (trong thời gian ân hạn)
- **AND** khi con trỏ vào panel, lần đóng đang chờ bị huỷ và panel vẫn mở

#### Scenario: Cuộn nội dung bên trong panel
- **WHEN** người xem cuộn danh sách "Khoá học này bao gồm" bên trong panel
- **THEN** panel vẫn mở (không đóng vì thao tác cuộn nội dung nội bộ của chính nó)

#### Scenario: Đóng khi rời hẳn cả card lẫn panel
- **WHEN** con trỏ rời cả card lẫn panel và ở ngoài suốt khoảng ân hạn
- **THEN** panel đóng lại sau khi hết khoảng ân hạn
