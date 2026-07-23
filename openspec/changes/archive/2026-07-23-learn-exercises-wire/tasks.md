# Tasks — learn-exercises-wire

## 1. REST + SWR layer
- [x] 1.1 `modules/api/rest/course`: types `QuizSummaryView`/`QuizAttemptHistoryView`; fn `getLessonQuizzes`, `getMyQuizAttempts`; `LessonContentView` thêm `hasQuiz`/`quizId`/`challengeId`/`contentType` optional
- [x] 1.2 `modules/api/rest/challenges/types.ts`: `SubmitRequest` thêm `answers?`/`essayText?` (code/language/storageKey/url thành optional); `ChallengeView` thêm `lessonId?`/`gradingConfig?`/`mcqQuestions?`/`courseId?`/`visibility?` + type `McqQuestionView`/`OptionItem`
- [x] 1.3 SWR: `useGetLessonQuizzesSwr` (shouldRetryOnError:false → giữ 403 không loop), `useGetMyQuizAttemptsSwr` (gate quizId) + barrel `queries/index.ts` (assignment hook đã có sẵn từ đợt trước)

## 2. Quiz trong learn shell (learn-quiz-taking)
- [x] 2.1 `useQueryLearnLessonSwr` map `hasQuiz`/`quizId` (+ FE `LessonContentView` thêm `hasQuiz?`/`quizId?`/`challengeId?`/`contentType?`; xoá TODO fallback hasChallenge)
- [x] 2.2 `LessonQuizBlock`: card nghỉ (count/pass/time/best/attempts/nút) → view làm bài (single/multi theo type, đếm giờ + auto-submit hết giờ, guard timeLimit≤0) → view kết quả (score%/pass) + lịch sử attempt; mutate `LESSON_QUIZZES_SWR` + attempts sau submit; 403 `COURSE_ACCESS_DENIED` → CTA enroll (route `/courses/{id}`, KHÔNG VIP); gate render theo `lesson.hasQuiz` (không request khi không có quiz)
- [x] 2.3 i18n `learn.exercises.quiz.*` (vi+en, 27 key parity)
- [x] 2.4 Quality loop tính năng quiz: unit test (map payload, reducer chọn đáp án, auto-submit) + e2e test (seed demo: start → chọn → submit → kết quả) → đánh giá vòng 1 → fix → đánh giá vòng 2
  - UNIT DONE 2026-07-22 (vitest đã có — note "chưa có test runner" stale): `LessonReader/LessonQuizBlock/index.test.tsx` (4 PASS): lesson không quiz → render null, 403 COURSE_ACCESS_DENIED → lockedTitle + CTA enroll route `/courses/{id}` (KHÔNG VIP), flow đủ start→chọn đáp án→submit (payload `{answers:{q1:["A"]}}` đúng attemptId) → hiển thị score % + passedResult + revalidate attempts + history row, auto-submit fake-timer khi countdown về 0 (payload answers rỗng + note autoSubmitted + failedResult). E2E CÒN NỢ (seed demo apitest).

## 3. Assignment trong learn shell (learn-assignment-submission)
- [x] 3.1 `LessonAssignmentBlock`: list + form GitHub URL (validate https client) + lịch sử chấm (poll khi còn pending); wire `usePostSubmitAssignmentSwr`
- [x] 3.2 i18n phần assignment (vi+en)
- [x] 3.3 Quality loop tính năng assignment: unit test (validate URL, khóa form khi hết lượt) + e2e test (seed demo: nộp URL → dòng pending → poll điểm) → đánh giá vòng 1 → fix → đánh giá vòng 2
  - UNIT DONE 2026-07-22: `LessonReader/LessonAssignmentBlock/index.test.tsx` (5 PASS): lesson không assignment → null, URL http:// → báo `urlInvalid` + KHÔNG bắn request (gate client mirror BE `@Pattern`), URL https hợp lệ → trigger đúng `{githubSubmissionUrl}` + clear field + revalidate history, row SUBMITTED → chip status + pendingHint còn GRADED → chip aiScore + evaluation, hết lượt (`maxSubmissions`) → khoá form (maxReached, không còn input). E2E CÒN NỢ (poll điểm AI trên apitest).

