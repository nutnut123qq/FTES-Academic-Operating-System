# course-catalog-browse

## ADDED Requirements

### Requirement: Hover-preview CTA phản ánh trạng thái ghi danh của người xem

Nút chính (CTA) trên thẻ hover-preview của khoá học SHALL phản ánh trạng thái ghi danh của người xem
với đúng khoá đó, thay vì luôn mời đăng ký. Người xem ĐÃ tham gia khoá SHALL thấy CTA "Tiếp tục học"
đưa vào phần học của khoá (`/courses/{slug}/learn`); người xem CHƯA tham gia SHALL thấy CTA "Đăng ký
khóa học" giữ nguyên hành vi cũ (đưa về trang chi tiết khoá để vào luồng đăng ký).

Trạng thái ghi danh SHALL lấy từ tín hiệu ghi danh dùng chung của luồng duyệt khoá (tập slug các khoá
người xem đang ghi danh, tải một lần dưới SWR key dùng chung và chỉ tải khi có phiên đăng nhập), nên
việc rê chuột qua nhiều thẻ SHALL KHÔNG phát sinh request kiểm tra ghi danh cho từng thẻ, và khách
vãng lai SHALL luôn thấy CTA "Đăng ký khóa học".

#### Scenario: Người xem đã tham gia khoá
- **WHEN** người xem đã ghi danh khoá và rê chuột mở thẻ hover-preview của khoá đó
- **THEN** CTA chính hiển thị nhãn "Tiếp tục học"
- **AND** bấm CTA điều hướng vào phần học của khoá (`/courses/{slug}/learn`), không mở luồng đăng ký

#### Scenario: Người xem chưa tham gia khoá
- **WHEN** người xem chưa ghi danh khoá và rê chuột mở thẻ hover-preview của khoá đó
- **THEN** CTA chính hiển thị nhãn "Đăng ký khóa học"
- **AND** bấm CTA điều hướng về trang chi tiết khoá (`/courses/{slug}`) như hành vi cũ

#### Scenario: Khách vãng lai (chưa đăng nhập)
- **WHEN** người xem chưa đăng nhập mở thẻ hover-preview của bất kỳ khoá nào
- **THEN** CTA chính hiển thị nhãn "Đăng ký khóa học"
- **AND** không có request kiểm tra ghi danh nào được phát đi

#### Scenario: Rê qua nhiều thẻ không phát request mỗi thẻ
- **WHEN** người xem rê chuột lần lượt qua nhiều thẻ khoá trong cùng một trang duyệt
- **THEN** trạng thái ghi danh của mỗi thẻ đọc từ một lần tải danh sách ghi danh dùng chung
- **AND** không có request kiểm tra ghi danh riêng cho từng thẻ được rê qua
