# learn-assignment-submission

## ADDED Requirements

### Requirement: Assignment block lists real assignments
LessonReader SHALL hiển thị block assignment khi `GET /courses/lessons/{lessonId}/assignments` trả danh sách khác rỗng (SWR wrapper theo 3-tier), mỗi assignment hiện title, đề bài markdown, và số lượt đã nộp / `maxSubmissions`.

#### Scenario: Lesson có assignment
- **WHEN** learner mở lesson seed `seed-les-c1-s1-l3`
- **THEN** block hiện assignment `[DEMO] Viết parser nhỏ` với ô nhập GitHub URL

### Requirement: Learner submits GitHub URL and sees grading history
Form nộp SHALL validate URL bắt đầu `https://` phía client (mirror ràng buộc BE), gọi `usePostSubmitAssignmentSwr` (hook sẵn có, hiện 0 call-site), và lịch sử nộp SHALL đọc từ `getMyAssignmentSubmissions` hiển thị status/aiScore/evaluation — điểm AI do lane ftes-ai-service chấm về BE, FE chỉ đọc, poll lại (SWR refresh) khi còn submission chưa chấm xong.

#### Scenario: Nộp bài hợp lệ
- **WHEN** learner nhập URL repo https hợp lệ và bấm nộp
- **THEN** request submit bắn đi, lịch sử thêm dòng mới trạng thái chờ chấm, ô nhập khóa khi đạt maxSubmissions

#### Scenario: URL không hợp lệ
- **WHEN** learner nhập URL không bắt đầu bằng `https://`
- **THEN** form báo lỗi client-side, KHÔNG bắn request

#### Scenario: Điểm AI về sau
- **WHEN** submission chuyển trạng thái đã chấm ở BE
- **THEN** lần refresh kế tiếp hiển thị aiScore + evaluation không cần reload trang

## Seed data

- Không seed FE. Verify trên BE seed `course-demo-seed-dev`: assignment
  `seed-assign-c1-parser` (free, max_submissions 5) trên lesson `seed-les-c1-s1-l3`.