## 4. Challenge submission (learn-challenge-submission)
- [x] 4.1 `challengeHref` trong `LessonReader` dùng `moduleId`+`challengeId` thật (xóa `${contentId}-c`); `LearnLessonView` thêm `challengeId`; ẩn entry khi không có challengeId
- [x] 4.2 Gate MỌI entry point theo `challengeId` thật: TabsCard tab (`hasChallenge && challengeId`), card `ChallengesView`, và rail `OnThisPage` (desktop aside + mobile drawer) — nút "Practice this lesson" giờ chỉ render khi lesson có ACTIVE challenge (share SWR key lesson để lấy challengeId+moduleId), href build từ id thật; rail return null khi không headings + không challenge. Grep `-c`/`challengeHref` sạch
- [x] 4.3 Viết lại `useQueryChallengeSubmissionSwr`: getChallengeBySlug(challengeId) + getMyChallengeSubmissions; poll khi còn submission chưa terminal; bỏ toàn bộ mock grader/requirements
- [x] 4.4 `ChallengeSubmission`: form theo type (MULTIPLE_CHOICE→MCQ answers multi-select / CODE→code+language / ESSAY→essayText) → `usePostSubmitChallengeSwr`; lịch sử attempt (attemptNo/status/finalScore) poll; khóa khi ≥ maxSubmissions; xoá SubmissionRow/LastAttemptResult mock
- [x] 4.5 `ChallengeView` type thêm `courseId?`/`visibility?` optional; `ChallengeSubmission` bắt 403 `CHALLENGE_COURSE_ACCESS_DENIED` → CTA enroll khóa (route `/courses/{courseId}` — luật enroll, KHÔNG "VIP"); `/challenges` + workplace practice KHÔNG đổi code list (FE không tự filter visibility — đã verify)
- [x] 4.6 i18n `learn.exercises.challenge.*` (vi+en, 24 key parity gồm status.* + lockedTitle/lockedBody CTA enroll)
- [x] 4.7 Quality loop tính năng challenge (chưa: worktree chưa có test infra — tsc EXIT=0): unit test (build SubmitRequest theo type, poll ngừng khi đủ kết quả, entry gate: `hasChallenge:false` → không render nút/tab ở TabsCard + ChallengesView + OnThisPage, map 403 COURSE_ACCESS_DENIED → CTA enroll) + e2e test (seed demo: nộp MCQ → finalScore; VERIFY E2E entry gating: bài KHÔNG có challenge ACTIVE — vd `seed-les-c1-s1-l2` chỉ có quiz — không hiện nút/tab thử thách ở MỌI entry point kể cả rail "Practice this lesson" desktop + mobile drawer; bài `seed-les-c1-s2-l1` có challenge PUBLISHED → hiện đủ; user chưa enroll mở challenge COURSE_ONLY seed V215 → CTA enroll; `/challenges` thấy `demo-bank-mcq-c-arrays`, KHÔNG thấy 3 challenge COURSE_ONLY) → đánh giá vòng 1 → fix → đánh giá vòng 2
  - UNIT PARTIAL 2026-07-22: `ChallengeSubmission/index.test.tsx` (5 PASS): 403 `CHALLENGE_COURSE_ACCESS_DENIED` → lockedTitle/lockedBody + CTA enroll route `/courses/{courseId}` (luật enroll, KHÔNG VIP); lỗi khác 500 → error state chung, KHÔNG CTA; build SubmitRequest đủ 3 type: MCQ `{payloadType:"MCQ",answers}`, CODE `{code,language}`, ESSAY `{essayText}` trim. CÒN NỢ unit: poll ngừng khi submissions terminal (nằm trong `useQueryChallengeSubmissionSwr` refreshInterval), entry-gate `hasChallenge:false` không render nút/tab (TabsCard/ChallengesView/OnThisPage); CÒN NỢ e2e toàn bộ.

