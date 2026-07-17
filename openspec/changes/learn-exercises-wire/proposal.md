# Learn exercises wire (quiz + assignment + challenge thật trong learn shell, gỡ route legacy)

## Why

Bài tập per-lesson của learner hiện là mock 100% dù BE đã LIVE tại `https://apitest.ftes.vn/api/v1`:

- `useQueryQuizSwr` / `useQueryAssignmentsSwr` / `useQueryLessonSwr`
  (`components/features/course/hooks/`) trả sample cứng; route legacy
  `/courses/[courseId]/lessons/[lessonId]|/quiz|/assignments` mount đúng các component mock
  đó (`CourseLesson`/`CourseQuiz`/`CourseAssignments`) — trải nghiệm học thật đã nằm TRONG
  learn shell (`/courses/[courseId]/learn/...`), route legacy chỉ gây lạc lối.
- Trang nộp challenge trong learn (`ChallengeSubmission/` + `useQueryChallengeSubmissionSwr`)
  mock toàn bộ, kể cả href mock `${contentId}-c` (`LessonReader/index.tsx:55`).
- 4 mutation hook đã viết nhưng **0 component gọi**: `usePostSubmitAssignmentSwr`,
  `usePostStartQuizAttemptSwr`, `usePostSubmitQuizAttemptSwr`, `usePostSubmitChallengeSwr`.
- `SubmitRequest` của challenge FE (`modules/api/rest/challenges/types.ts:127`) thiếu
  `answers` + `essayText` mà BE đã nhận (V194 — ChallengeViews.SubmitRequest).

BE bổ sung contract quiz-by-lesson + challenge by-id ở change BE `course-learn-contract-gaps`.

## What Changes

- **REST layer**: thêm `getLessonQuizzes`, `getMyQuizAttempts` (course) + type
  `QuizSummaryView`/`QuizAttemptHistoryView`; mở rộng challenge `SubmitRequest`
  (`answers?: Record<string, Array<string>>`, `essayText?: string` — optional để không vỡ
  call-site cũ); `LessonContentView`/lesson types thêm `hasQuiz`/`quizId`/`challengeId`.
- **SWR wrappers**: `useGetLessonQuizzesSwr`, `useGetMyQuizAttemptsSwr` (queries) + barrel.
- **Quiz trong learn shell**: block "Quiz" trong `LessonReader` khi `hasQuiz` — dùng
  `usePostStartQuizAttemptSwr` → màn làm bài (đếm giờ, chọn đáp án) →
  `usePostSubmitQuizAttemptSwr` → kết quả + lịch sử attempt.
- **Assignment trong learn shell**: block "Bài tập nộp GitHub" — `getLessonAssignments`
  (sẵn có) + `usePostSubmitAssignmentSwr` + `getMyAssignmentSubmissions` (lịch sử + điểm AI).
- **Challenge submission thật**: `ChallengeSubmission/` bỏ mock — load challenge theo
  `challengeId` thật từ lesson payload (`getChallengeBySlug` với id, BE fallback),
  submit MCQ answers / code / essay theo `ChallengeView.type`, lịch sử
  `getMyChallengeSubmissions` + `getChallengeSubmissionResults`; sửa href mock `-c`;
  gate MỌI entry point theo `challengeId` thật (kể cả nút "Practice this lesson" của
  rail `OnThisPage` hiện render vô điều kiện) — bài không có challenge ACTIVE thì không
  hiện nút/tab thử thách ở đâu cả (BE `course-learn-contract-gaps` đảm bảo cờ chỉ ACTIVE).
- **Kho challenge theo course** (BE `course-challenge-bank`): `ChallengeView` thêm
  `courseId?`/`visibility?`; 403 `CHALLENGE_COURSE_ACCESS_DENIED` → CTA enroll khóa
  (data.courseId); `/challenges` + workplace practice giữ nguyên code list (BE lọc
  server-side chỉ trả WORKSPACE_PUBLIC / challenge không thuộc course).
- **Gỡ route legacy**: xóa 3 page `/courses/[courseId]/lessons/[lessonId]`, `/quiz`,
  `/assignments` (redirect về learn shell), xóa `CourseLesson`/`CourseQuiz`/
  `CourseAssignments` + 3 hook mock.
- **i18n** `learn.exercises.*` (vi+en).

## Capabilities

### New Capabilities
- `learn-quiz-taking`: làm quiz thật theo lesson trong learn shell.
- `learn-assignment-submission`: nộp assignment GitHub URL + xem lịch sử chấm.
- `learn-challenge-submission`: nộp challenge MCQ/CODE/ESSAY thật.
- `legacy-course-routes-removal`: gỡ route + component + hook mock legacy.

## Impact

- Affected code: `src/modules/api/rest/{course,challenges}/*`, `src/hooks/swr/api/rest/*`,
  `src/components/features/learn/{LessonReader,ChallengeSubmission}/*`,
  `src/app/[locale]/courses/[courseId]/{lessons,quiz,assignments}/*` (xóa),
  `src/components/features/course/{CourseLesson,CourseQuiz,CourseAssignments,hooks}/*` (xóa),
  `src/messages/{vi,en}.json`.
- Phụ thuộc BE: change `course-learn-contract-gaps` deploy trước (quiz-by-lesson GET,
  challenge by-id); phần kho challenge phụ thuộc BE `course-challenge-bank` (403
  COURSE_ACCESS_DENIED + filter public server-side + seed V215). Chấm AI essay/code do **lane AI (ftes-ai-service)** — FE chỉ hiển thị
  score/feedback từ submission results, KHÔNG gọi ai-service trực tiếp.
- Verify: `npm run build` (webpack) xanh + `tsc --noEmit` sạch.
