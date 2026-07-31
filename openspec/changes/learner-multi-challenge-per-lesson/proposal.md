# Learner: render NHIỀU challenge mỗi bài học (bỏ giả định 1)

## Why
Backend đổi ràng buộc: một bài học nay mang NHIỀU challenge active (trước chỉ 1 → phần lớn bài tập
bị ẩn). Trang đọc bài (`LessonReader` tab "Thử thách" + rail `OnThisPage`) đang **giả định 1
challenge**: dùng linkage đơn `hasChallenge`/`challengeId` (trỏ challenge cũ nhất) → chỉ mở đúng 1,
ẩn các challenge còn lại của bài. (Content-map bên trái đã render đủ list từ trước.)

## What Changes
- `useQueryLearnLessonSwr`: expose mảng `challenges` (id, title, slug, type, free) trên
  `LearnLessonView` — trước chỉ có nội bộ ở FlatLesson để suy `freeChallengeSlug`/`challengeFree`.
  `challengeCount` lấy số thật thay vì hardcode 0.
- `LessonReader` tab "Thử thách": `ChallengesView` render **CẢ list** — mỗi challenge 1 thẻ (tiêu đề +
  loại + chip khoá), khoá độc lập theo `free` + quyền (non-free chưa mở khoá → mở gate). Tab hiện khi
  có ≥1 challenge trong list (fallback linkage đơn cho BE cũ).
- `OnThisPage` rail: 1 nút "Làm thử thách" **mỗi** challenge (nhãn theo tiêu đề) thay vì 1 nút duy nhất.
- KHÔNG dùng `hasChallenge`/`challengeId` để dựng danh sách (chỉ giữ làm fallback BE cũ) — theo đúng
  lưu ý hợp đồng.

## Impact
- Affected spec: `learn-lesson-challenges` (ADDED)
- Affected code: `learn/hooks/useQueryLearnLessonSwr.ts`, `learn/LessonReader/index.tsx`,
  `learn/OnThisPage/index.tsx`. Wire type `LessonView.challenges` đã có sẵn — không đổi API.
- Ngoài phạm vi (follow-up): trang KHOÁ CÔNG KHAI (`CourseDetail` outline) hiện chưa render challenge
  nào; thêm hàng challenge ở đó cần thread `challenges` qua `useQueryCourseDetailSwr` — để PR sau.
