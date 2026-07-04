## Why

Header của trang chi tiết không gian học hiện hiển thị phần trăm hoàn thành dạng văn bản tĩnh (`62% hoàn thành`) và một badge tên ngườii dùng (`Lê Minh Quân`) ở bên phải. Việc dùng progress bar giúp ngườii dùng nhận biết nhanh mức độ hoàn thành khóa học; xóa badge tên ngườii dùng khỏi header giảm thiểu thông tin không cần thiết ở vị trí đầu trang và tránh nhầm lẫn với thông tin cá nhân. Thay đổi này giới hạn trong đúng component header, không ảnh hưởng các màn hình khác.

## What Changes

- Trong `src/components/features/subject/SubjectWorkspaceShell/index.tsx`:
  - Thay thế đoạn text `t("progress", { percent: subject.progress })` bằng một thanh progress bar, sử dụng giá trị `subject.progress` làm phần trăm. Thanh progress bar phải có các thuộc tính accessibility `role="progressbar"`, `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"`.
  - Xóa badge `Chip` hiển thị `subject.lecturer` (`Lê Minh Quân`) ở bên phải header. Nếu prop/component không còn được sử dụng trong file này, loại bỏ import tương ứng.
- Không thay đổi i18n, data mock, routing, hay behavior nghiệp vụ khác.
- Không thêm dependency hay abstraction mới; tái sử dụng design token và component progress bar đã có trong repo.

## Capabilities

### New Capabilities

- `subject-workspace-header-progress`: Hiển thị tiến độ hoàn thành không gian học dưới dạng progress bar thay vì text phần trăm, dựa trên `Subject.progress`.

### Modified Capabilities

- Không có capability-level requirement thay đổi.

## Impact

- **UI Components**: `src/components/features/subject/SubjectWorkspaceShell/index.tsx`.
- **Data fetching**: Không thay đổi; tiếp tục dùng `subject.progress` từ `useQuerySubjectSwr`.
- **i18n**: Không thay đổi; key `subjects.progress` không còn dùng ở header nhưng vẫn giữ lại để tái sử dụng nếu cần.
- **Dependencies**: Không thêm dependency mới.
