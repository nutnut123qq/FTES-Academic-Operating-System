# learn-challenge-submission

## ADDED Requirements

### Requirement: Challenge page loads the real linked challenge
`ChallengeSubmission` SHALL load challenge thật theo `challengeId` từ lesson payload (href build từ `LessonView.challengeId`, xóa mock `${contentId}-c`), qua `getChallengeBySlug(challengeId)` (BE fallback by-id) — `useQueryChallengeSubmissionSwr` không còn trả dữ liệu bịa.

#### Scenario: Mở challenge từ lesson
- **WHEN** learner bấm challenge từ lesson seed `seed-les-c1-s2-l1`
- **THEN** trang hiện đúng title/description/type của challenge seed `demo-mcq-c-pointers`

#### Scenario: Lesson không có challenge
- **WHEN** lesson payload không có `challengeId`
- **THEN** LessonReader không render entry challenge (không còn href mock)

### Requirement: Submit theo đúng loại challenge
Form nộp SHALL render theo `ChallengeView.type` và gọi `usePostSubmitChallengeSwr` với `SubmitRequest` đã mở rộng: `MULTIPLE_CHOICE` → chọn đáp án các `mcqQuestions` (taker-safe, không correctKeys) gửi `{payloadType:"MCQ", answers}`; `CODE` → gửi `{payloadType:"CODE", code, language}` (hoặc `URL`); `ESSAY` → gửi `{payloadType:"ESSAY", essayText}`. Types FE `SubmitRequest` SHALL thêm `answers`/`essayText` optional (không vỡ call-site cũ).

#### Scenario: Nộp MCQ
- **WHEN** learner chọn đáp án 2 câu MCQ và bấm nộp
- **THEN** request mang `answers = {questionId: ["A"], ...}` và response submission hiện trong lịch sử

#### Scenario: Nộp essay
- **WHEN** challenge type ESSAY và learner nhập bài luận
- **THEN** request mang `essayText`, trạng thái hiển thị "đang chấm" (AI chấm async — lane ftes-ai-service)

### Requirement: Submission history and async results
Trang SHALL hiển thị lịch sử nộp từ `getMyChallengeSubmissions` (attemptNo, status, autoScore/manualScore/finalScore) và chi tiết kết quả từ `getChallengeSubmissionResults`, tự poll (SWR refreshInterval) khi còn submission ở trạng thái chưa chấm xong và ngừng poll khi tất cả đã có kết quả.

#### Scenario: Kết quả về async
- **WHEN** submission MCQ được BE tự chấm xong
- **THEN** finalScore xuất hiện ở lần poll kế tiếp mà không reload

#### Scenario: Hết lượt nộp
- **WHEN** số submission đạt `maxSubmissions` của challenge
- **THEN** form nộp bị khóa kèm thông báo hết lượt

### Requirement: Challenge entry hidden at EVERY entry point when no active challenge
Khi lesson payload không mang `challengeId` (BE `course-learn-contract-gaps` đảm bảo chỉ challenge status ACTIVE — PUBLISHED|RUNNING — mới set cờ), MỌI entry point vào challenge SHALL không render: (1) tab "Challenges" trong `TabsCard` của `LessonReader` (dòng ~252 — đã gate theo `hasChallenge`, giữ nguyên); (2) card `ChallengesView` (fallback text "chưa có thử thách" thay vì nút mở); (3) nút "Practice this lesson" ở rail `OnThisPage` (desktop sticky aside VÀ bản mobile trong drawer) — hiện đang render VÔ ĐIỀU KIỆN với href mock `${contentId}-c`, SHALL gate theo `challengeId` thật từ lesson payload; (4) mọi nơi khác link tới route challenge của lesson (quét `challengeHref` khi implement). Không entry point nào SHALL build href từ pattern mock `-c`.

#### Scenario: Bài không có challenge ACTIVE sạch mọi entry
- **WHEN** learner mở lesson mà payload có `hasChallenge: false` (không challenge, hoặc challenge còn DRAFT/đã CLOSED)
- **THEN** không có tab Challenges trong TabsCard, không card mở challenge, và rail "On this page" (cả desktop lẫn mobile drawer) không hiện nút "Practice this lesson"

#### Scenario: Bài có challenge ACTIVE đủ mọi entry
- **WHEN** learner mở lesson seed `seed-les-c1-s2-l1` (challenge MULTIPLE_CHOICE PUBLISHED)
- **THEN** tab Challenges + nút practice ở rail cùng trỏ về đúng route challenge build từ `challengeId` thật

### Requirement: Course-bank challenge access and Workplace visibility
Với kho challenge theo course (BE change `course-challenge-bank`): FE type `ChallengeView` SHALL thêm `courseId`/`visibility` optional (không vỡ khi BE cũ). Khi BE trả **403 code `CHALLENGE_COURSE_ACCESS_DENIED`** (kèm `data.courseId`) lúc load detail hoặc submit challenge `COURSE_ONLY`, `ChallengeSubmission` SHALL render CTA **đăng ký khóa học** trỏ tới trang course theo `courseId` (luật premium-unlock = enroll, KHÔNG "VIP") thay vì màn lỗi chung. Trang `/challenges` (`ChallengeCatalog`) và Workplace practice SHALL giữ nguyên code list — BE đã lọc server-side chỉ trả challenge `WORKSPACE_PUBLIC` hoặc không thuộc course; FE SHALL NOT tự filter lại theo visibility.

#### Scenario: User chưa enroll mở challenge COURSE_ONLY
- **WHEN** user chưa enroll `seed-course-c-basic` mở challenge kho `demo-bank-mcq-c-strings` (COURSE_ONLY, seed V215)
- **THEN** trang hiện CTA đăng ký khóa học trỏ về course `seed-course-c-basic` (không hiện form nộp, không error chung)

#### Scenario: Learner đã enroll làm challenge kho qua lesson
- **WHEN** learner đã enroll mở challenge kho COURSE_ONLY từ lesson đã gắn
- **THEN** detail + submit hoạt động như challenge thường (guard BE pass)

#### Scenario: Workplace chỉ thấy challenge public
- **WHEN** user mở `/challenges` hoặc tab practice của Subject Workspace (sau seed V215)
- **THEN** danh sách có `demo-bank-mcq-c-arrays` (WORKSPACE_PUBLIC) và KHÔNG có 3 challenge COURSE_ONLY của kho

## Seed data

- Không seed FE. Verify trên BE seed `course-demo-seed-dev`: challenge MULTIPLE_CHOICE
  PUBLISHED `22222222-2222-4222-8222-22222222b001` (2 câu MCQ) gắn lesson `seed-les-c1-s2-l1`.
- Kho challenge: BE seed V215 (change `course-challenge-bank`) — `demo-bank-mcq-c-arrays`
  WORKSPACE_PUBLIC + 3 challenge COURSE_ONLY course `seed-course-c-basic`.
