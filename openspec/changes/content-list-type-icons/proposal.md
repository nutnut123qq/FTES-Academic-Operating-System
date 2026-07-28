# content-list-type-icons — List nội dung khoá học phân biệt icon theo LOẠI (video / tài liệu / bài tập)

## Why
Trong list nội dung khoá học, MỌI bài học đều hiện CÙNG MỘT icon: `PlayCircleIcon` (nút play).
Một bài VIDEO và một bài DOCUMENT (bài viết) trông y hệt nhau — không phân biệt được loại nội
dung khi liếc qua. Thầy: *"Ở list course content chưa phân biệt các icon, video, document, bài
tập, tài liệu gì cũng 1 icon hết, phân biệt cho tôi nhé"*.

Gốc rễ:
- Hàng bài học trong `ContentMap` (rail nội dung bên trái trang học) chỉ dùng `CheckCircleIcon`
  (đã hoàn thành) / `LockSimpleIcon` (khoá) / `PlayCircleIcon` (mọi trường hợp còn lại) → bài
  DOCUMENT cũng ra nút play như bài VIDEO.
- `LearnLesson` KHÔNG mang loại nội dung: BE curriculum đã có `LessonView.type` ("VIDEO" |
  "DOCUMENT") nhưng `toLearnLesson` bỏ qua, nên FE không có gì để chọn icon theo loại.
- List anh em — syllabus trong `CourseDetail` (trang bán khoá) — cũng dính hệt: hàng bài mở
  khoá đều `PlayCircleIcon`, `CourseLesson` cũng không mang `type`.
- Hàng BÀI TẬP con (challenge/assignment) đã có icon theo loại qua `exerciseSolverIcon`, NHƯNG
  một assignment mang `type` rỗng → rơi về `unknown` → cùng icon puzzle với challenge loại lạ.

## What Changes
- **Helper dùng chung `lessonTypeIcon`** — file mới `src/components/features/learn/lessonType.ts`
  (đặt cạnh `exerciseType.ts` sẵn có). Chuẩn hoá chuỗi loại của BE về một từ vựng
  (`video` | `document` | `material` | `unknown`) rồi trả icon phosphor theo loại:
  - **VIDEO** → `PlayCircleIcon` (nút play — icon video)
  - **DOCUMENT** (bài viết) → `FileTextIcon` (trang tài liệu — đúng quy ước nhà: `search/map.ts`
    đã map "contents" → `FileTextIcon`)
  - **material / tài liệu / resource-link** → `PaperclipIcon` (kẹp tài liệu — đúng quy ước nhà:
    `GroupResources` / `LessonDocumentsBlock` dùng `PaperclipIcon` cho tệp đính kèm). Forward-compat:
    hôm nay curriculum chỉ gửi VIDEO | DOCUMENT, nhánh material sáng lên ngay khi BE phát loại
    resource — không cần đụng caller.
  - unknown / rỗng → `PlayCircleIcon` (giữ mặc định lịch sử).
- **`LearnLesson.contentType`** — thêm field, map từ `LessonView.type` trong `toLearnLesson`.
- **`ContentMap`** — hàng bài học dùng `lessonTypeIcon(lesson.contentType)` cho trạng thái MẶC
  ĐỊNH (chưa hoàn thành, chưa khoá). GIỮ `CheckCircleIcon` (hoàn thành) + `LockSimpleIcon` (khoá)
  vì đó là chỉ báo TRẠNG THÁI, trực giao với loại — không được mất tín hiệu hoàn thành/khoá.
- **`ContentMap` — hàng bài tập:** assignment key icon theo `kind` → dùng icon assignment
  (`ClipboardTextIcon`) thay vì rơi về puzzle; challenge giữ icon theo loại như cũ.
- **`CourseDetail` syllabus (list anh em)** — thêm `CourseLesson.contentType` (map từ
  `lesson.type`), hàng bài MỞ KHOÁ dùng `lessonTypeIcon`; hàng KHOÁ giữ `LockIcon` (trạng thái).

## Impact
FE-only, KHÔNG cần API mới (`LessonView.type` đã có trong contract). Sửa: thêm
`features/learn/lessonType.ts`; `features/learn/hooks/useQueryLearnCourseSwr.ts` (+contentType);
`features/learn/ContentMap/index.tsx` (icon loại + assignment kind); `features/course/hooks/
useQueryCourseDetailSwr.ts` (+contentType); `features/course/CourseDetail/index.tsx` (icon loại).
Cập nhật 2 mock test `LearnLesson`. Block chết `OutlineRail`/`ContentMapRow` (không nơi dùng,
icon theo trạng thái) — KHÔNG đụng. Kích thước/màu icon giữ nguyên (`size-4 shrink-0 text-muted`).
Build xanh, `tsc` sạch.
