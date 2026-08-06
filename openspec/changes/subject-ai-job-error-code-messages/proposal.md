## Why

Khi một job AI của công cụ theo môn chạy xong và FAILED, FE hiện **một thông báo chung** cho mọi
nguyên nhân: *"AI xử lý thất bại. Vui lòng thử lại."*

Đó từng là lựa chọn ĐÚNG và có chủ đích: BE gộp mọi lỗi vào `AI_JOB_ERROR` và giấu mã thật
(`AI_CONTEXT_INSUFFICIENT`) trong `errorMessage`, nên FE cố ý KHÔNG khớp chuỗi văn xuôi — khớp chuỗi
là hợp đồng giả, đổi câu chữ bên BE là vỡ bên FE.

Điều kiện đó **đã hết hạn**. BE change `ai-job-error-fidelity` (commit `516e78c`, nghiệm thu trên
apitest ở `3ae5956`) nay giữ MÃ MIỀN THẬT trên job: `AiJobWorker.errorCodeOf()` chỉ rơi về
`AI_JOB_ERROR` khi lỗi không mang mã nào. `JobView.errorCode` đã có sẵn trong type FE, chỉ là chưa ai
đọc.

Hệ quả đang thấy: bài quá ngắn để tóm tắt — một tình huống người học **tự xử lý được** (chọn bài dài
hơn) — lại hiện đúng câu như khi provider chết. Người học đọc xong không biết phải làm gì, và bấm
"thử lại" vào đúng thứ chắc chắn hỏng y như cũ.

## What Changes

- Thêm `classifySubjectAiJobFailure(errorCode)`: map mã miền trên job đã FAILED sang message key.
  `AI_CONTEXT_INSUFFICIENT` → `insufficientContext`; mã chứa `QUOTA` → `quota` (quota do worker từ
  chối về theo job, không phải theo submit); mã lạ hoặc rỗng → `failed` như cũ.
- `useSubjectAiJob` đọc `poll.job?.errorCode` thay vì gộp cứng `poll.isFailed → "failed"`.
  Poll không tới được API vẫn là `failed` (không có job nào để đọc mã).
- i18n `subjects.aiTools.job.insufficientContext` (vi + en) — câu chỉ ra việc cần làm, không phải
  câu xin lỗi.

## Impact

- Affected specs: không có (đọc thêm một field đã tồn tại trong contract, không đổi API).
- Affected code: `useSubjectAiJob.ts`, `useSubjectAiJob.test.tsx`, `vi.json`, `en.json`.
- 4 surface (`SubjectAiSummary` · `SubjectAiQuiz` · `SubjectAiFlashcards` · `SubjectAiOcr`) render qua
  `t(\`subjects.aiTools.job.${errorKey}\`)` nên **không phải sửa surface nào** — key mới hiện thẳng.
- Verify: 15 test của hook xanh (thêm 3 ca: job mang `AI_CONTEXT_INSUFFICIENT`; `AI_JOB_ERROR` và mã
  rỗng vẫn rơi về `failed`); `tsc --noEmit` exit 0; eslint 2 file exit 0; parity vi/en 5823 = 5823.
