# Tasks — course-ai-interview

## 1. Tầng REST + hook (interview)

- [ ] 1.1 `src/modules/api/rest/ai-interview/ai-interview.ts` + `types.ts`: types `InterviewQuestionType`/`InterviewQuestion`/`InterviewTemplate`/`StartAttemptResult`/`SubmitAnswerResult`/`FinishAttemptResult` (KHÔNG khai báo answer_key/rubric); hàm `getInterviewTemplate`, `startInterviewAttempt`, `submitInterviewAnswer`, `finishInterviewAttempt` (axios pattern nhà, path `/ai/interview/...`, đọc envelope `data`)
- [ ] 1.2 `src/hooks/swr/api/rest/queries/useQueryInterviewTemplateSwr.ts`: `useSWR(["QUERY_INTERVIEW_TEMPLATE_SWR", courseRef], ...)`, key null khi thiếu courseRef; trả `{ template, isLoading, error, mutate }`
- [ ] 1.3 `useMutateStartInterviewAttemptSwr` / `useMutateSubmitInterviewAnswerSwr` / `useMutateFinishInterviewAttemptSwr` (`useSWRMutation`, mirror `usePostAdminPresignedUrlSwr`); cập nhật barrel `mutations/index.ts` nếu có
- [ ] 1.4 `src/hooks/socketio/useInterviewOralStream.ts`: mirror `useContentAiStream` — `start({attemptId,onQuestion,onDelta,onDone})` + `answer(text)` + `abort()`, `activeRef` route theo `streamId` (hoặc `EventSource` SSE tùy gateway — chọn khớp lúc implement)
- [ ] 1.5 Verify tầng data: `tsc --noEmit` sạch, `npm run build` (webpack) xanh

## 2. Route + orchestrator + Setup

- [ ] 2.1 `src/app/[locale]/courses/[courseId]/interview/page.tsx`: client page mỏng `const Page = () => <CourseInterview />` (khuôn `quiz/page.tsx`)
- [ ] 2.2 `src/components/features/course/CourseInterview/index.tsx`: state `phase: "setup"|"session"|"results"` + `attemptId` + `questions`; `AsyncContent` bọc; chuyển phase theo D1
- [ ] 2.3 `CourseInterview/InterviewSetup.tsx`: `useQueryInterviewTemplateSwr(courseId)` → tiêu đề + counts + độ khó + mô tả; empty state `courseInterview.setup.empty`; nút "Bắt đầu vấn đáp" → `startAttempt` (spinner/disabled khi gọi); lỗi → `setup.error`
- [ ] 2.4 Verify: route mở được, setup hiển thị template/empty/error đúng; `tsc`/build sạch

## 3. Session: render MCQ / Essay / Oral

- [ ] 3.1 `CourseInterview/InterviewSession.tsx`: thanh tiến độ `ProgressMeter` `current/total`; switch theo `question.type` → `QuestionMcq`/`QuestionEssay`/`QuestionOral`; nộp câu (`useMutateSubmitInterviewAnswerSwr`) rồi sang câu kế; câu cuối → `finish`
- [ ] 3.2 `QuestionMcq.tsx`: `prompt` + radiogroup `options` (role radiogroup, keyboard), `answer=optionId`; MCQ hiển thị trạng thái nộp/đúng-sai tùy BE trả
- [ ] 3.3 `QuestionEssay.tsx`: `prompt` + textarea (`courseInterview.session.essayPlaceholder`), `answer=text`
- [ ] 3.4 `QuestionOral.tsx`: `prompt` bong bóng + textarea trả lời (`oralPlaceholder`); `useInterviewOralStream` nhận câu hỏi tuần tự (`onQuestion`/`onDelta`) + gửi `answer(text)`; nút "Câu tiếp theo"; `abort()` khi unmount; `session.thinking` khi AI đang hỏi
- [ ] 3.5 Verify: 3 loại câu render đúng, nộp tuần tự, oral stream vào bong bóng, không lộ answer_key/rubric; `tsc`/build sạch

## 4. Results

- [ ] 4.1 `CourseInterview/InterviewResults.tsx`: điểm tổng (`results.total`, ProgressMeter/vòng tròn) + list từng câu (prompt rút gọn, điểm, `feedback`, `matchedPoints` chip, nhãn loại); nút "Về khóa học" (`router.push(/courses/${courseId})`)
- [ ] 4.2 Lỗi finish → `results.error`, không crash
- [ ] 4.3 Verify: finish → hiển thị điểm + feedback từng câu đúng; `tsc`/build sạch

## 5. i18n + hoàn thiện

- [ ] 5.1 Thêm cụm `courseInterview.*` vào `src/messages/vi.json` + `en.json` (đủ khoá §Design D6, vi+en); JSON hợp lệ, không key thô lộ
- [ ] 5.2 (Tùy chọn) link "Vấn đáp cuối khóa" từ trang khóa/`CourseLesson` tới route mới
- [ ] 5.3 Verify cuối: `npm run build` (webpack) xanh + `tsc --noEmit` sạch; `openspec validate course-ai-interview --strict` pass

## Test 3 vòng

- [ ] V1 (biên dịch): `tsc --noEmit` sạch, `npm run build` (webpack) xanh, JSON messages hợp lệ, `openspec validate course-ai-interview` pass
- [ ] V2 (tương tác tay): mở route interview → Setup hiện đề → Bắt đầu → làm MCQ (chọn 1) / Essay (gõ) / Oral (hỏi tuần tự stream) → nộp từng câu → Results hiện điểm + feedback + matched points; vi↔en đủ nhãn
- [ ] V3 (biên/hồi quy): template chưa có → empty; BE endpoint thiếu → lỗi gọn không crash; oral abort khi rời trang; answer_key/rubric KHÔNG lộ ra FE; không cảnh báo hydration
