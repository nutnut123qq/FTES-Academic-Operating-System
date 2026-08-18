# challenge-submission

## ADDED Requirements

### Requirement: Bảng kết quả chạy thử hiện mọi case, che dữ liệu case ẩn
Bảng kết quả chạy thử SHALL hiện một dòng cho MỌI test case trong kết quả trả về, không chỉ case mẫu.

Dòng của case ẩn SHALL nêu rõ case đó đạt hay trượt kèm verdict, và SHALL hiện nhãn "đã ẩn" ở các ô
dữ liệu vào / kết quả mong đợi / kết quả thực tế thay vì để trống — ô trống mang nghĩa "case không có
dữ liệu vào", là một điều khác.

Dòng của case mẫu SHALL hiện dữ liệu như trước.

Kết quả KHÔNG mang cờ ẩn SHALL được hiện như case mẫu.

#### Scenario: Đề một case mẫu và một case ẩn
- **WHEN** học viên xem kết quả chạy thử
- **THEN** bảng SHALL có hai dòng
- **AND** dòng ẩn SHALL nêu đạt/trượt kèm verdict
- **AND** ba ô dữ liệu của dòng ẩn SHALL hiện nhãn "đã ẩn"

#### Scenario: Kết quả từ backend chưa có cờ ẩn
- **WHEN** kết quả trả về không mang cờ ẩn trên dòng nào
- **THEN** mọi dòng SHALL hiện dữ liệu như case mẫu

### Requirement: Bộ test bị trần cắt phải được nói ra
Bảng kết quả SHALL hiện cảnh báo kèm số case không được chạy khi kết quả cho biết bộ test bị cắt.

#### Scenario: Đề vượt trần một lượt chạy
- **WHEN** kết quả trả về cho biết bộ test bị cắt và còn 10 case chưa chạy
- **THEN** bảng SHALL hiện cảnh báo nêu 10 case chưa được chạy
