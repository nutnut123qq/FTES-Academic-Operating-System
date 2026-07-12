# Design — course-ai-interview

## Context

- **Contract nguồn chân lý**: `AI-CONTRACT.md` §4.4. Endpoints BE (`/api/v1/ai/interview/...`):
  - `POST /templates` (lecturer sinh đề) — ngoài scope FE học viên; FE chỉ ĐỌC.
  - `GET /templates/{courseRef}` — lấy template/bộ đề của khóa.
  - `POST /attempts` (student bắt đầu làm bài) → trả `attemptId` + danh sách câu hỏi.
  - `POST /attempts/{id}/answers` — nộp đáp án 1 câu (MCQ chấm ngay; essay/oral chấm qua BE `/v2/interview/grade`).
  - `POST /attempts/{id}/finish` — tổng kết điểm + feedback.
  - Oral (vấn đáp): chat SSE session `feature=INTERVIEW_COURSE`, hỏi tuần tự, chấm cuối.
  - Question types: `ORAL`, `MCQ`, `ESSAY`. Câu hỏi: `{id, type, prompt, options?, answer_key?, rubric?, skill}` (answer_key/rubric KHÔNG lộ cho học viên). Chấm trả `{score, max, feedback, matched_points[]}`.
  - Envelope `{code,message,data}` (§6), `data` nullable.
- **Route pattern nhà**: `src/app/[locale]/courses/[courseId]/<x>/page.tsx` = client page mỏng `const Page = () => <Feature />`. Ví dụ `quiz/page.tsx` (đã đọc). → `interview/page.tsx` cùng khuôn.
- **Feature pattern**: `src/components/features/course/<Feature>/index.tsx` `"use client"`, dùng `useParams`, `useTranslations`, `useRouter` từ `@/i18n/navigation`, `AsyncContent` cho loading/empty/error, HeroUI components, phosphor icons.
- **REST pattern**: `src/modules/api/rest/<name>/<name>.ts` (axios `create({ baseURL: publicEnv().api.http })`) + `types.ts`; SWR wrapper `src/hooks/swr/api/rest/queries|mutations/` (query = `useSWR`, mutation = `useSWRMutation`, mirror `usePostAdminPresignedUrlSwr`).
- **Socket pattern cho oral**: mirror `useContentAiStream` — singleton socket, `ask`/`abort`, `activeRef` route theo `streamId`, `onDelta`/`onDone`. Nếu gateway oral dùng SSE `text/event-stream` (contract §2 `/v2/chat/completions stream`), FE có thể dùng `EventSource` thay socket; chọn khớp gateway lúc implement (spec để mở, hành vi hiển thị giống nhau: token stream vào bong bóng câu hỏi/phản hồi).
- **courseRef**: dùng `courseId` từ route (`useParams`) làm `courseRef` gửi BE (BE resolve ref → khóa). Nếu BE cần dạng ref khác → resolve lúc implement.
- **Canon**: no emoji, i18n vi+en, `npm run build` (webpack) + `tsc --noEmit` sạch.

## Goals / Non-Goals

**Goals**
- Học viên vào route cuối khóa, xem đề, bắt đầu, làm tuần tự 3 loại câu (MCQ/Essay/Oral), nộp, xem điểm + feedback.
- Mỗi loại câu có UI phù hợp; oral stream tuần tự.
- Tái dùng pattern REST/SWR/socket + AsyncContent + HeroUI.

**Non-Goals**
- KHÔNG dựng UI lecturer sinh đề (`POST /templates`) trong change này (FE học viên chỉ đọc template).
- KHÔNG sửa backend, KHÔNG định nghĩa lại endpoint.
- KHÔNG lộ `answer_key`/`rubric` cho học viên.
- KHÔNG chấm ở FE (chấm là việc BE); FE chỉ hiển thị điểm/feedback trả về.

## Decisions

### D1 — Orchestrator theo phase, giữ attemptId

- `CourseInterview/index.tsx` giữ state `phase: "setup" | "session" | "results"` + `attemptId: string | null` + `questions` (nhận từ start attempt).
- `setup → session`: `useMutateStartInterviewAttemptSwr({ courseRef })` thành công → set `attemptId` + `questions` + phase `session`.
- `session → results`: khi câu cuối nộp xong → `useMutateFinishInterviewAttemptSwr(attemptId)` → set kết quả → phase `results`.
- Toàn trang bọc `AsyncContent` cho tải template (setup) + trạng thái mutation (spinner khi start/finish).