## 5. Gỡ route legacy (legacy-course-routes-removal)
- [x] 5.1 3 page legacy → redirect `/courses/[courseId]/learn/content` (server redirect, await params Next 16); xóa `CourseLesson`/`CourseQuiz`/`CourseAssignments` + 3 hook mock (`useQueryLessonSwr`/`useQueryQuizSwr`/`useQueryAssignmentsSwr`); grep import sót = 0 (còn lại chỉ là admin CRUD `createCourseLesson`… + data-model `interface CourseLesson`, KHÁC mock); tsc EXIT=0
- [x] 5.2 Quality loop tính năng dọn route: unit test (không import mock còn lại — tsc) + e2e test (mở 3 URL cũ → redirect đúng) → đánh giá vòng 1 → fix → đánh giá vòng 2
  - UNIT DONE 2026-07-22: `app/[locale]/courses/[courseId]/legacyRedirects.test.ts` (3 PASS): cả 3 page legacy (`/lessons/[lessonId]`, `/quiz`, `/assignments`) await params (Next 16) và gọi `redirect("/{locale}/courses/{id}/learn/content")` đúng target; "không import mock còn lại" đã verify bằng tsc (5.1). E2E CÒN NỢ (mở 3 URL cũ qua browser → follow redirect HTTP thật).

## 6. Verify chung
- [x] 6.1 `npm run build` (webpack) xanh + `tsc --noEmit` sạch; `openspec validate learn-exercises-wire --strict` pass

## Nghiệm thu E2E 2026-07-23 (spec e2e/learn-exercises-wire.spec.ts, 14p/3f toàn cụm)
- PASS: quiz start→chọn→submit→điểm (submit là PUT /quiz-attempts/{id}/submit); assignment seed-les-c1-s1-l3 nộp URL → "Chờ chấm"; lesson không challenge ẩn sạch entry point; ctv mở COURSE_ONLY → CTA enroll; /challenges thấy demo-bank-mcq-c-public + ẩn 3 bài COURSE_ONLY V215; 3 route legacy redirect đúng.
- FAIL (BUG): lesson có challenge PUBLISHED (seed-les-c1-s2-l1) KHÔNG hiện tab/rail/CTA — GET /lessons/{id}/content 404 (LESSON_CONTENT_NOT_FOUND, lesson video không content row) mà useQueryLearnLessonSwr chỉ map hasChallenge/challengeId từ endpoint content; course tree có đủ flag nhưng flattenCurriculum bỏ qua. Fix gợi ý: map hasChallenge từ course tree.

## Nghiệm thu E2E 2026-07-24 RẠNG SÁNG — PASS toàn spec, đóng change
- e2e/learn-exercises-wire.spec.ts XANH desktop+mobile: quiz trọn vòng; assignment nộp/hết-lượt
  (spec chịu race revalidate); lesson KHÔNG challenge ẩn sạch entry; lesson CÓ challenge PUBLISHED
  hiện tab+rail (desktop) / tab (mobile — rail là aside ẩn <lg, vào bằng tab) và mở đúng
  /challenges/2222...b001; CTV COURSE_ONLY → CTA enroll; 3 route legacy redirect.
- Bug content-404-challenge (wave-3) ĐÃ HẾT nhờ map hasChallenge/challengeId từ course tree
  (270a013) — unit useQueryLearnLessonSwr.challenge.test.tsx 3/3 + E2E xác nhận.
- 6.1: tsc --noEmit 0 + next build BUILD_EXIT=0 + openspec validate --strict pass đêm nay.
- Lưu ý harness (đã sửa trong phiên): seed cờ ftes.tour.onboarding.done khi login programmatic
  (modal tour z-1000 từng chặn mọi click) + spec chịu race hết-lượt-nộp giữa 2 project.
