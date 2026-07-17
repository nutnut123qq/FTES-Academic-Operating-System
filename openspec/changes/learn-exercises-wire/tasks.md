# Tasks — learn-exercises-wire

## 1. REST + SWR layer
- [x] 1.1 `modules/api/rest/course`: types `QuizSummaryView`/`QuizAttemptHistoryView`; fn `getLessonQuizzes`, `getMyQuizAttempts`; `LessonContentView` thêm `hasQuiz`/`quizId`/`challengeId`/`contentType` optional
- [x] 1.2 `modules/api/rest/challenges/types.ts`: `SubmitRequest` thêm `answers?`/`essayText?` (code/language/storageKey/url thành optional); `ChallengeView` thêm `lessonId?`/`gradingConfig?`/`mcqQuestions?`/`courseId?`/`visibility?` + type `McqQuestionView`/`OptionItem`
- [x] 1.3 SWR: `useGetLessonQuizzesSwr` (shouldRetryOnError:false → giữ 403 không loop), `useGetMyQuizAttemptsSwr` (gate quizId) + barrel `queries/index.ts` (assignment hook đã có sẵn từ đợt trước)

## 2. Quiz trong learn shell (learn-quiz-taking)
- [x] 2.1 `useQueryLearnLessonSwr` map `hasQuiz`/`quizId` (+ FE `LessonContentView` thêm `hasQuiz?`/`quizId?`/`challengeId?`/`contentType?`; xoá TODO fallback hasChallenge)
- [x] 2.2 `LessonQuizBlock`: card nghỉ (count/pass/time/best/attempts/nút) → view làm bài (single/multi theo type, đếm giờ + auto-submit hết giờ, guard timeLimit≤0) → view kết quả (score%/pass) + lịch sử attempt; mutate `LESSON_QUIZZES_SWR` + attempts sau submit; 403 `COURSE_ACCESS_DENIED` → CTA enroll (route `/courses/{id}`, KHÔNG VIP); gate render theo `lesson.hasQuiz` (không request khi không có quiz)
- [x] 2.3 i18n `learn.exercises.quiz.*` (vi+en, 27 key parity)
- [ ] 2.4 Quality loop tính năng quiz: unit test (map payload, reducer chọn đáp án, auto-submit) + e2e test (seed demo: start → chọn → submit → kết quả) → đánh giá vòng 1 → fix → đánh giá vòng 2

## 3. Assignment trong learn shell (learn-assignment-submission)
- [x] 3.1 `LessonAssignmentBlock`: list + form GitHub URL (validate https client) + lịch sử chấm (poll khi còn pending); wire `usePostSubmitAssignmentSwr`
- [x] 3.2 i18n phần assignment (vi+en)
- [ ] 3.3 Quality loop tính năng assignment: unit test (validate URL, khóa form khi hết lượt) + e2e test (seed demo: nộp URL → dòng pending → poll điểm) → đánh giá vòng 1 → fix → đánh giá vòng 2

## 4. Challenge submission (learn-challenge-submission)
- [x] 4.1 `challengeHref` trong `LessonReader` dùng `moduleId`+`challengeId` thật (xóa `${contentId}-c`); `LearnLessonView` thêm `challengeId`; ẩn entry khi không có challengeId
- [x] 4.2 Gate MỌI entry point theo `challengeId` thật: TabsCard tab (`hasChallenge && challengeId`), card `ChallengesView`, và rail `OnThisPage` (desktop aside + mobile drawer) — nút "Practice this lesson" giờ chỉ render khi lesson có ACTIVE challenge (share SWR key lesson để lấy challengeId+moduleId), href build từ id thật; rail return null khi không headings + không challenge. Grep `-c`/`challengeHref` sạch
- [x] 4.3 Viết lại `useQueryChallengeSubmissionSwr`: getChallengeBySlug(challengeId) + getMyChallengeSubmissions; poll khi còn submission chưa terminal; bỏ toàn bộ mock grader/requirements
- [x] 4.4 `ChallengeSubmission`: form theo type (MULTIPLE_CHOICE→MCQ answers multi-select / CODE→code+language / ESSAY→essayText) → `usePostSubmitChallengeSwr`; lịch sử attempt (attemptNo/status/finalScore) poll; khóa khi ≥ maxSubmissions; xoá SubmissionRow/LastAttemptResult mock
- [x] 4.5 `ChallengeView` type thêm `courseId?`/`visibility?` optional; `ChallengeSubmission` bắt 403 `CHALLENGE_COURSE_ACCESS_DENIED` → CTA enroll khóa (route `/courses/{courseId}` — luật enroll, KHÔNG "VIP"); `/challenges` + workplace practice KHÔNG đổi code list (FE không tự filter visibility — đã verify)
- [x] 4.6 i18n `learn.exercises.challenge.*` (vi+en, 24 key parity gồm status.* + lockedTitle/lockedBody CTA enroll)
- [ ] 4.7 Quality loop tính năng challenge (chưa: worktree chưa có test infra — tsc EXIT=0): unit test (build SubmitRequest theo type, poll ngừng khi đủ kết quả, entry gate: `hasChallenge:false` → không render nút/tab ở TabsCard + ChallengesView + OnThisPage, map 403 COURSE_ACCESS_DENIED → CTA enroll) + e2e test (seed demo: nộp MCQ → finalScore; VERIFY E2E entry gating: bài KHÔNG có challenge ACTIVE — vd `seed-les-c1-s1-l2` chỉ có quiz — không hiện nút/tab thử thách ở MỌI entry point kể cả rail "Practice this lesson" desktop + mobile drawer; bài `seed-les-c1-s2-l1` có challenge PUBLISHED → hiện đủ; user chưa enroll mở challenge COURSE_ONLY seed V215 → CTA enroll; `/challenges` thấy `demo-bank-mcq-c-arrays`, KHÔNG thấy 3 challenge COURSE_ONLY) → đánh giá vòng 1 → fix → đánh giá vòng 2

## 5. Gỡ route legacy (legacy-course-routes-removal)
- [x] 5.1 3 page legacy → redirect `/courses/[courseId]/learn/content` (server redirect, await params Next 16); xóa `CourseLesson`/`CourseQuiz`/`CourseAssignments` + 3 hook mock (`useQueryLessonSwr`/`useQueryQuizSwr`/`useQueryAssignmentsSwr`); grep import sót = 0 (còn lại chỉ là admin CRUD `createCourseLesson`… + data-model `interface CourseLesson`, KHÁC mock); tsc EXIT=0
- [ ] 5.2 Quality loop tính năng dọn route: unit test (không import mock còn lại — tsc) + e2e test (mở 3 URL cũ → redirect đúng) → đánh giá vòng 1 → fix → đánh giá vòng 2

## 6. Verify chung
- [ ] 6.1 `npm run build` (webpack) xanh + `tsc --noEmit` sạch; `openspec validate learn-exercises-wire --strict` pass
