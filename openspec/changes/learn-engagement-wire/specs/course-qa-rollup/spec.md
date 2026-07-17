# course-qa-rollup

## ADDED Requirements

### Requirement: Course Q&A rolls up real lesson comments
`CourseQa` SHALL bỏ `mock.ts`, roll-up câu hỏi từ `GET /courses/lessons/{lessonId}/comments` của các lesson trong course (fan-out chunk tối đa 5 request đồng thời), map comment gốc → question và `replies` → answers, mỗi question link về đúng lesson trong learn shell; filter/search/page chạy client-side trên tập roll-up.

#### Scenario: Q&A hiện comment thật
- **WHEN** 2 lesson của course có comment (post qua LessonComments)
- **THEN** tab Q&A hiện các comment đó dạng question kèm tên lesson + link nhảy tới lesson

#### Scenario: Course chưa có comment
- **WHEN** không lesson nào có comment
- **THEN** Q&A hiện empty state (không lỗi, không skeleton treo)

### Requirement: Ask routes to a lesson comment
Composer đặt câu hỏi trong Q&A SHALL yêu cầu chọn lesson đích (dropdown lesson của course) và post qua `usePostLessonCommentSwr` (KHÔNG API mới); post xong roll-up SHALL revalidate để câu hỏi xuất hiện.

#### Scenario: Đặt câu hỏi từ Q&A
- **WHEN** learner chọn lesson 1.2 và gửi câu hỏi
- **THEN** comment được tạo trên lesson 1.2 (thấy được cả trong LessonComments của bài đó) và Q&A hiện ngay câu hỏi mới

## Seed data

- Không seed FE. E2E post comment thật trên lesson seed `seed-les-c1-s1-l2`
  (BE `course-demo-seed-dev`) bằng account test đã enroll rồi xem roll-up.
