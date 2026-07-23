# ai-code-grading-model-picker — Chấm code AI đa-model (Judge0 + LLM, chọn model)

## Why
Backend đã có chuỗi chấm code mới (BE change trên nhánh `feat/openrouter-provider-adapter`):
`POST /api/v1/ai/coding/grade-code` proxy sang **ftes-ai-service** `/v2/code/grade` —
**Judge0 chạy test case thật** (khách quan) + **LLM chấm theo tiêu chí**. Điểm khác biệt:
**chọn được model** (allowlist 10 model qua `GET /api/v1/ai/models`) và **mỗi model chấm ra
kết quả khác nhau** — response luôn kèm `model` + `model_note`, FE BẮT BUỘC hiển thị model
đã chấm để học viên/mentor hiểu vì sao hai lần chấm có thể lệch nhau.

FE hiện có `JobCategory.JudgeCoding` (enum realtime job) và trang giải challenge
(`ChallengeView`, `ChallengeSubmission`) nhưng CHƯA có surface chấm code AI nào.

## What Changes
- **GradeCodePanel** (drawer/panel trong `ChallengeView` + `ChallengeSubmission`):
  - Nút "Chấm bằng AI" cạnh nút nộp bài; mở panel gồm: đề bài (tự điền từ challenge),
    code (tự điền từ editor), test cases (từ challenge test case public), **model picker**.
  - **Model picker**: dropdown từ `GET /api/v1/ai/models` (data.models[] {id,label,vision}
    lọc `vision=false` không bắt buộc — mọi model text đều chấm được), default
    `defaults.chat` (gpt-oss-120b). Kèm tooltip: "Mỗi model chấm khác nhau — kết quả
    test case là khách quan, phần nhận xét/điểm phụ thuộc model."
  - Submit → `POST /api/v1/ai/coding/grade-code` (đồng bộ 10–60s → skeleton + progress
    label "Đang chạy test case… / Đang chấm bằng {model}…").
- **Kết quả hiển thị 3 tầng**:
  1. **Execution (khách quan)**: bảng test case pass/fail (`execution.results[]`:
     input/expected/actual/status/time) + badge `passed/total`. Case fail → diff
     expected vs actual.
  2. **Điểm (theo model)**: score/max + verdict (PASS xanh / PARTIAL vàng / FAIL đỏ) +
     bảng `criteria[]` (name, score/max, comment).
  3. **Nhận xét**: `feedback` + `improvements[]` bullet.
  - **Model attribution (BẮT BUỘC)**: chip "Chấm bởi {model}" + caption `model_note`
    ngay dưới điểm. Đổi model → nút "Chấm lại với model khác" (giữ execution cũ nếu
    code không đổi — execution không phụ thuộc model).
- **Execute-only**: nút "Chạy thử" → `POST /api/v1/ai/coding/execute-code` (không tốn
  LLM, chỉ Judge0) cho học viên tự kiểm tra trước khi chấm.
- i18n `learn.codeGrading.*` (vi/en).

## Capabilities
### New Capabilities
- `ai-code-grading`: panel chấm code AI với model picker, bảng test case execution,
  điểm + criteria + feedback theo model, model attribution.
### Modified Capabilities
- `challenge-solve`: thêm entry "Chấm bằng AI"/"Chạy thử" vào surface giải challenge.

## Impact
- FE only; tiêu thụ API BE: `POST /api/v1/ai/coding/grade-code`, `POST
  /api/v1/ai/coding/execute-code` (permission `ai.coding.use`), `GET /api/v1/ai/models`.
- Components mới: `GradeCodePanel`, `ModelPicker` (tái dùng được cho ContentAi composer),
  `ExecutionResultTable`, `GradeResultCard`. Hooks: `useMutateGradeCodeSwr`,
  `useMutateExecuteCodeSwr`, `useQueryAiModelsSwr` (cache 30m).
- Ngôn ngữ hỗ trợ thực thi: python/java/cpp/c (SQL chỉ chấm static — ẩn nút "Chạy thử",
  hiện note "SQL không hỗ trợ chạy test").
