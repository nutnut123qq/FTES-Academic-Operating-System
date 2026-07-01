# UX Brainstorm — Personal-project task feedback PAGE (mirror challenge SubmissionResult) — 2026-06-28

> Thầy: *"xem chi tiết phản hồi của personal-project làm y chang trang chi tiết phản hồi của challenges; seed vài cái data để render trang chi tiết phản hồi cho từng task"*.
> Mục tiêu: biến feedback PP từ **modal + drawer** → 1 **PAGE** y chang `Challenge/SubmissionResult` (quality-gate report).

## Hiện trạng (grounded — đã scan BE + DB + FE)
- **PP feedback hiện = MODAL + DRAWER**, KHÔNG phải page:
  - `UserMilestoneTaskFeedbacksModal` (findings = card list, KHÔNG accordion).
  - `PersonalProjectTaskAttemptsDrawer` (list attempt cards, chỉ score + shortFeedback).
  - Nút "Xem chi tiết phản hồi" (TaskActions) mở modal; "Xem thêm" mở drawer.
- Route `…/personal-project/tasks/[taskId]/page.tsx` = **rỗng** (`<></>`); brief render qua layout/rail.
- **70% hạ tầng đã có** (tái dùng được):
  - Hooks: `useQueryUserPersonalTaskAttemptsSwr` (attempts: attemptNumber/score/shortFeedback/processedAt/**passed**), `useQueryUserPersonalTaskAttemptFeedbacksSwr(attemptId qua redux selectedAttemptId)`.
  - Query: `userPersonalTaskAttempts`, `userPersonalTaskAttemptFeedbacks`.
  - Entity: `UserMilestoneTaskAttemptEntity` (có **`passed: boolean`** — TỐT hơn challenge, khỏi tính threshold), `UserMilestoneTaskAttemptFeedbackEntity` (message/severity/location/suggestion/sortIndex).
  - Blocks dùng chung sẵn: `GradingByline`, `FlexWrapButtonRadio`, `FlexWrapCardRadio`, `SubmissionResultHistoryDrawer` (pattern), `LabeledCard`, `AsyncContent`, `PageHeader`.

## 3 GAP vs challenge (data thật)
| Gap | Challenge có | PP | Hệ quả |
|---|---|---|---|
| **servedModel/servedProvider** | ✅ cột trên attempt | ❌ processor tính `aiUsage` nhưng KHÔNG persist | Model byline "chấm bởi X" cần BE migration (y hệt fix challenge gần đây) |
| **submissionUrl per-attempt** | ✅ cột | ❌ chỉ trong job payload | "Xem repo" lấy từ enrollment github url (current, không phải url lúc chấm) |
| **feedback `detail`** | ✅ | ❌ chỉ `message` | Accordion panel chỉ có location + suggestion (mỏng hơn 1 chút) |
- **Lợi thế PP:** `attempt.passed` boolean có sẵn → verdict KHÔNG cần `isPassing` guard/threshold (challenge phải tự tính + guard "Đạt 0/100"). `maxScore` lấy từ `milestoneTaskProgress.maxScore` (hoặc milestone-task entity).

## IA (mirror SubmissionResult — Direction chốt sơ bộ)
1. **PageHeader** — back-link "← Quay lại dự án" (về `…/tasks/[taskId]`) + task title + description.
2. **Selector "Các lần thử"** — `<Label>` (gap-3) → `FlexWrapButtonRadio insideCard={false}` (5 mới nhất + "+N" → drawer). Mỗi nút: verdict icon (theo `passed`) + "Lần thử N" + score.
3. **LabeledCard "Kết quả"** — score hero (tone theo `passed`) + chip "Đạt/Chưa đạt" (dùng `passed`) + "cần N để qua" + shortFeedback + "Xem repo"↗ (enrollment url) + (border-t) model byline (nếu thêm servedModel) + time.
4. **LabeledCard "Góp ý"** — findings accordion (`Accordion variant="surface"` + border); item = severity icon + message clamp + location chip → expand → location link + suggestion (KHÔNG detail).
5. **History drawer** — `PersonalProjectTaskResultHistoryDrawer` (mirror `SubmissionResultHistoryDrawer`: SurfaceListCard + Pagination + ScrollShadow + footer pager).
- Routing: thêm `…/personal-project/tasks/[taskId]/result/page.tsx` → mount `PersonalProjectTaskResult`. Param `?attempt=Y` (taskId đã ở route, PP 1 task = 1 submission nên KHÔNG cần `?submission=`). Nút "Xem chi tiết phản hồi" → `router.push` page thay vì mở modal.

## 3 hướng (khác nhau ở SCOPE / BE, không phải layout — vì "y chang")
- **A — Full mirror + thêm servedModel (KHUYẾN NGHỊ cho "y chang thật").** Thêm cột `served_model`/`served_provider` vào `UserMilestoneTaskAttemptEntity` + persist `aiUsage` ở complete-step (mirror fix challenge) + migration. → page giống HỆT challenge (có "chấm bởi model" + tier). Nhiều việc nhất (BE schema + restart).
- **B — Mirror v1, BỎ model byline (không đụng BE schema).** Page y hệt nhưng ẩn dòng "chấm bởi model" (vì chưa có servedModel). Ship nhanh, 0 migration. Thêm servedModel sau (nâng lên A).
- **C — Extract block `GradingResultView` dùng chung challenge + PP (DRY, single-source).** Tách phần "selector + Kết quả + Góp ý + drawer" thành 1 block props-driven; cả challenge lẫn PP feed vào → đảm bảo "y chang" về sau + 1 nguồn ([[single-source-render]]). Refactor lớn nhất, đụng cả SubmissionResult đang ổn → defer (rủi ro regression).

**Đề xuất:** **B trước** (ship page y chang, 0 BE risk) → rồi **A** (thêm servedModel) khi thầy duyệt migration. **C** ghi nợ (làm khi cả 2 page ổn định, tránh đụng SubmissionResult vừa polish). Lý do: model byline là 1 dòng phụ; cấu trúc page (hero verdict + accordion findings + drawer) mới là "y chang" chính → B đã đạt 95%.

## Seed plan (để render trang — thầy yêu cầu)
- Script `scratch/seed-pp-attempts.cjs` (mirror `seed-attempts.cjs`): insert ~6 `user_milestone_task_attempts` + feedbacks cho 1 `user_milestone_task` của task đang xem ("Chia Shop…", task `388ea18a-…`).
- Cần resolve `user_milestone_task_id` (task + user pakoo) qua DB query trước khi seed (mirror cách seed challenge).
- Varied: score 64/70/82/88/90/100, `passed` theo threshold (~70), feedbacks (severity high/medium/low) trên các lần chưa đạt. servedModel: nếu chọn A → set served_model (qwen/gpt-nano/gemini); nếu B → bỏ qua.
- DB local: `{host:'localhost', port:5433, user:'postgres', password:'Cuong123_A', database:'starci-academy'}`.

## Refs
- Mirror gốc: `Challenge/SubmissionResult/index.tsx` + draft [[grading-result-page-labeled-cards-verdict-hero-findings-accordion]] + [[attempt-history-selector-adaptive-and-grading-model-chip]].
- Blocks dùng chung: `GradingByline` · `FlexWrapButtonRadio` · `SubmissionResultHistoryDrawer` (pattern → clone `PersonalProjectTaskResultHistoryDrawer`).
- Quality-gate report IA: GitHub Actions check summary · Sentry issue header (verdict-first + findings list).

## ĐÃ CHỐT (thầy duyệt 2026-06-28) → apply
1. **Hướng A** — full mirror + thêm `served_model`/`served_provider` vào PP attempt (BE migration + persist aiUsage ở complete-step, mirror fix challenge) → có model byline "chấm bởi X" + tier.
2. **Route** `…/tasks/[taskId]/result` + **GIỮ left-rail milestone** (page nằm trong layout personal-project, vẫn còn rail outline chặng/task).
3. **Bỏ `UserMilestoneTaskFeedbacksModal`** — nút "Xem chi tiết phản hồi" → `router.push` page; xoá modal + overlay state (dead code).

## Build plan (apply)
- **BE** (`starci-academy-backend`): (1) cột `served_model`/`served_provider` + `@Field` trên `UserMilestoneTaskAttemptEntity`; (2) migration; (3) persist `aiUsage.model/provider` ở `review-milestone-task-complete-step.service.ts`; (4) expose 2 field ở `userPersonalTaskAttempts` query response.
- **FE**: (5) thêm 2 field vào `query-user-personal-task-attempts.ts` + entity `user-milestone-task.ts`; (6) route `…/tasks/[taskId]/result/page.tsx`; (7) `PersonalProjectTaskResult/index.tsx` (mirror SubmissionResult: verdict từ `passed`, accordion findings không-detail, "Xem repo" từ enrollment github url, model byline); (8) `PersonalProjectTaskResultHistoryDrawer` (clone `SubmissionResultHistoryDrawer`); (9) wire nút TaskActions → push page; (10) xoá `UserMilestoneTaskFeedbacksModal` + overlay; (11) i18n.
- **Seed**: `scratch/seed-pp-attempts.cjs` — resolve `user_milestone_task_id` (task "Chia Shop…" + user) → insert ~6 attempts (score 64/70/82/88/90/100, passed theo ~70) + feedbacks + served_model.
- Restart BE sau migration.