### D2 — InterviewSetup

- `useQueryInterviewTemplateSwr(courseRef)` GET `/interview/templates/{courseRef}` → hiển thị: tiêu đề khóa, số câu mỗi loại (`counts.{oral,mcq,essay}`), độ khó, mô tả. Nếu template chưa có (BE chưa sinh) → empty state "Khóa chưa có bài vấn đáp" (`courseInterview.setup.empty`).
- Nút "Bắt đầu vấn đáp" (`variant="primary"`) → `startAttempt`. Disabled + spinner khi đang gọi.
- (Nếu template cho phép override counts/difficulty → form nhỏ; v1 chỉ hiển thị + bắt đầu, override defer.)

### D3 — InterviewSession: render 3 loại câu

- Thanh tiến độ (`ProgressMeter` block đã có) `current/total`. Điều hướng tuần tự: nộp câu hiện tại (`useMutateSubmitInterviewAnswerSwr({ attemptId, questionId, type, answer })`) rồi sang câu kế; MCQ nhận điểm ngay (hiển thị đúng/sai tùy BE trả), essay/oral chỉ xác nhận đã nộp (điểm ở finish).
- **`QuestionMcq`**: `prompt` + radiogroup `options` (HeroUI radiogroup, `role="radiogroup"`), chọn 1 → `answer = optionId`. A11y: mỗi option có label; keyboard mũi tên.
- **`QuestionEssay`**: `prompt` + `<textarea>` (HeroUI Input/textarea) → `answer = text`. Đếm ký tự tùy chọn.
- **`QuestionOral`**: `prompt` (câu hỏi vấn đáp) hiển thị dạng bong bóng; người học trả lời bằng textarea; dùng `useInterviewOralStream` để (a) nhận câu hỏi tuần tự stream vào bong bóng, (b) gửi câu trả lời, (c) nhận phản hồi/nhắc. Có nút "Trả lời tiếp theo". Oral chấm cuối (finish). `abort()` khi rời trang.
- Discriminated union theo `question.type` để chọn component (switch), fallback an toàn nếu type lạ.

### D4 — InterviewResults

- Sau finish: điểm tổng (`score`/`max` → vòng tròn hoặc `ProgressMeter`), rồi list từng câu: prompt (rút gọn), điểm câu, `feedback`, `matched_points` (chip/list). Loại câu gắn nhãn (MCQ/Essay/Oral).
- Nút "Về khóa học" (`router.push(/courses/${courseId})`) + (tùy chọn) "Làm lại" nếu BE cho phép nhiều attempt.

### D5 — Hooks + module REST

- `src/modules/api/rest/ai-interview/ai-interview.ts` + `types.ts`:
  ```ts
  type InterviewQuestionType = "ORAL" | "MCQ" | "ESSAY"
  interface InterviewQuestion { id: string; type: InterviewQuestionType; prompt: string; options?: Array<{ id: string; text: string }>; skill?: string }
  interface InterviewTemplate { courseRef: string; counts: { oral: number; mcq: number; essay: number }; difficulty: string; description?: string; hasQuestionSet: boolean }
  interface StartAttemptResult { attemptId: string; questions: Array<InterviewQuestion> }
  interface SubmitAnswerResult { score?: number; max?: number; feedback?: string; matchedPoints?: Array<string>; accepted: boolean }
  interface FinishAttemptResult { totalScore: number; totalMax: number; perQuestion: Array<{ questionId: string; type: InterviewQuestionType; prompt: string; score: number; max: number; feedback: string; matchedPoints: Array<string> }> }
  // getInterviewTemplate(courseRef) GET /ai/interview/templates/{courseRef}
  // startInterviewAttempt({courseRef}) POST /ai/interview/attempts
  // submitInterviewAnswer({attemptId, questionId, type, answer}) POST /ai/interview/attempts/{id}/answers
  // finishInterviewAttempt(attemptId) POST /ai/interview/attempts/{id}/finish
  ```
- SWR: `useQueryInterviewTemplateSwr` (`useSWR([...,courseRef])`), `useMutateStartInterviewAttemptSwr` / `useMutateSubmitInterviewAnswerSwr` / `useMutateFinishInterviewAttemptSwr` (`useSWRMutation`).
- `src/hooks/socketio/useInterviewOralStream.ts` — mirror `useContentAiStream`: `start({ attemptId, onQuestion, onDelta, onDone })` + `answer(text)` + `abort()`; route theo `streamId`. (Hoặc SSE `EventSource` tới `/api/v1/ai/interview/attempts/{id}/oral` nếu gateway dùng SSE.)

