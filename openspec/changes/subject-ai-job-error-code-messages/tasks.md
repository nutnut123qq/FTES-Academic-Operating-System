## 1. Kiểm điều kiện trước khi mở khoá

- [x] 1.1 Đọc `AiJobWorker.errorCodeOf()` bên BE xác nhận mã miền thật được giữ trên job
      (không còn gộp hết vào `AI_JOB_ERROR`).
- [x] 1.2 Xác nhận BE change `ai-job-error-fidelity` đã archive + đã nghiệm thu trên apitest
      (`516e78c`, `3ae5956`) — không xây trên lời hứa chưa deploy.
- [x] 1.3 Xác nhận `JobView.errorCode` đã có trong type FE.

## 2. Hook

- [x] 2.1 Thêm `insufficientContext` vào `SubjectAiJobErrorKey`.
- [x] 2.2 Thêm `classifySubjectAiJobFailure(errorCode)` + bảng `JOB_ERROR_CODE_KEYS`.
- [x] 2.3 `errorKey` đọc `poll.job?.errorCode` khi `poll.isFailed`; `poll.error` vẫn là `failed`.

## 3. i18n

- [x] 3.1 `subjects.aiTools.job.insufficientContext` ở `vi.json` và `en.json`.
- [x] 3.2 Kiểm không phải sửa surface (4 surface render động theo `errorKey`).

## 4. Verify

- [x] 4.1 `npx vitest run useSubjectAiJob.test.tsx` — 15 test xanh.
- [x] 4.2 `npx tsc --noEmit` exit 0; eslint 2 file đã sửa exit 0.
- [x] 4.3 Parity key vi/en 5823 = 5823, lệch 0 cả hai chiều.
- [ ] 4.4 Nghiệm thu bằng mắt trên bài thật quá ngắn — CHƯA LÀM, cần môi trường render.
