# Tasks — learn-exercises-wire

## 1. REST + SWR layer
- [ ] 1.1 `modules/api/rest/course`: types `QuizSummaryView`/`QuizAttemptHistoryView`; fn `getLessonQuizzes`, `getMyQuizAttempts`; `LessonContentView` thêm `hasQuiz`/`quizId`/`challengeId` optional
- [ ] 1.2 `modules/api/rest/challenges/types.ts`: `SubmitRequest` thêm `answers?`/`essayText?`; đối chiếu `ChallengeView` với BE (lessonId/gradingConfig/mcqQuestions)
- [ ] 1.3 SWR: `useGetLessonQuizzesSwr`, `useGetMyQuizAttemptsSwr` (+ `useGetLessonAssignmentsSwr` nếu chưa có — kiểm barrel trước) + barrels

## 2. Quiz trong learn shell (learn-quiz-taking)
- [ ] 2.1 `useQueryLearnLessonSwr` map `hasQuiz`/`quizId` (bỏ TODO fallback hasChallenge dòng 160 khi BE mới)
- [ ] 2.2 `LessonQuizBlock`: card nghỉ (count/best/nút) → view làm bài (đếm giờ, auto-submit hết giờ) → view kết quả + lịch sử; mutate keys sau submit; 403 → CTA enroll
- [ ] 2.3 i18n `learn.exercises.*` phần quiz (vi+en)
- [ ] 2.4 Quality loop tính năng quiz: unit test (map payload, reducer chọn đáp án, auto-submit) + e2e test (seed demo: start → chọn → submit → kết quả) → đánh giá vòng 1 → fix → đánh giá vòng 2

## 3. Assignment trong learn shell (learn-assignment-submission)
- [ ] 3.1 `LessonAssignmentBlock`: list + form GitHub URL (validate https client) + lịch sử chấm (poll khi còn pending); wire `usePostSubmitAssignmentSwr`
- [ ] 3.2 i18n phần assignment (vi+en)
- [ ] 3.3 Quality loop tính năng assignment: unit test (validate URL, khóa form khi hết lượt) + e2e test (seed demo: nộp URL → dòng pending → poll điểm) → đánh giá vòng 1 → fix → đánh giá vòng 2

## 4. Challenge submission (learn-challenge-submission)
- [ ] 4.1 Sửa `challengeHref` trong `LessonReader` dùng `challengeId` thật (xóa `${contentId}-c`); ẩn entry khi không có challengeId
- [ ] 4.2 Rà MỌI entry point challenge, gate theo `challengeId` thật: TabsCard `LessonReader:252` (đã gate `hasChallenge` — giữ), card `ChallengesView`, và ĐẶC BIỆT rail `OnThisPage` (desktop aside + bản mobile drawer) — nút "Practice this lesson" hiện render VÔ ĐIỀU KIỆN với href mock `${contentId}-c` (`OnThisPage/index.tsx:23,71-82`) → chỉ render khi lesson có challenge ACTIVE, href build từ `challengeId`; grep `challengeHref`/`-c` quét chỗ sót
- [ ] 4.3 Viết lại `useQueryChallengeSubmissionSwr`: getChallengeBySlug(id) + getMyChallengeSubmissions; bỏ grader-picker mock
- [ ] 4.4 `ChallengeSubmission`: form theo type (MCQ/CODE/ESSAY) → `usePostSubmitChallengeSwr`; results poll `getChallengeSubmissionResults`; khóa khi hết maxSubmissions
- [ ] 4.5 Kho challenge theo course (BE `course-challenge-bank`): `ChallengeView` type thêm `courseId?`/`visibility?` optional; `ChallengeSubmission` bắt 403 code `CHALLENGE_COURSE_ACCESS_DENIED` (data.courseId) → CTA enroll khóa (route course detail — luật enroll, KHÔNG "VIP"); `/challenges` + workplace practice KHÔNG đổi code list (BE lọc server-side chỉ trả WORKSPACE_PUBLIC / không-course)
- [ ] 4.6 i18n phần challenge (vi+en, gồm copy CTA enroll khi challenge thuộc kho course)
- [ ] 4.7 Quality loop tính năng challenge: unit test (build SubmitRequest theo type, poll ngừng khi đủ kết quả, entry gate: `hasChallenge:false` → không render nút/tab ở TabsCard + ChallengesView + OnThisPage, map 403 COURSE_ACCESS_DENIED → CTA enroll) + e2e test (seed demo: nộp MCQ → finalScore; VERIFY E2E entry gating: bài KHÔNG có challenge ACTIVE — vd `seed-les-c1-s1-l2` chỉ có quiz — không hiện nút/tab thử thách ở MỌI entry point kể cả rail "Practice this lesson" desktop + mobile drawer; bài `seed-les-c1-s2-l1` có challenge PUBLISHED → hiện đủ; user chưa enroll mở challenge COURSE_ONLY seed V215 → CTA enroll; `/challenges` thấy `demo-bank-mcq-c-arrays`, KHÔNG thấy 3 challenge COURSE_ONLY) → đánh giá vòng 1 → fix → đánh giá vòng 2

## 5. Gỡ route legacy (legacy-course-routes-removal)
- [ ] 5.1 3 page legacy → redirect `/courses/[courseId]/learn/content`; xóa `CourseLesson`/`CourseQuiz`/`CourseAssignments` + 3 hook mock; quét import sót
- [ ] 5.2 Quality loop tính năng dọn route: unit test (không import mock còn lại — tsc) + e2e test (mở 3 URL cũ → redirect đúng) → đánh giá vòng 1 → fix → đánh giá vòng 2

## 6. Verify chung
- [ ] 6.1 `npm run build` (webpack) xanh + `tsc --noEmit` sạch; `openspec validate learn-exercises-wire --strict` pass
