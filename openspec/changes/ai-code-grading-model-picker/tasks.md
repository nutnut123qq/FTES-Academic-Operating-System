# Tasks — ai-code-grading-model-picker

> API BE đã sẵn (nhánh `feat/openrouter-provider-adapter`, cần merge):
> `POST /api/v1/ai/coding/grade-code|execute-code` (perm `ai.coding.use`), `GET /api/v1/ai/models`.
> ftes-ai-service `/v2/code/*` đã LIVE tại aitest.ftes.vn (Judge0 + LLM đa-model đã verify).

## 1. API hooks
- [ ] 1.1 `useQueryAiModelsSwr` — GET /api/v1/ai/models, cache 30m, unwrap envelope
- [ ] 1.2 `useMutateGradeCodeSwr` — POST grade-code (body: exercise_question, code, language,
      test_cases[], run_code_execution, model?, rubric?); timeout dài (90s+)
- [ ] 1.3 `useMutateExecuteCodeSwr` — POST execute-code (chạy thử, không LLM)

## 2. Components
- [ ] 2.1 `ModelPicker` — dropdown model (label + tooltip "mỗi model chấm khác nhau");
      tái dùng được cho ContentAi composer (rule: composer 1-box)
- [ ] 2.2 `ExecutionResultTable` — bảng test case pass/fail + diff expected/actual + badge n/N
- [ ] 2.3 `GradeResultCard` — score/max + verdict màu + criteria table + feedback +
      improvements + **chip "Chấm bởi {model}" + model_note (BẮT BUỘC)**
- [ ] 2.4 `GradeCodePanel` — ghép: prefill đề/code/test case từ challenge, model picker,
      nút Chạy thử / Chấm bằng AI, progress states, error states (AI_CODE_DOWN/…)

## 3. Tích hợp surface
- [ ] 3.1 `ChallengeView` (solver): nút "Chấm bằng AI" + "Chạy thử" cạnh submit
      (accordion variant="surface" theo rule challenge-solve)
- [ ] 3.2 `ChallengeSubmission`: xem lại kết quả chấm gần nhất (kèm model đã chấm)
- [ ] 3.3 SQL: ẩn "Chạy thử", note static-only
- [ ] 3.4 Realtime: map `JobCategory.JudgeCoding` nếu sau này BE chuyển async (hiện sync)

## 4. i18n & polish
- [ ] 4.1 Keys `learn.codeGrading.*` (vi/en)
- [ ] 4.2 "Chấm lại với model khác" (lần 2 gửi run_code_execution:false nếu code không đổi)
- [ ] 4.3 Build + typecheck xanh
