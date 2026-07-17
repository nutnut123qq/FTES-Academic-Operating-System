# Design — ai-hub-live-tools

## 1. Fix envelope job (điều kiện tiên quyết)

`src/modules/api/rest/client/client.ts` dòng ~95:

```ts
// BE: 200 = OK; 1002 = Accepted (job async — data = JobRef). Cả hai là thành công.
const SUCCESS_CODES = new Set([200, 1002])
if (!SUCCESS_CODES.has(envelope.code)) { ...throw như cũ... }
```

Không đổi gì khác trong client (RestError giữ nguyên).

## 2. Poll job dùng chung

Hook mới `useAiJobPolling`:

```ts
useAiJobPolling(jobId: string | null)
// SWR key ["GET_AI_JOB", jobId], fetcher getJob, refreshInterval động:
//  status PENDING/RUNNING → 2500ms; COMPLETED/FAILED → 0 (dừng).
// Trả { job, isRunning, isFailed, result } — result = job.result đã parse.
// Timeout mềm: quá 90s vẫn PENDING → expose isStale để UI hiện nút thử lại.
```

## 3. Tile wiring (`useQueryAiToolsSwr` + `AiHub`)

- Catalog thêm `href` tĩnh per tool; `mentor` XÓA khỏi `TOOL_CATALOG`.
- `AiHub` CTA: `Button as={Link} href={tool.href}` — riêng `tutor` là `onPress` mở logic
  học-tiếp:
  - Hook `useQueryMyEnrolledCoursesSwr` (tra module course REST sẵn có — dùng lại query
    "khóa của tôi" đang phục vụ trang course; KHÔNG bịa endpoint mới).
  - 1 khóa → `router.push(routeToLastLesson(course))` (tái dùng resolver route learn
    hiện có); nhiều → HeroUI Modal danh sách chọn; 0 → modal CTA sang `/courses`.
- Tile giữ hiển thị `remaining` quota như cũ.

## 4. Trang công cụ job-based (`/ai/tools/*`)

Khung chung `AiToolPage` (feature component): tiêu đề + mô tả + form input + nút chạy +
khối kết quả (AsyncContent), quota còn lại (từ `/ai/quotas/me`).

| Trang | Input | Submit | Render kết quả |
|---|---|---|---|
| summary | textarea text HOẶC picker bài đang học (lessonId) | `submitSummaryJob({text?|lessonId?, language:"vi"})` | `{tldr, key_points[], glossary[], estimated_read_min, model}` — tldr + list; hiện model |
| flashcards | như trên + số thẻ | `submitFlashcardsJob({..., cardCount})` | `{cards:[{front,back,hint?}]}` — thẻ lật (state flip per card) |
| quiz | như trên + số câu + độ khó | `submitQuizJob({..., questionCount, difficulty})` | `{questions:[{question,options,correct,explanation}]}` — làm tại chỗ, chấm client, giải thích sau khi chọn |
| debug | textarea code + select ngôn ngữ + mô tả lỗi | `submitCodeReviewJob({code, language, question})` | `{output, model}` (schema generic worker) render markdown |

- Body input: gửi `lessonId` khi chọn bài (BE resolve body_md), ngược lại `text`
  (xác nhận field BE `guardLearningInput` chấp nhận khi implement — đọc `AiInputGuard`).
- Job flow: submit → nhận `JobRef{jobId}` (envelope 1002) → `useAiJobPolling` → render.
- FAILED → errorContent + errorCode; quota 429 → message riêng.

## 5. CV builder + review (`/ai/tools/cv-review`)

2 tab (ExtendedTabs): **"CV của tôi"** (builder) · **"Upload file"**.

- Builder: form sections chuẩn Harvard khớp shape BE (`career.cv_profiles.sections` —
  BE change `ai-cv-review-and-builder` design §1): header, summary, education[],
  experience[], projects[], skills[], awards[] — mỗi mảng là repeater (thêm/xoá dòng).
  Load `GET /career/cv/me` (null → form trống); Lưu = `PUT /career/cv/me`.
  - Nút **"Xuất PDF"**: render template Harvard bằng `@react-pdf/renderer`
    (1 cột, serif, heading section in hoa, bullets) → download blob. Client-side theo
    quyết định BE design §3.
  - Nút **"Đưa CV này đi review"**: `submitCvReviewJob({cvProfileId})` → poll → kết quả.
- Upload: file pdf/docx (validate mime/size ≤ 10MB) → luồng presigned upload resource
  sẵn có → `submitCvReviewJob({storageKey})` (hoặc `{resourceId}` tuỳ luồng upload trả
  gì — khớp resolver BE).
- Kết quả review: `{score, summary, strengths[], improvements[], sectionFeedback[]}` —
  score badge lớn + 3 khối list; hiện `model`.

## 6. Planner (`/ai/tools/planner`)

- List plan (`GET /ai/learning/study-plans`) — empty → thẳng form tạo.
- Form: goal (bắt buộc), deadlineDays (slider 7-180), hoursPerWeek, currentLevel,
  knownTopics/targetTopics (chips input), model? (picker tái dùng
  `useQueryAiModelCatalogSwr` từ change lesson-ai-chat-fixes).
- Submit `POST /ai/learning/study-plan` (sync, spinner dài ~30s, timeout axios 120s) →
  view plan.
- View plan: timeline dọc theo tuần — mỗi tuần card `focus` + `milestone` + checklist
  task (checkbox → `PATCH /study-plans/{id}/progress {taskKey:"w{week}:{idx}", done}` —
  optimistic + rollback); progress bar tổng theo `percentDone` BE trả.
- Archive (nút ⋯ → confirm) → `DELETE /study-plans/{id}`.

## 7. REST modules mới/mở rộng

- `modules/api/rest/ai/ai.ts`: `createStudyPlan`, `getStudyPlans`, `getStudyPlan`,
  `patchStudyPlanProgress`, `archiveStudyPlan` (+types `StudyPlanView`).
- `modules/api/rest/career/`: `getMyCv`, `putMyCv`, `getCv(id)` (+`CvProfile` types
  khớp shape BE).
- Types job result: `SummaryResult`, `FlashcardsResult`, `QuizResult`, `CvReviewResult`.

## 8. Seed data

FE không DB — dữ liệu test đến từ seed BE cùng lane: `V213` (model_configs OPENROUTER),
`V216` (CV demo), `V218` (study plan demo). Điều kiện chạy demo ngay sau deploy:
đăng nhập account test STUDENT → planner thấy 1 plan seed, cv-review tab builder thấy CV
demo (nếu account test là user đầu tiên theo created_at). Unit test FE dùng fixtures
JSON tương ứng schema các bảng seed đó (đặt tại `tools/__fixtures__/`).
