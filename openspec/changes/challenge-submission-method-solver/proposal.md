# challenge-submission-method-solver — Bộ giải github/file cho CODE challenge trên trang giải riêng

## Why
Theo lộ trình gộp Assignment → CODE Challenge (giải bài chuyển hẳn về route giải challenge),
một `CODE` challenge có thể mang `submissionMethod` (`GITHUB|FILE|BOTH`) — tức phải nộp bằng URL
repo GitHub và/hoặc upload file để AI chấm, ĐÚNG như bài tập (assignment) trước đây làm inline trong
trang đọc. Trang giải challenge (`ChallengeSubmission`) hiện chỉ có `GradeCodePanel` (editor code
inline) cho nhánh `code` — chưa có bề mặt nộp github/file. Phase này CHỈ **thêm** năng lực đó; việc
gỡ bề mặt assignment inline (`LessonAssignmentBlock` + gate `useGetLessonAssignmentsSwr`) để sau khi
migrate dữ liệu (phase dọn dẹp riêng), nên PR này KHÔNG đụng tới nó (transition-safe: bài chưa migrate
vẫn chạy).

## What Changes
- **Type** — thêm `submissionMethod?: "GITHUB"|"FILE"|"BOTH"|null` (optional, additive) vào
  `ChallengeView` (`src/modules/api/rest/challenges/types.ts`). BE nay trả field này trên challenge;
  BE cũ vắng field → coi như không có method (giữ editor inline). `gradingConfig` (đã có) mang whitelist
  `fileExtension` cho nhánh FILE.
- **REST client + hook FILE** — thêm `submitChallengeFile(id, file)` (multipart
  `POST /api/v1/challenges/{id}/submissions/file`, part `file`, `Content-Type: null` để trình duyệt tự
  set boundary) mirror `submitAssignmentFile`; thêm hook `usePostSubmitChallengeFileSwr` (4 generic,
  `usePost*`) mirror `usePostSubmitAssignmentFileSwr`. URL vẫn dùng `usePostSubmitChallengeSwr` sẵn có
  với `payloadType:"URL"`.
- **Helper dùng chung** — tách các hàm thuần `isHttpsUrl` / `parseSubmitMethods` / `parseFileExtensions`
  / `fileMatchesExtensions` (đang ở `LessonAssignmentBlock`) ra `src/components/features/learn/submissionMethods.ts`,
  thêm `hasSubmissionMethod` (raw là GITHUB|FILE|BOTH?) và `parseGradingConfigFileExtension`
  (đọc `fileExtension` từ JSON `gradingConfig`). `LessonAssignmentBlock` import lại từ đây (DRY, KHÔNG
  đổi hành vi, KHÔNG gỡ surface/gate).
- **Solver** — component mới `ChallengeMethodSolver` (colocate trong `ChallengeSubmission/`) port 2 form
  của `AssignmentCard` (github-URL + file-upload), tôn trọng method: `GITHUB`→chỉ URL, `FILE`→chỉ file,
  `BOTH`→cả hai (tab). URL → `usePostSubmitChallengeSwr` (`payloadType:"URL"`); FILE →
  `usePostSubmitChallengeFileSwr`. Dùng lại validate đuôi file từ `gradingConfig.fileExtension`.
- **Dispatch** — trong `ChallengeSubmission`, nhánh `kind==="code"`: nếu `hasSubmissionMethod(challenge.submissionMethod)`
  → render `ChallengeMethodSolver`; nếu không → giữ nguyên `GradeCodePanel` inline như hiện tại. Lịch sử nộp
  (đếm + `getMyChallengeSubmissions`) vẫn do `ChallengeSubmission` sở hữu; solver gọi `onSubmitted` để
  revalidate.
- **i18n** — dùng lại nguyên các key `learn.exercises.assignment.*` (urlLabel, tabGithub/tabFile, fileCta,
  fileHint/fileHintAny, fileWrongType, submit/submitFile, maxReached, submitted…) — KHÔNG cần key mới.

## Impact
FE-only. Thêm: `submissionMethods.ts`, `ChallengeMethodSolver.tsx`, `usePostSubmitChallengeFileSwr.ts`,
`submitChallengeFile`. Sửa: `challenges/types.ts` (+field), `ChallengeSubmission/index.tsx` (dispatch),
`LessonAssignmentBlock/index.tsx` (import helper chung — không đổi hành vi). KHÔNG gỡ `LessonAssignmentBlock`
/ gate `useGetLessonAssignmentsSwr` (phase sau). BE-contract giả định: route FILE
`POST /api/v1/challenges/{id}/submissions/file` + `submissionMethod` trên challenge + `fileExtension` trong
`gradingConfig` (lane BE anh em bổ sung). `tsc --noEmit` sạch; test `ChallengeSubmission` giữ xanh.
