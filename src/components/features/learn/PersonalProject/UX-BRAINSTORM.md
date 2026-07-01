# UX-BRAINSTORM — Personal Project: dashboard khi chưa chọn task (2026-06-21)

> Brainstorm (KHÔNG code). Thầy duyệt hướng → `/starci-fe-ux-apply` mới dựng.

## Vấn đề (audit)
- **Index `/personal-project` (no `tasks/[id]`) render `<></>` rỗng** (`personal-project/page.tsx`). Vào trang =
  rail trái + breadcrumb + **cột giữa TRỐNG** cho tới khi bấm 1 task. Đúng nghĩa "tục".
- **Lệch 3-tier:** breadcrumb nằm `<div className="p-6 pb-0">` riêng, **không** `max-w-3xl`, **thiếu H3 header**
  ở layout (H3 hiện bị chôn trong card brief). Spacer breadcrumb↔content baked vào `p-6`, không gap tường minh.
- Settings GitHub = `<button>` bespoke (affordance mờ). Rail mất hẳn trên mobile (no drawer). `selectedTaskId`
  không persist → refresh về trang trống.

## Mục tiêu trang (≤30s)
Khi chưa chọn task, learner phải thấy ngay: **mình tới đâu · làm gì tiếp · repo đã kết nối chưa · bấm vào học**.
Một primary action = **Tiếp tục**. Cắt vanity, không lặp lại nav (rail trái đã làm điều hướng).

## Dữ liệu CÓ THẬT (BE/DB) → map section
| Cần cho dashboard | Nguồn BE | Field |
|---|---|---|
| % tiến độ tổng | `milestoneTaskProgress` | `completionTasks[]` (count `completed`) / total |
| Nhiệm vụ kế tiếp ("Tiếp tục") | `milestoneTaskProgress` | `currentTask{ id, lastScore, maxScore, numAttempts }` |
| Roadmap chặng | `milestones` | `[{ id, title, sortIndex, tasks[] }]` |
| Done/total mỗi chặng | `milestones` × `milestoneTaskProgress` | join tasks↔completionTasks |
| Loại nhiệm vụ | `MilestoneTask.type` | Business / Design / TechIntegrate |
| Trạng thái GitHub | `enrollment` | `personalProjectGithubUrl / Branch / TokenLast4` |
| Trạng thái kế hoạch | `enrollment` | `taskPlanStatus` (Locked/InProgress/Completed), `tasksCompletedAt` |
| Điểm mới nhất + feedback | `lastPersonalTaskAttempt` (currentTask) | `score / passed / shortFeedback / processedAt` |
| Tổng lần nộp / điểm | `completionTasks[]` | `numAttempts`, `lastScore`, `maxScore` |
| Khoá vs mở | suy từ `completionTasks` + `currentTask` | (locked = chưa có UserMilestoneTask) |

Field chưa khai thác đáng dùng: `taskPlanStatus`/`tasksCompletedAt` (badge "Hoàn thành dự án"), `type` (chip phân loại),
`numAttempts` (độ kiên trì), điểm TB.

## Ref (web/house)
- **ClickUp project dashboard** — cards + KPI + progress, role-driven. [clickup.com/blog/project-dashboard-examples](https://clickup.com/blog/project-dashboard-examples/)
- **Boot.dev capstone / guided path** — "continue" 1 hành động chính, scope→ship. [boot.dev/courses/build-capstone-project](https://www.boot.dev/courses/build-capstone-project)
- **roadmap.sh / PBL dashboard (Springer)** — milestone signposts "bạn đang ở đâu / làm gì tiếp"; phân loại data theo project-goal + learning-goal. [roadmap.sh/ux-design](https://roadmap.sh/ux-design) · [Springer PBL dashboard](https://link.springer.com/content/pdf/10.1007/978-3-642-33263-0_20.pdf)
- **Frontend Mentor** — project cards + style guide + progress, "continue watching"-style re-entry. [frontendmentor.io](https://www.frontendmentor.io/)
- House: [[three-tier-page-layout]] · [[one-progress-bar-at-a-time]] · [[rail-long-title-and-spacing]] · `PageHeader` block.

## 3 hướng
### A — "Project HQ" (overview-first) ⭐ CHỐT
3-tier chuẩn → tier-3 = **top row 3 card** [vòng tiến độ % + n/m nhiệm vụ] · [**Tiếp tục →** currentTask (primary)] ·
[GitHub đã kết nối / CTA kết nối] → **strip stats** (đã đạt · đang khoá · lần nộp · điểm TB). **KHÔNG** lặp danh sách
chặng (rail trái lo nav). 1 primary = Tiếp tục.
- **Trade-off:** gọn, quét nhanh, không trùng rail, ít surface mới. Ít "wow" hơn B.
- **Vì sao chốt:** đúng mục tiêu ≤30s + 1 action; bổ trợ rail thay vì trùng; mọi card neo field thật; khít 3-tier.

### B — "Roadmap-first" (the journey)
Tier-3 = **roadmap chặng dạng card/stepper dọc** làm xương sống: mỗi chặng = card (chip loại + done/total + "Vào chặng →"),
chặng hiện tại highlight. Tiến độ + GitHub = slim summary bar trên.
- **Trade-off:** đẹp/động viên, hợp PBL roadmap; NHƯNG **trùng vai rail** (rail cũng list chặng→task) → 2 nơi điều hướng,
  nặng dựng hơn.

### C — "Continue + at-a-glance" (minimal)
Tier-3 = **1 card Tiếp tục lớn** (tên task + chặng + điểm gần nhất + nút Continue) + strip stats + link "Xem 5 chặng" gập.
- **Trade-off:** nhẹ nhất, đúng "đưa tôi vào học"; nhưng mỏng so với "dashboard" thầy muốn, ít thông tin tổng.

## Cơ chế render (apply sau)
- Switch trong `PersonalProjectWorkspace` (hoặc layout): `useParams().taskId` **vắng** → `<PersonalProjectDashboard/>`;
  **có** → workspace Task+Panel hiện tại. (Index `page.tsx` vẫn rỗng — layout cầm switch.)
- **Kèm fix audit 3-tier:** gộp breadcrumb + **H3 header** (`PageHeader`) + content vào **một** `max-w-3xl mx-auto`,
  spacer `h-3` đều, bỏ `p-6 pb-0` lệch.
- States: loading = skeleton mirror (vòng + 3 card) qua `AsyncContent`; empty (chưa enroll/chưa có chặng) =
  EmptyContent; GitHub chưa kết nối = card CTA, không phải lỗi.

## Cắt / thêm
- **Cắt:** cột giữa trống; H3 chôn trong card; breadcrumb lệch width.
- **Thêm:** vòng/bar tiến độ tổng · nút **Tiếp tục** (currentTask) · card trạng thái GitHub · strip stats (đã đạt/khoá/
  lần nộp/điểm TB) · badge `taskPlanStatus` khi Completed.
