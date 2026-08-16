# fe-text-exam-pages — Album đề FE hiển thị và nạp được trang CHỮ

## Why

BE (`subject-fe-text-exams`) nay lưu được trang đề dạng văn bản đã chuẩn hoá bên cạnh trang scan.
Không có phần FE thì tính năng vô hình: người đóng góp không có nút nào để nạp file `.txt`/`.md`,
và trang chữ trả về từ API sẽ render thành **ô ảnh vỡ** vì viewer chỉ biết vẽ `<img>`.

## What Changes

- **Nạp file đề dạng văn bản** trong panel quản lý album: chọn nhiều file `.txt`/`.md`, gửi **một
  file mỗi request, tuần tự**, báo tiến độ, và nói rõ file nào hỏng vì sao. Cảnh báo của AI ("câu 7
  thiếu phương án") hiện lên chứ không bị nuốt — đó chính là lý do người soạn quay lại sửa file gốc.
- **Viewer đọc được trang chữ**: trang `kind=TEXT` render Markdown trong khung cuộn (không zoom/pan
  — chữ tự xuống dòng, cả bộ máy pinch/drag không giải quyết vấn đề nào ở đây); thumbnail là icon
  file + tên file gốc để hai trang chữ phân biệt được với nhau.
- **Phân trang không đổi**: trang chữ và trang scan chung một bộ đếm, một cặp mũi tên, một filmstrip.
- `imageUrl` thành nullable trong type — và **rẽ nhánh theo `kind`, không theo "có url hay không"**:
  ký URL hỏng ở một trang ảnh cũng cho ra không-url, coi đó là trang chữ thì hiện một bài viết
  rỗng thay vì trạng thái lỗi của ảnh.

## Capabilities

### Modified Capabilities
- `subject-practice`: album đề FE nạp và hiển thị được trang chữ bên cạnh trang scan.

## Impact
- Cần BE nhánh `feat/fe-text-exam-items` + ai-service nhánh `feat/exam-text-normalize`.
- Backend cũ (chưa có change) trả `kind` undefined ⇒ mọi trang là ảnh, đúng như album cũ vốn có.
