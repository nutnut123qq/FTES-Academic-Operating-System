# learn-quiz-taking

## ADDED Requirements

### Requirement: Lesson quiz block renders from real contract
LessonReader SHALL hiển thị block quiz khi lesson payload có `hasQuiz: true`, dữ liệu lấy từ `GET /courses/lessons/{lessonId}/quizzes` qua `useGetLessonQuizzesSwr` (title, questionCount, best score, attempt count) — KHÔNG còn đường dẫn nào tới `useQueryQuizSwr` mock.

#### Scenario: Lesson có quiz
- **WHEN** learner mở lesson có quiz PUBLISHED (seed `seed-les-c1-s1-l2`)
- **THEN** block quiz hiện tựa đề + số câu + nút "Làm quiz"

#### Scenario: Lesson không có quiz
- **WHEN** lesson payload `hasQuiz: false`
- **THEN** block quiz không render và không request nào bắn tới endpoint quizzes

### Requirement: Learner takes and submits a quiz attempt
Bấm làm bài SHALL gọi `usePostStartQuizAttemptSwr` để nhận câu hỏi taker-safe, render UI làm bài in-place với đếm ngược `timeLimitSeconds` (hết giờ tự submit), và submit qua `usePostSubmitQuizAttemptSwr` với answers dạng `{questionId: [keys]}`; kết quả (scorePercent, passed) + lịch sử attempt (`useGetMyQuizAttemptsSwr`) SHALL hiển thị ngay sau submit (mutate SWR keys).

#### Scenario: Làm bài trọn vòng
- **WHEN** learner start attempt, chọn đáp án 3 câu rồi submit
- **THEN** màn kết quả hiện điểm %, trạng thái đạt/không đạt, và lịch sử có attempt vừa nộp

#### Scenario: Hết giờ
- **WHEN** đếm ngược timeLimitSeconds về 0 khi đang làm
- **THEN** bài tự submit với các đáp án đã chọn tới thời điểm đó

#### Scenario: Không có quyền
- **WHEN** BE trả 403 `COURSE_ACCESS_DENIED` (chưa enroll)
- **THEN** block hiển thị CTA đăng ký khóa học (enroll — không "VIP"), không crash

## Seed data

- Không seed FE. Verify trên BE seed `course-demo-seed-dev` (V213): quiz PUBLISHED 3 câu
  `11111111-1111-4111-8111-11111111a001` gắn lesson `seed-les-c1-s1-l2`, account test student
  đã seed enrollment — mở lesson là làm được quiz ngay.
