# Design — learn-exercises-wire

Bám strict 3-tier: `modules/api/rest` (fetch + types) → `hooks/swr/api/rest` (SWR wrapper)
→ feature component. Code mới theo skill `starci-fe-cannon-apply`; layout block mới qua
`starci-fe-ux-brainstorm` → `starci-fe-ux-apply`.

## 1. REST layer

### 1.1 `modules/api/rest/course` (types.ts + course.ts)

```ts
/** Quiz taker-safe theo lesson (GET /courses/lessons/{lessonId}/quizzes). */
export interface QuizSummaryView {
    id: string
    lessonId: string
    title: string
    description: string | null
    passScorePercent: number
    timeLimitSeconds: number | null
    maxAttempts: number | null
    questionCount: number
    status?: string | null
    myAttemptCount: number | null
    myBestPercent: string | null
    myPassed: boolean | null
}

/** Một attempt của caller (GET /courses/quizzes/{quizId}/attempts/me). */
export interface QuizAttemptHistoryView {
    attemptId: string
    attemptNo: number
    startedAt: string
    submittedAt: string | null
    scorePoints: number | null
    scorePercent: string | null
    passed: boolean | null
}
```

- `getLessonQuizzes(lessonId)` → `GET /courses/lessons/${lessonId}/quizzes`.
- `getMyQuizAttempts(quizId)` → `GET /courses/quizzes/${quizId}/attempts/me`.
- `LessonContentView` thêm `hasQuiz?: boolean`, `quizId?: string | null`,
  `challengeId?: string | null` (additive — BE trả từ change course-learn-contract-gaps;
  optional để không vỡ khi BE cũ).

### 1.2 `modules/api/rest/challenges/types.ts`

```ts
export interface SubmitRequest {
    payloadType: string            // "CODE" | "STORAGE" | "URL" | "MCQ" | "ESSAY"
    code: string
    language: string
    storageKey: string
    url: string
    /** MCQ answers: questionId -> selected option keys (BE V194). */
    answers?: Record<string, Array<string>>
    /** Essay body for ESSAY challenges (AI-graded — lane ftes-ai-service). */
    essayText?: string
}
```

Optional để `submitChallenge` call-site cũ compile nguyên. `ChallengeView` FE đối chiếu lại
với BE `ChallengeViews.ChallengeView` (đã có `lessonId`, `gradingConfig`, `mcqQuestions`) —
thêm field thiếu nếu lệch (đọc types hiện tại lúc implement).

## 2. SWR wrappers (`hooks/swr/api/rest`)

- `useGetLessonQuizzesSwr(lessonId | null)` — key `["lesson-quizzes", lessonId]`, disabled
  khi null.
- `useGetMyQuizAttemptsSwr(quizId | null)` — key `["quiz-attempts-me", quizId]`.
- 4 mutation hook sẵn có (`usePostStartQuizAttemptSwr`, `usePostSubmitQuizAttemptSwr`,
  `usePostSubmitAssignmentSwr`, `usePostSubmitChallengeSwr`) GIỮ NGUYÊN signature — chỉ wire
  vào component; sau submit `mutate` các key liên quan (`lesson-quizzes`, `quiz-attempts-me`,
  `assignment-submissions`, `challenge-submissions`).

## 3. Quiz trong learn shell (`LessonReader`)

- `useQueryLearnLessonSwr` đã đọc `GET /lessons/{id}/content` → map thêm
  `hasQuiz`/`quizId` (mirror cách `hasChallenge` đang map, bỏ TODO fallback dòng 160 khi BE
  trả field mới).
- Block mới `LessonQuizBlock` (component con của LessonReader, render khi `hasQuiz`):
  - Trạng thái nghỉ: card tựa đề + `questionCount` + best score (`useGetLessonQuizzesSwr`)
    + nút "Làm quiz" / "Làm lại" (disable khi `maxAttempts` chạm trần — BE vẫn là nguồn chân lý).
  - Bấm làm → `usePostStartQuizAttemptSwr(quizId)` → nhận `QuizAttemptStartView{attemptId,
    questions[]}` → view làm bài in-place (không route mới): đếm ngược `timeLimitSeconds`
    (hết giờ = auto submit), chọn đáp án SINGLE/MULTIPLE/TRUE_FALSE theo `type`.
  - Submit → `usePostSubmitQuizAttemptSwr(attemptId, {answers})` → view kết quả
    (`scorePercent`, `passed`) + lịch sử (`useGetMyQuizAttemptsSwr`).
  - Lỗi 403 `COURSE_ACCESS_DENIED` → nhường chỗ cho paywall/enroll CTA sẵn có (luật
    premium-unlock = enroll khóa, KHÔNG "VIP").

## 4. Assignment trong learn shell

