## Context

Header của `SubjectWorkspaceShell` hiện render:

- Tiêu đề: `{subject.code} · {subject.name}`.
- Phụ đề: `{credits} · {difficulty} · {percent}% hoàn thành`.
- Badge bên phải: `Chip` chứa `subject.lecturer` (mock là `Lê Minh Quân`).

Repo đã có component `ProgressMeter` (`src/components/blocks/stats/ProgressMeter/index.tsx`) dựng trên HeroUI `ProgressBar`, hỗ trợ `value`, `max`, `label`, `showValue` và tự động tính phần trăm.

## Goals / Non-Goals

**Goals:**
- Thay text `% hoàn thành` bằng progress bar lấy giá trị từ `subject.progress`.
- Progress bar phải accessible (`role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`).
- Xóa badge tên ngườii dùng/lecturer ở header.
- Dùng đúng design token và component sẵn có.

**Non-Goals:**
- Không thay đổi mock data hay API.
- Không refactor layout hay các tab bên dưới header.
- Không thay đổi i18n.

## Decisions

- Sử dụng `ProgressMeter` vì repo đã dùng nó ở các màn `CourseProgress`, `ProfileProgress`, đảm bảo nhất quán.
- `ProgressMeter` sử dụng `ProgressBar` của HeroUI, đã hỗ trợ accessibility role/props; ta chỉ cần truyền đúng `value`.
- Xóa `Chip` import nếu không còn dùng trong component.

## Risks / Trade-offs

- Rủi ro thấp: chỉ thay đổi presentation của một giá trị đã có và xóa một element không cần thiết.
- Nếu `Chip` bị xóa import, cần đảm bảo `Chip` không dùng ở chỗ khác trong cùng file.
