# sql-run-tests-seed

## ADDED Requirements

### Requirement: Chạy test bài SQL phải gửi kèm dữ liệu mẫu của bài
Khi người học bấm "Chạy test" ở một bài SQL, giao diện SHALL gửi kèm dữ liệu mẫu của bài trong
yêu cầu chạy test — cùng giá trị đang được gửi khi chạy truy vấn một lần.

Với bài KHÔNG phải SQL, yêu cầu SHALL KHÔNG kèm trường này.

#### Scenario: Bài SQL có dữ liệu mẫu
- **WHEN** người học bấm "Chạy test" ở bài SQL có dữ liệu mẫu
- **THEN** yêu cầu gửi lên SHALL chứa dữ liệu mẫu đó
- **AND** kết quả từng test-case SHALL hiển thị trong bảng kết quả như bài code

#### Scenario: Bài SQL chưa gắn dữ liệu mẫu
- **WHEN** bài SQL không có dữ liệu mẫu
- **THEN** yêu cầu SHALL không kèm trường dữ liệu mẫu (thay vì gửi chuỗi rỗng)

#### Scenario: Bài lập trình thông thường
- **WHEN** ngôn ngữ không phải SQL
- **THEN** yêu cầu SHALL giữ nguyên như trước, không thêm trường nào
