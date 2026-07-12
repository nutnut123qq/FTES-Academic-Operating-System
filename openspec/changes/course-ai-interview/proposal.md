# Course AI Interview — vấn đáp cuối khóa (oral + trắc nghiệm + tự luận) do AI sinh đề & chấm

## Why

Cuối mỗi khóa học chưa có bài "vấn đáp tổng kết" để kiểm tra người học đã nắm kiến thức chưa. Backend sắp có (contract `AI-CONTRACT.md` §4.4): AI **sinh bộ đề** (ORAL/MCQ/ESSAY) theo khóa và **chấm** từng câu + tổng kết điểm/feedback qua các endpoint `POST /api/v1/ai/interview/*`. Đây là phần FE dựng trải nghiệm học viên: một route mới cuối khóa gồm Setup → Session (làm bài, render 3 loại câu) → Results (điểm + nhận xét). Bám design canon nhà (HeroUI + Tailwind + AsyncContent + SWR + next-intl), tái dùng pattern REST/SWR + socket đã có cho phần oral streaming.

## What Changes

- **Route mới** `src/app/[locale]/courses/[courseId]/interview/page.tsx` — trang AI Interview cuối khóa (client page mỏng render feature, giống các subroute khác của `courses/[courseId]`).
- **Feature `src/components/features/course/CourseInterview/`**:
  - `index.tsx` — orchestrator theo trạng thái: `setup → session → results` (state máy phase, giữ `attemptId`).
  - `InterviewSetup` — hiển thị template/đề của khóa (`GET /interview/templates/{courseRef}`), cấu hình số câu mỗi loại/độ khó (nếu template cho phép) + nút "Bắt đầu" (`POST /interview/attempts`).
  - `InterviewSession` — render tuần tự từng câu theo loại: `MCQ` (radiogroup chọn 1) / `ESSAY` (textarea) / `ORAL` (vấn đáp — hỏi tuần tự qua socket SSE, người học trả lời text/typing); nộp từng câu (`POST /attempts/{id}/answers`); thanh tiến độ.
  - `InterviewResults` — sau `POST /attempts/{id}/finish`: điểm tổng + điểm/feedback từng câu + `matched_points`.
- **Hook/data**:
  - `useQueryInterviewTemplateSwr(courseRef)` — GET template/đề của khóa.
  - `useMutateStartInterviewAttemptSwr` — POST attempts (bắt đầu).
  - `useMutateSubmitInterviewAnswerSwr` — POST attempts/{id}/answers (nộp 1 câu).
  - `useMutateFinishInterviewAttemptSwr` — POST attempts/{id}/finish (tổng kết).
  - `useInterviewOralStream` — hook socket/SSE cho oral (hỏi tuần tự + nhận feedback), mô phỏng theo `useContentAiStream` (singleton socket, `ask`/`abort`, route theo `streamId`). (Nếu gateway dùng SSE `text/event-stream` thay socket → hook đọc `EventSource`; spec nêu cả hai đường, chọn khớp gateway lúc implement.)
  - Module REST mới `src/modules/api/rest/ai-interview/**` (axios call + types) + SWR wrapper.
- **3 loại câu hỏi** `ORAL` / `MCQ` / `ESSAY` — mỗi loại có UI riêng; điểm + feedback hiển thị đồng nhất ở Results.
- **i18n** cụm mới `courseInterview.*` (vi + en) — liệt kê §Design D6.
- **Không đụng backend** — chỉ tiêu thụ contract; BE chưa sẵn → hook lỗi/empty gọn qua AsyncContent, không bịa dữ liệu.

## Capabilities

### New Capabilities

- `course-ai-interview`: trải nghiệm vấn đáp cuối khóa (Setup → Session render MCQ/Essay/Oral → Results với điểm + feedback), route + feature + hook SWR/socket + i18n.

### Modified Capabilities

<!-- Chưa có spec cuối-khóa/interview trong openspec/specs/. Không có delta. -->

## Impact

- `src/app/[locale]/courses/[courseId]/interview/page.tsx` (mới).
- `src/components/features/course/CourseInterview/**` (mới): `index.tsx`, `InterviewSetup.tsx`, `InterviewSession.tsx` (+ `QuestionMcq.tsx`, `QuestionEssay.tsx`, `QuestionOral.tsx`), `InterviewResults.tsx`, `hooks/` (state máy phase nếu tách).
- `src/modules/api/rest/ai-interview/**` (mới) + `src/hooks/swr/api/rest/queries|mutations/*Interview*Swr.ts` (mới).
- `src/hooks/socketio/useInterviewOralStream.ts` (mới) — hoặc SSE tùy gateway.
- `src/messages/vi.json` / `en.json` — cụm `courseInterview.*`.
- (Tùy chọn) link "Vấn đáp cuối khóa" từ `CourseLesson`/trang khóa tới route mới — nêu nhưng không bắt buộc trong change này.
- FE-only; khớp contract BE `AI-CONTRACT.md` §4.4.
