# lecturer-teaching-nav-link — Link "Khoá tôi dạy" trong account menu, gate LECTURER

## Why

Trang `/courses/teaching` ("Khoá tôi dạy" — danh sách khoá giảng viên sở hữu mọi status) đã có
nhưng chỉ tới được bằng URL trực tiếp, không có lối vào trong UI. Giảng viên cần một entry point
để mở trang quản lý bài phỏng vấn AI của các khoá mình dạy. Header chính cố ý chỉ 4 module,
không submenu (design D9) → đích theo-role thuộc về **account menu** (avatar popup), nơi đã chứa
"Khóa học của tôi", Dashboard, Roles...

## What Changes

- Thêm một `Dropdown.Item` "Khoá tôi dạy" vào `AccountMenuAuthed` (ngay dưới "Khóa học của tôi",
  cùng cụm course), **chỉ render khi** viewer giữ permission `ai.teacher.use` — đúng gate mà panel
  quản lý phỏng vấn (`CourseInterview`) đang dùng để xác định giảng viên. Icon `ChalkboardTeacher`.
- Thêm builder path `pathConfig().locale().course().teaching()` → `/courses/teaching` (mirror `mine()`).
- i18n `nav.teaching` (vi "Khoá tôi dạy" / en "Courses I teach").
- **KHÔNG** đổi header 4-module (D9), **KHÔNG** gate lại trang teaching (BE đã scope theo instructorId).

## Capabilities

### New Capabilities
- `lecturer-teaching-nav`: account menu SHALL hiện link "Khoá tôi dạy" → `/courses/teaching` chỉ cho
  viewer có `ai.teacher.use`; viewer khác không thấy.

### Modified Capabilities
<!-- none -->

## Impact

- FE only. `components/features/navbar/Navbar/AccountMenuDropdown/AccountMenuAuthed/index.tsx`
  (item + gate `useHasPermission("ai.teacher.use")`), `resources/path/index.ts` (builder `teaching`),
  `messages/{vi,en}.json` (`nav.teaching`).
- `tsc --noEmit` + `npm run build` (webpack) xanh; verify E2E FE local: instructor thấy link, student không.
