# ai-hub-live-tools — Wire 8 tile AI Hub thành công cụ thật (+ CV builder UI + Planner UI)

## Why

Xác minh code 2026-07-16: `AiHub/index.tsx` dòng ~133 — nút "Mở" của CẢ 8 tile là
`<Button>` no-op (không onPress). Catalog (`useQueryAiToolsSwr`) đã sống bằng
`/ai/quotas/me` nhưng không tile nào dẫn đi đâu. BE đã có job endpoints
(`/ai/learning/*`, `/ai/coding/*`, `/ai/career/cv-review`, `GET /ai/jobs/{id}`) và các
change BE cùng đợt bổ sung study-planner + CV builder + CV review thật.

Bug chặn: `restRequest` (client.ts dòng ~95) coi envelope `code !== 200` là lỗi, trong
khi MỌI job submit của BE trả `ApiResponse.of(1002, "Accepted", JobRef)`
(JobController.job) → mọi submit job từ FE hiện THROW dù thành công.

## What Changes

- **Fix job envelope**: `restRequest` chấp nhận `code === 200 || code === 1002`
  là thành công (1002 = Accepted, data = JobRef).
- **Wire từng tile** (`useQueryAiToolsSwr` thêm `href`/`action` per tool):
  - `tutor` → điều hướng học tiếp: 1 khóa đang học → thẳng lesson gần nhất; nhiều →
    modal chọn khóa; 0 → CTA sang catalog khóa học.
  - `summary` / `flashcards` / `quiz` → trang `/ai/tools/{summary|flashcards|quiz}`:
    nhập text hoặc chọn bài đang học → submit job → poll `GET /ai/jobs/{id}` → render
    kết quả (summary text / flashcards lật / quiz làm tại chỗ).
  - `debug` → `/ai/tools/debug`: dán code + mô tả lỗi → `POST /ai/coding/review` (job)
    → hiển thị review.
  - `cvReview` → `/ai/tools/cv-review`: upload CV (pdf/docx) HOẶC dùng CV builder →
    submit review → kết quả structured. Kèm **CV builder UI** (form Harvard + xuất PDF
    client-side + nút "đưa CV này đi review").
  - `planner` → `/ai/tools/planner`: form mục tiêu → plan timeline tuần → check-off
    (**Planner UI**, contract BE `ai-study-planner`).
  - `mentor` → **BỎ khỏi catalog learner** (chuyển Admin — change
    `admin-lecturer-ai-assist`); tile không có đường dùng thật thì không bày.

## Capabilities

### New Capabilities
- `ai-hub-tile-wiring`: mọi tile CTA có hành động thật; catalog bỏ tile chết.
- `ai-job-tools-ui`: 4 trang công cụ job-based (summary/flashcards/quiz/debug) submit +
  poll + render; fix envelope 1002.
- `ai-cv-builder-ui`: form CV Harvard, xuất PDF client-side, upload CV, luồng review.
- `ai-planner-ui`: form study plan, timeline tuần, check-off tiến độ.

### Modified Capabilities
- Không delta spec sẵn có (AiHub trước giờ là mock UI, chưa có capability spec).

## Impact

- `src/modules/api/rest/client/client.ts` — success codes {200, 1002}.
- `src/components/features/ai-platform/AiHub/index.tsx` + `hooks/useQueryAiToolsSwr.ts`
  — action per tile, bỏ mentor.
- Trang mới `src/app/[locale]/(core)/ai/tools/{summary,flashcards,quiz,debug,cv-review,planner}/page.tsx`
  (xác nhận cấu trúc route group `/ai` hiện có khi implement) + feature components
  `src/components/features/ai-platform/tools/**`.
- REST module: `ai.ts` thêm `createStudyPlan/getStudyPlans/patchStudyPlanProgress/archiveStudyPlan`,
  `career` module thêm `getMyCv/putMyCv`; upload CV dùng luồng presigned upload sẵn có
  của resource (tra `modules/api/rest/resource` khi implement).
- Dependency FE mới: `@react-pdf/renderer` (xuất PDF CV client-side — quyết định ở BE
  change `ai-cv-review-and-builder` design §3).
- i18n `aiPlatform.tools.*` mở rộng (vi+en).
