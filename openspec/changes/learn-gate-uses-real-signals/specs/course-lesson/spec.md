# course-lesson

## ADDED Requirements

### Requirement: Sơ đồ tư duy tô khoá theo quyền người xem, không theo cờ nội dung

Sơ đồ tư duy của khoá SHALL xác định trạng thái "khoá" của một học phần bằng cờ khoá PER-VIEWER của
các bài trong học phần đó (`LessonView.locked`), KHÔNG bằng cờ tĩnh "bài trả phí" (`!free`). Một học
phần SHALL chỉ ở trạng thái "khoá" khi người xem không mở được bài nào trong đó.

Chú giải trạng thái khoá SHALL dùng ngôn ngữ đăng ký/mua khoá học, KHÔNG dùng ngôn ngữ nâng hạng
("nâng cấp", "upgrade") — cơ chế mở khoá của hệ thống là đăng ký khoá học.

#### Scenario: Học viên đã mua khoá
- **WHEN** người xem đã mua khoá nên mọi bài đều không bị khoá với họ
- **THEN** không học phần nào bị tô trạng thái khoá, kể cả học phần gồm toàn bài trả phí

#### Scenario: Khách chưa mua, toàn bộ bài bị khoá
- **WHEN** mọi bài của một học phần đều bị khoá với người xem và chưa bài nào hoàn thành
- **THEN** học phần đó được tô trạng thái khoá

#### Scenario: Học phần còn bài mở được
- **WHEN** một học phần có ít nhất một bài người xem mở được
- **THEN** học phần đó KHÔNG bị tô trạng thái khoá

### Requirement: Mở học phần từ sơ đồ tư duy hành xử như rail nội dung

Bấm một học phần trên sơ đồ tư duy SHALL mở bài đầu tiên mà người xem còn quyền vào (khác
`accessLevel` `NONE`). Khi không bài nào trong học phần mở được, sơ đồ SHALL mở cổng thanh toán gói
(cùng cổng mà rail nội dung dùng) thay vì điều hướng thẳng vào một bài bị khoá.

#### Scenario: Học phần có bài mở được nằm sau bài khoá
- **WHEN** bài đầu của học phần có `accessLevel` `NONE` còn bài thứ hai thì không
- **THEN** bấm học phần mở bài thứ hai

#### Scenario: Học phần khoá hoàn toàn
- **WHEN** mọi bài của học phần đều có `accessLevel` `NONE`
- **THEN** bấm học phần mở cổng thanh toán gói
- **AND** không có điều hướng nào vào trang bài học

### Requirement: Video xem thử không phụ thuộc trường theo người xem

Trang học SHALL mount khối video xem thử khi bài là bài video đã sẵn sàng phát và có thời lượng xem
thử (`previewSeconds > 0`) — một thuộc tính của NỘI DUNG — kể cả khi trường theo người xem
(`accessLevel`) vắng mặt hoặc chưa xác định. Nhánh cũ theo `accessLevel === "PREVIEW"` SHALL giữ
nguyên.

Lý do: khách chưa đăng nhập là đúng nhóm cần mời chào, mà đó lại là nhóm hay có `accessLevel` rỗng
nhất; mất khối video là mất cả lối xem thử lẫn CTA mua.

#### Scenario: Khách chưa đăng nhập xem bài video có thời lượng xem thử
- **WHEN** bài video ở trạng thái sẵn sàng phát, `previewSeconds` là 900 và `accessLevel` là rỗng
- **THEN** khối video được mount

#### Scenario: Bài video không có thời lượng xem thử
- **WHEN** bài video sẵn sàng phát nhưng `previewSeconds` là 0 và `accessLevel` rỗng, không có ref phát được
- **THEN** khối video không được mount

### Requirement: Cổng gói phải liệt kê cả gói miễn phí mở khoá bài đó

Cổng thanh toán gói SHALL liệt kê mọi gói mở khoá bài hiện tại bất kể giá, kể cả gói giá 0. Cổng
SHALL KHÔNG loại gói chỉ vì giá bằng 0 — làm vậy khiến người dùng bị chào mua trọn khoá tính phí
trong khi chỉ cần nhận gói miễn phí. Gói giá 0 SHALL đi theo nhánh nhận-gói-miễn-phí sẵn có (thêm vào
giỏ rồi checkout thẳng, không mở cổng thanh toán).

#### Scenario: Gói miễn phí mở khoá bài
- **WHEN** bài bị khoá được mở bởi một gói giá 0 đang hoạt động
- **THEN** cổng liệt kê gói đó
- **AND** không rơi xuống nhánh chào mua trọn khoá tính phí

#### Scenario: Gói tính phí giữ nguyên
- **WHEN** bài bị khoá được mở bởi các gói tính phí
- **THEN** cổng liệt kê các gói đó sắp rẻ trước như trước