- Block `LessonAssignmentBlock` (render khi `getLessonAssignments(lessonId)` khác rỗng —
  hook query mới `useGetLessonAssignmentsSwr` nếu chưa có, kiểm barrel trước):
  - Mỗi assignment: title + question (markdown) + input GitHub URL (validate `https://`
    client-side, mirror ràng buộc BE `SubmitAssignmentRequest`) + đếm
    `submissionAttempt/maxSubmissions`.
  - Submit → `usePostSubmitAssignmentSwr` → optimistic thêm dòng PENDING vào lịch sử;
    lịch sử từ `getMyAssignmentSubmissions` (status/aiScore/evaluation — điểm do
    repo-grader lane AI trả về BE, FE chỉ đọc).

## 5. Challenge submission thật (`ChallengeSubmission/`)

- Route giữ nguyên `.../contents/[contentId]/challenges/[challengeId]`; `LessonReader`
  build href bằng `challengeId` THẬT từ lesson payload (xóa mock `${contentId}-c` dòng 55).
- `useQueryChallengeSubmissionSwr` viết lại: fetch song song
  `getChallengeBySlug(challengeId)` (BE fallback by-id) + `getMyChallengeSubmissions(id)`;
  map sang view model theo `ChallengeView.type`:
  - `MULTIPLE_CHOICE`: render `mcqQuestions` (KHÔNG có correctKeys — taker-safe) → submit
    `{payloadType:"MCQ", answers}`.
  - `CODE`: textarea/editor + chọn `language` → `{payloadType:"CODE", code, language}`;
    hoặc URL repo `{payloadType:"URL", url}` theo UI.
  - `ESSAY`: textarea dài → `{payloadType:"ESSAY", essayText}`.
- Kết quả: list submission (`attemptNo`, `status`, `autoScore/manualScore/finalScore`) +
  chi tiết `getChallengeSubmissionResults` (poll SWR `refreshInterval` 5s khi còn
  PENDING/GRADING — điểm AI về async từ lane ftes-ai-service qua BE).
- Model/grader picker mock (GraderOption) BỎ — chọn model chấm là việc admin/ai-service,
  không phải learner (đã có change `ai-code-grading-model-picker` riêng nếu cần).

### 5.1 Kho challenge theo course (BE change `course-challenge-bank`)

- BE thêm `courseId`/`visibility` vào `ChallengeView` (additive) và guard challenge
  `COURSE_ONLY`: detail/submit trả **403 `CHALLENGE_COURSE_ACCESS_DENIED`** kèm
  `data.courseId` khi caller CHƯA enroll course. FE:
  - `ChallengeView` type thêm `courseId?: string | null`, `visibility?: string` (optional
    — không vỡ khi BE cũ).
  - `useQueryChallengeSubmissionSwr`/`ChallengeSubmission`: bắt lỗi 403 code
    `CHALLENGE_COURSE_ACCESS_DENIED` → render CTA **enroll khóa** (route course detail
    theo `data.courseId`; luật premium-unlock = enroll, KHÔNG "VIP") thay vì error chung.
  - Learner đã enroll: không đổi gì — challenge kho gắn lesson mở bình thường qua
    `hasChallenge`/`challengeId` của lesson payload.
- **Trang `/challenges` (`ChallengeCatalog`) + Workplace practice (subjectWorkspace) KHÔNG
  cần sửa code list**: BE đã lọc server-side (chỉ trả `WORKSPACE_PUBLIC` hoặc challenge
  không thuộc course) — FE list nguyên trạng, chỉ verify lại bằng seed V215 (thấy
  `demo-bank-mcq-c-arrays` public, KHÔNG thấy 3 challenge COURSE_ONLY).

## 6. Gỡ route legacy

- Xóa: `src/app/[locale]/courses/[courseId]/lessons/`, `.../quiz/`, `.../assignments/`
  (3 page mock). Trong `[courseId]/lessons/[lessonId]` thay bằng `redirect` (Next
  `permanentRedirect`) sang `/courses/[courseId]/learn/content` để link cũ không 404 —
  quyết định: GIỮ file page chỉ-redirect thay vì xóa trắng.
- Xóa component `CourseLesson/`, `CourseQuiz/`, `CourseAssignments/` + hooks mock
  `useQueryQuizSwr.ts`, `useQueryAssignmentsSwr.ts`, `useQueryLessonSwr.ts`; quét import
  còn sót bằng `tsc --noEmit`.

## 7. i18n

`learn.exercises.{quizTitle,startQuiz,retakeQuiz,questionsCount,timeLeft,submitQuiz,
passed,failed,bestScore,attemptsHistory,assignmentTitle,submissionUrlPlaceholder,
submitAssignment,attemptsUsed,challengeSubmit,essayPlaceholder,codeLanguage,
gradingPending,gradedBy,accessDenied}` — vi + en.

## 8. Dependency & thứ tự

1. BE `course-learn-contract-gaps` + `course-demo-seed-dev` deploy apitest trước.
2. Change này implement sau, verify trên seed demo (course `seed-course-c-basic`).
3. Chấm AI essay/code: **dependency lane AI** — spec này KHÔNG định nghĩa contract chấm,
   chỉ đọc score từ BE submission results.
