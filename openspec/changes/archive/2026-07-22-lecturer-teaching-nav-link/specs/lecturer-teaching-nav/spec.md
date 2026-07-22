# lecturer-teaching-nav — Spec

## ADDED Requirements

### Requirement: Lecturer-gated "Khoá tôi dạy" entry in the account menu

Account menu của viewer đã đăng nhập SHALL hiển thị một mục "Khoá tôi dạy" điều hướng tới `/courses/teaching` KHI VÀ CHỈ KHI viewer giữ permission `ai.teacher.use` (cùng gate mà panel quản lý phỏng vấn dùng để nhận diện giảng viên); viewer không giữ permission đó MUST NOT thấy mục này. Mục SHALL đặt cùng cụm với "Khóa học của tôi" và MUST NOT được thêm vào header 4-module chính (giữ nguyên design D9 không submenu). Nhãn SHALL lấy từ i18n `nav.teaching` (vi/en).

#### Scenario: Giảng viên thấy link
- **WHEN** viewer giữ `ai.teacher.use` mở account menu
- **THEN** menu SHALL hiển thị mục "Khoá tôi dạy"
- **AND** chọn mục đó điều hướng tới `/courses/teaching`

#### Scenario: Người dùng thường không thấy link
- **WHEN** viewer KHÔNG giữ `ai.teacher.use` mở account menu
- **THEN** menu MUST NOT hiển thị mục "Khoá tôi dạy"
- **AND** mục "Khóa học của tôi" vẫn hiển thị bình thường
