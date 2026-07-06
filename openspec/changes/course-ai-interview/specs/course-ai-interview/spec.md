# course-ai-interview — Delta Spec

## ADDED Requirements

### Requirement: Route AI Interview cuối khóa với luồng Setup → Session → Results

Hệ thống SHALL cung cấp route `/[locale]/courses/[courseId]/interview` render feature `CourseInterview`, một orchestrator ba giai đoạn: `setup` (xem đề + bắt đầu) → `session` (làm bài tuần tự) → `results` (điểm + feedback). Orchestrator MUST giữ `attemptId` xuyên các giai đoạn. Toàn trang SHALL bọc `AsyncContent` cho tải template và trạng thái mutation (start/finish).

#### Scenario: Học viên đi hết luồng vấn đáp

- **GIVEN** một khóa đã có bài vấn đáp do AI sinh
- **WHEN** học viên mở route interview, bấm "Bắt đầu vấn đáp", làm hết các câu, rồi hoàn thành
- **THEN** trang lần lượt hiển thị Setup → Session → Results, giữ đúng `attemptId` của lượt làm

### Requirement: InterviewSetup hiển thị bộ đề của khóa và bắt đầu lượt làm

`InterviewSetup` SHALL gọi `GET /api/v1/ai/interview/templates/{courseRef}` (qua `useQueryInterviewTemplateSwr`) và hiển thị số câu mỗi loại (`counts.oral/mcq/essay`), độ khó, mô tả. Khi khóa chưa có bài vấn đáp, hiển thị empty state `courseInterview.setup.empty`. Nút "Bắt đầu vấn đáp" SHALL gọi `POST /api/v1/ai/interview/attempts` và, khi thành công, chuyển sang giai đoạn session với `attemptId` + danh sách câu hỏi trả về. Lỗi tải template MUST hiển thị `courseInterview.setup.error` gọn gàng.

#### Scenario: Khóa chưa có bài vấn đáp

- **GIVEN** `GET /interview/templates/{courseRef}` trả về không có bộ đề
- **WHEN** học viên mở Setup
- **THEN** hiển thị empty state báo khóa chưa có bài vấn đáp, không có nút bắt đầu khả dụng

#### Scenario: Bắt đầu lượt làm

- **GIVEN** template có bộ đề
- **WHEN** học viên bấm "Bắt đầu vấn đáp"
- **THEN** hệ thống tạo attempt, nhận `attemptId` + câu hỏi, và chuyển sang giai đoạn làm bài

### Requirement: InterviewSession render 3 loại câu ORAL / MCQ / ESSAY và nộp tuần tự

`InterviewSession` SHALL render câu hỏi theo `question.type`: `MCQ` là radiogroup chọn một trong `options`; `ESSAY` là ô nhập nhiều dòng; `ORAL` là câu hỏi vấn đáp hỏi tuần tự (stream qua `useInterviewOralStream`) với ô trả lời text. Mỗi câu SHALL nộp qua `POST /api/v1/ai/interview/attempts/{id}/answers` rồi chuyển câu kế; câu cuối nộp xong SHALL gọi `POST /api/v1/ai/interview/attempts/{id}/finish`. Một thanh tiến độ MUST hiển thị `current/total`. Giao diện MUST KHÔNG lộ `answer_key` hay `rubric` cho học viên.

#### Scenario: Trả lời câu trắc nghiệm

- **GIVEN** câu hiện tại là MCQ với danh sách lựa chọn
- **WHEN** học viên chọn một đáp án và nộp
- **THEN** đáp án được gửi kèm `questionId` + `type`, và session chuyển sang câu kế

#### Scenario: Trả lời câu vấn đáp

- **GIVEN** câu hiện tại là ORAL
- **WHEN** AI hỏi (token stream vào bong bóng câu hỏi) và học viên gõ câu trả lời rồi gửi
- **THEN** câu trả lời được gửi, phần vấn đáp tiếp diễn tuần tự, và điểm được chấm ở bước tổng kết

#### Scenario: Không lộ đáp án/rubric

- **WHEN** học viên đang làm bất kỳ câu nào
- **THEN** giao diện không hiển thị `answer_key` hay `rubric` (client cũng không nhận các trường này)

### Requirement: InterviewResults hiển thị điểm và feedback từng câu

Sau khi finish, `InterviewResults` SHALL hiển thị điểm tổng (`totalScore`/`totalMax`) và, cho từng câu, điểm câu + `feedback` + `matchedPoints` + nhãn loại (MCQ/Essay/Oral). Trang SHALL có nút "Về khóa học" điều hướng về `/courses/[courseId]`. Lỗi khi tổng kết MUST hiển thị `courseInterview.results.error`, không crash.

#### Scenario: Xem kết quả

- **GIVEN** lượt làm đã hoàn thành và backend trả điểm + feedback
- **WHEN** giai đoạn Results render
- **THEN** học viên thấy điểm tổng và, mỗi câu, điểm + nhận xét + các ý đã nêu đúng

#### Scenario: Lỗi tổng kết

- **GIVEN** `POST /attempts/{id}/finish` trả lỗi hoặc chưa tồn tại
- **WHEN** học viên hoàn thành câu cuối
- **THEN** hiển thị thông báo lỗi `courseInterview.results.error`, giao diện không vỡ

### Requirement: i18n cụm courseInterview.* (vi + en)

Mọi chữ trong route interview SHALL lấy từ cụm khoá `courseInterview.*` với bản dịch đủ ở `vi.json` và `en.json`: tiêu đề, nhãn Setup (counts/difficulty/start/empty/error), nhãn Session (progress, tên 3 loại câu, placeholder, submit/next/finish/thinking), nhãn Results (total/feedback/matched/backToCourse/error).

#### Scenario: Chuyển ngôn ngữ

- **GIVEN** route interview đang hiển thị tiếng Việt
- **WHEN** người dùng chuyển locale sang English
- **THEN** toàn bộ nhãn (Setup, Session, Results, tên loại câu) hiển thị tiếng Anh, không key thô nào lộ ra