### D6 — i18n (cụm mới `courseInterview.*`, trong vi.json/en.json)

| key | vi | en |
|---|---|---|
| `courseInterview.title` | "Vấn đáp cuối khóa" | "Final interview" |
| `courseInterview.setup.title` | "Chuẩn bị vấn đáp" | "Prepare interview" |
| `courseInterview.setup.counts` | "{oral} vấn đáp · {mcq} trắc nghiệm · {essay} tự luận" | "{oral} oral · {mcq} MCQ · {essay} essay" |
| `courseInterview.setup.difficulty` | "Độ khó: {level}" | "Difficulty: {level}" |
| `courseInterview.setup.start` | "Bắt đầu vấn đáp" | "Start interview" |
| `courseInterview.setup.empty` | "Khóa học chưa có bài vấn đáp." | "This course has no interview yet." |
| `courseInterview.setup.error` | "Không tải được bài vấn đáp." | "Could not load the interview." |
| `courseInterview.session.progress` | "Câu {current}/{total}" | "Question {current}/{total}" |
| `courseInterview.session.mcq` | "Trắc nghiệm" | "Multiple choice" |
| `courseInterview.session.essay` | "Tự luận" | "Essay" |
| `courseInterview.session.oral` | "Vấn đáp" | "Oral" |
| `courseInterview.session.essayPlaceholder` | "Nhập câu trả lời của bạn…" | "Type your answer…" |
| `courseInterview.session.oralPlaceholder` | "Trả lời câu hỏi vấn đáp…" | "Answer the oral question…" |
| `courseInterview.session.submit` | "Nộp câu này" | "Submit answer" |
| `courseInterview.session.next` | "Câu tiếp theo" | "Next question" |
| `courseInterview.session.finish` | "Hoàn thành" | "Finish" |
| `courseInterview.session.thinking` | "AI đang hỏi…" | "AI is asking…" |
| `courseInterview.results.title` | "Kết quả vấn đáp" | "Interview results" |
| `courseInterview.results.total` | "Điểm: {score}/{max}" | "Score: {score}/{max}" |
| `courseInterview.results.feedback` | "Nhận xét" | "Feedback" |
| `courseInterview.results.matched` | "Ý đã nêu đúng" | "Points covered" |
| `courseInterview.results.backToCourse` | "Về khóa học" | "Back to course" |
| `courseInterview.results.error` | "Không tổng kết được kết quả." | "Could not finalize results." |

## Risks / Trade-offs

- [BE interview endpoints chưa sẵn khi FE land] → hook lỗi/empty; AsyncContent hiện thông báo (`setup.error`/`results.error`), KHÔNG crash, KHÔNG mock dữ liệu REST. Ghi giả định trong tasks.
- [Oral: socket vs SSE chưa chốt ở gateway] → spec để mở, `useInterviewOralStream` bọc chi tiết truyền tải; hành vi hiển thị (token stream + hỏi tuần tự) không đổi dù chọn đường nào.
- [Lộ answer_key/rubric] → module types FE KHÔNG khai báo/nhận `answer_key`/`rubric` cho học viên (BE không trả); chỉ dùng `score/feedback/matchedPoints`.
- [Nhiều attempt / rời giữa chừng] → v1 giữ đơn giản: 1 attempt/lần, rời trang = mất phiên client (không resume); resume defer v2.
- [`courseRef` format] → dùng `courseId` route; nếu BE cần ref khác → resolve lúc implement, không chặn spec.

## Migration Plan

1. Land module REST `ai-interview` + 3 SWR mutation + 1 SWR query — verify tsc.
2. Land route `interview/page.tsx` + `CourseInterview/index.tsx` (orchestrator phase) + `InterviewSetup`.
3. Land `InterviewSession` + `QuestionMcq`/`QuestionEssay`/`QuestionOral` + `useInterviewOralStream`.
4. Land `InterviewResults`.
5. i18n vi+en. Rollback = revert commit (FE-only).

## Open Questions

- Có cho làm lại (nhiều attempt) không → tùy BE; v1 nút "Làm lại" ẩn nếu không rõ.
- Oral: người học trả lời bằng gõ text (v1) hay giọng nói (defer) — v1 text.
