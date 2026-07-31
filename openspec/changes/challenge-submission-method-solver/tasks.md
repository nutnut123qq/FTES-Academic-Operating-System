# Tasks — challenge-submission-method-solver

## 1. Type + REST contract
- [x] 1.1 `challenges/types.ts`: thêm `submissionMethod?: string | null` vào `ChallengeView` (optional, additive; JSDoc GITHUB|FILE|BOTH)
- [x] 1.2 `challenges/challenges.ts`: thêm `submitChallengeFile(id, file)` — multipart `POST /api/v1/challenges/{id}/submissions/file`, part `file`, `Content-Type: null` (mirror `submitAssignmentFile`), trả `SubmissionView`

## 2. Hook FILE
- [x] 2.1 `usePostSubmitChallengeFileSwr.ts`: `useSWRMutation<SubmissionView, Error, string, {id, file}>` gọi `submitChallengeFile` (mirror `usePostSubmitAssignmentFileSwr`)

## 3. Helper dùng chung (DRY, không đổi hành vi)
- [x] 3.1 Thêm `features/learn/submissionMethods.ts`: `SubmitMethod`, `isHttpsUrl`, `parseSubmitMethods`, `parseFileExtensions`, `fileMatchesExtensions` (tách từ `LessonAssignmentBlock`) + `hasSubmissionMethod` + `parseGradingConfigFileExtension`
- [x] 3.2 `LessonAssignmentBlock/index.tsx`: bỏ định nghĩa local, import từ `submissionMethods` — giữ nguyên `AssignmentCard`, 2 form, gate `useGetLessonAssignmentsSwr` (KHÔNG gỡ surface)

## 4. Solver
- [x] 4.1 `ChallengeSubmission/ChallengeMethodSolver.tsx`: port 2 form của `AssignmentCard` (github-URL + file-upload) tôn trọng method; URL→`usePostSubmitChallengeSwr` (`payloadType:"URL"`), FILE→`usePostSubmitChallengeFileSwr`; validate đuôi từ `parseGradingConfigFileExtension(gradingConfig)`; `reachedMax`→khoá; `onSubmitted` revalidate
- [x] 4.2 `ChallengeSubmission/index.tsx`: `usesSubmissionMethod = hasSubmissionMethod(challenge?.submissionMethod)`; nhánh `kind==="code"` → `ChallengeMethodSolver` khi có method, ngược lại `GradeCodePanel` như cũ; lịch sử + chip đếm giữ nguyên

## 5. i18n
- [x] 5.1 Dùng lại key `learn.exercises.assignment.*` sẵn có — KHÔNG thêm key mới (vi + en đã mirror)

## 6. Verify
- [x] 6.1 `node_modules/.bin/tsc --noEmit` → exit 0
- [x] 6.2 `node_modules/.bin/vitest run src/components/features/learn/ChallengeSubmission` → xanh (thêm 1 test dispatch method-solver)
