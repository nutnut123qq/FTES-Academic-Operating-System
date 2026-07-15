# Tasks — ai-code-grading-model-picker

> API BE đã MERGED lên origin/main (commit 0dfb5e2):
> `POST /api/v1/ai/coding/grade-code|execute-code` (perm `ai.coding.use`), `GET /api/v1/ai/models`.
> ftes-ai-service `/v2/code/*` đã LIVE tại aitest.ftes.vn (Judge0 + LLM đa-model đã verify).

## 1. API hooks
- [x] 1.1 `useGetAiCatalogModelsSwr` — GET /api/v1/ai/models, cache 30m, unwrap envelope
      (đặt tên "catalog" để không đụng hook GraphQL `useQueryAiModelsSwr` cũ)
- [x] 1.2 `usePostGradeCodeSwr` — POST grade-code (body: exercise_question, code, language,
      test_cases[], run_code_execution, model?, rubric?); timeout dài (180s khớp BE)
- [x] 1.3 `usePostExecuteCodeSwr` — POST execute-code (chạy thử, không LLM)

## 2. Components
- [x] 2.1 `AiModelPicker` (reuseable) — dropdown model (label + hint "mỗi model chấm khác nhau");
      tái dùng được cho ContentAi composer (rule: composer 1-box)
- [x] 2.2 `ExecutionResultTable` — bảng test case pass/fail + diff expected/actual + badge n/N
- [x] 2.3 `GradeResultCard` — score/max + verdict màu + criteria table + feedback +
      improvements + **chip "Chấm bởi {model}" + model_note (BẮT BUỘC)**
- [x] 2.4 `GradeCodePanel` — ghép: prefill đề từ challenge, code editor + test case tự nhập
      (BE public view chưa expose publicTestCases), model picker, nút Chạy thử / Chấm bằng AI,
      progress 2 pha, error states (AI_CODE_DOWN/AI_CODE_GRADING_FAILED/AI_CODE_INVALID/
      AI_MODEL_NOT_ALLOWED/403 → thông báo nâng cấp gói)

## 3. Tích hợp surface
- [x] 3.1 `ChallengeView` (solver): type coding/sql thay placeholder coming-soon bằng
      `GradeCodePanel` (accordion brief giữ variant="surface" theo rule challenge-solve)
- [ ] 3.2 `ChallengeSubmission`: xem lại kết quả chấm gần nhất (kèm model đã chấm) —
      surface này nộp bằng URL (không phải source code) → cần contract riêng, để vòng sau
- [x] 3.3 SQL: ẩn "Chạy thử", note static-only
- [ ] 3.4 Realtime: map `JobCategory.JudgeCoding` nếu sau này BE chuyển async (hiện sync)

## 4. i18n & polish
- [x] 4.1 Keys `learn.codeGrading.*` (vi/en)
- [x] 4.2 "Chấm lại với model khác" (lần 2 gửi run_code_execution:false nếu code không đổi)
- [ ] 4.3 Build + typecheck xanh (tsc --noEmit xanh; npm run build chạy ở vòng verify cuối)
