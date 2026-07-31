# lesson-topbar-assignment — Nút "Làm bài tập" ở thanh trên bài học (khi buổi có assignment)

## Why
Đợt #97 thêm nút "Làm thử thách" (gate `hasChallenge`) + "Tài liệu buổi học" (gate documents).
Nhưng nhiều buổi học chỉ có **Assignment** (bài tập nộp github/file), KHÔNG có challenge → không
nút nào hiện (thầy: "vẫn chưa có nút làm challenge/xem tài liệu" ở buổi có Assignments). Assignment
hiện inline trong `LessonAssignmentBlock`; cần 1 nút ở thanh trên để tới đúng khối làm bài.

## What Changes
- `LessonReader`: thêm nút **"Làm bài tập"** ở thanh trên (cạnh Làm thử thách/Tài liệu), CHỈ hiện
  khi buổi có assignment. Gate bằng `useGetLessonAssignmentsSwr(contentId)` (DÙNG CHUNG key
  `["LESSON_ASSIGNMENTS_SWR", contentId]` với `LessonAssignmentBlock` → không double-fetch). Bấm →
  cuộn mượt tới khối assignment inline `#lesson-assignments` (giống nút Tài liệu; assignment không
  có route riêng — route standalone cũ đã redirect vào learn shell).
- `LessonAssignmentBlock`: thêm `id="lesson-assignments"` cho anchor cuộn.
- i18n `learn.reader.assignmentButton` (vi "Làm bài tập" / en "Do assignment").

## Capabilities
### Modified Capabilities
- `learn-reader`: thanh trên bài học có thêm nút vào assignment khi buổi có bài tập.

## Impact
FE-only. Sửa `LessonReader/index.tsx` + `LessonAssignmentBlock` + 2 message JSON + test. tsc sạch,
vitest LessonReader 51/51 (thêm 2 test). Không đụng luồng nộp bài / chấm AI.
