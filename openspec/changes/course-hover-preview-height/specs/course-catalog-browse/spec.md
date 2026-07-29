# course-catalog-browse

## ADDED Requirements

### Requirement: Thẻ hover-preview khớp chiều cao với card khoá và không tràn quá card

Thẻ hover-preview của khoá học SHALL có chiều cao khớp với chiều cao của card khoá mà nó bật ra cạnh,
và SHALL KHÔNG vượt quá mép trên hoặc mép dưới của card đó. Panel SHALL bị giới hạn chiều cao tối đa
bằng chiều cao card (và không quá chiều cao khung nhìn), và mép TRÊN của panel SHALL được ghim vào mép
trên của card để panel mọc xuống dưới trong phạm vi card thay vì trôi lên trên và xuống dưới card.

Panel SHALL giữ header (tiêu đề, chip cấp độ, dòng meta) và các nút CTA (nút chính đăng ký/tiếp tục
học, nút lưu, nút thêm vào giỏ khi có) luôn hiển thị trong phạm vi chiều cao card; khi nội dung dài
hơn chiều cao card, CHỈ vùng danh sách "Khoá học này bao gồm" SHALL cuộn, còn header và CTA SHALL đứng
yên (được ghim). Với card có chiều cao thông thường, panel SHALL vừa vặn mà KHÔNG cần cuộn — danh sách
includes SHALL được nén (giới hạn số bullet và cắt dòng) để đạt điều này.

Chiều cao giới hạn SHALL được dẫn xuất từ chiều cao card đo tại thời điểm mở (không hardcode một chiều
cao pixel cố định), nên yêu cầu này SHALL đúng cho mọi cỡ card trong luồng duyệt khoá (shelf danh mục,
lưới danh mục, lưới catalog) và mọi breakpoint. Vị trí NGANG của panel, việc chọn phía trái/phải và
mũi tên caret trỏ về card SHALL giữ nguyên như trước; chỉ chiều DỌC được sửa. Nhánh CTA theo trạng
thái ghi danh (đã tham gia → "Tiếp tục học"; chưa tham gia → "Đăng ký khóa học") SHALL được giữ nguyên.

#### Scenario: Nội dung ngắn hơn chiều cao card
- **WHEN** người xem rê chuột mở thẻ hover-preview của một card mà nội dung panel ngắn hơn chiều cao card
- **THEN** panel hiển thị với mép trên ghim vào mép trên card và không cần cuộn
- **AND** panel không vượt quá mép dưới của card

#### Scenario: Danh sách includes dài hơn chiều cao card
- **WHEN** người xem mở thẻ hover-preview của một card mà danh sách "Khoá học này bao gồm" dài khiến
  nội dung vượt chiều cao card
- **THEN** chiều cao panel bị giới hạn bằng chiều cao card (không tràn lên trên hay xuống dưới card)
- **AND** chỉ vùng danh sách includes cuộn, còn header và các nút CTA vẫn ghim và hiển thị đầy đủ
  trong phạm vi chiều cao card

#### Scenario: Nút CTA luôn nằm trong phạm vi chiều cao card
- **WHEN** người xem mở thẻ hover-preview của bất kỳ card nào
- **THEN** nút chính (đăng ký / tiếp tục học) và nút thêm vào giỏ (nếu có) luôn hiển thị trong phạm vi
  chiều cao card, không bị đẩy ra ngoài mép card

#### Scenario: Vị trí ngang và mũi tên giữ nguyên
- **WHEN** người xem mở thẻ hover-preview
- **THEN** panel vẫn bật ra bên phải (hoặc lật sang trái khi thiếu chỗ) với mũi tên caret trỏ về tâm
  card như trước
- **AND** chỉ chiều cao và canh dọc của panel thay đổi so với hành vi cũ
