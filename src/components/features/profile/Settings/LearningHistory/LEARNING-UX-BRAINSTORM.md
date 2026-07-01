# Nhóm "Học tập" (profile settings) → Course-first learning hub (UX brainstorm)

> `/ux-brainstorm` · nhóm tab **Học tập** trong settings shell · 2026-06-18 · MAX effort
> Tham vọng thầy chốt: **"render TOÀN BỘ khóa để users xem"** — Lịch sử học không còn là bảng stats,
> mà là **trình xem toàn khóa (curriculum) phủ tiến độ của chính user**.
> Tham chiếu chất lượng = nhóm **Account** (Chỉnh sửa/Bảo mật/Phiên) — sạch nhờ PageHeader + AsyncContent
> + card gom nhóm + state-driven. **Legacy = inventory, KHÔNG bê tư duy.**

## Mục tiêu trang (≤30s user cần gì)
User vào nhóm Học tập để trả lời: **"Tôi đang ở đâu trong khóa, còn gì chưa làm, và bằng chứng tôi đã làm
được gì?"** → 1 hành động chính: **tiếp tục học** (resume). Phụ: soi lại bài nộp / lượt review / nhận xét.
Hiện trang chỉ cho 3 con số khô + danh sách "bài học gần đây" phẳng → **cắt vanity, nâng "đi tiếp được"**.

## Inventory hiện tại (4 tab cam) + pain
| Tab | Route | Đang show | Query | Pain |
|---|---|---|---|---|
| **Lịch sử học** | /profile/learning | Card progress/khóa (lessons X/Y %, challenge X/Y, milestone X/Y; **bar chỉ tính lessons**) + list "Bài học gần đây" (token phẳng) | `myCourses` + `myLearnedLessons` | Mỏng & phẳng; **không thấy cây khóa**; challenge/milestone chỉ là chữ; trộn 2 loại data (khóa + lesson) không phân cấp; không drill-down; không phân biệt đã/đang/bỏ |
| **Bài nộp challenge** | /profile/submissions | List bài nộp (challenge, khóa, status, score, lang, ngày, repo) | `myChallengeSubmissions` (paginate 20) | Phẳng, không gom theo khóa/độ khó; score không thang; không link về challenge/khóa |
| **Lượt làm milestone** | /profile/attempts | List attempt (task, milestone, khóa, pass, score, ngày) | `myMilestoneTaskAttempts` | Không thấy "attempt n/N"; không preview task; score không thang; không lịch sử retry |
| **Nhận xét** | /profile/feedback | List feedback gộp 3 nguồn (challenge/task/cv): source chip, title, khóa, summary, ngày | `myLearningFeedbacks` | Read-only, không "xem mục liên quan"; summary cụt; không rõ nặng/nhẹ |

**Account (xanh dương) hơn ở đâu (để bắt chước):** PageHeader (title+subtitle) nhất quán · AsyncContent gate đủ
4 state · card gom hành động + lời giải thích · progressive disclosure (Security lộ QR theo bước) · 1 CTA rõ.

## Dữ liệu THẬT (BE/DB) — cái gì khả dụng cho "toàn khóa + tiến độ"
**Cây khóa (cấu trúc):** `course(displayId)` trả `modules[]` (title, tier, isPremium, numContents) → mỗi module
`contents[]` (title, displayId, **minutesRead**, **difficulty**, isPremium, **numChallenges**, challenge ids).
Milestone: `milestone`/course.`milestones[]` → `tasks[]` (title, **type** design/tech/business, **maxScore**).
⚠️ **KHÔNG có 1 query trả cả cây + tiến độ**. FE `layouts/course/.../Modules` (accordion) đã render
modules→lessons từ `useQueryCourseSwr` — **tái dùng được làm xương sống**.

**Tiến độ per-item (phủ lên cây):**
- Lesson đọc/bookmark: `contentStatus(contentId)` → `{isRead, isFavorite, savedAt}` (per content).
- Challenge: `challengeSubmissionProgress(courseId)` → mỗi challenge `{status notStarted|inProgress|failed|completed, lastScore, maxScore, numAttempts, completed}`.
- Milestone task: `milestoneTaskProgress(courseId)` → mỗi task `{completed, lastScore, maxScore, numAttempts}` + `currentTask` (task chưa xong đầu tiên = **điểm resume**).
- Tổng khóa: `myCourses`/`userCourses` → `{contentCompleted/Total, challengeCompleted/Total, completed/total milestone, completionPercent}` (CQRS projection, nhanh).

**Bằng chứng (3 tab kia) đã có hook:** `myChallengeSubmissions`, `myMilestoneTaskAttempts`, `myLearningFeedbacks`
(đều paginate). Drill sâu: `userChallengeSubmissionFeedbacks` / `userMilestoneTaskFeedbacks` (message/severity/suggestion/location).

**Field CÓ nhưng CHƯA xài (cơ hội):**
- **`myXpHistory`** (ledger: source challenge/lessonRead/milestone, amount, points, courseId, createdAt) → "XP kiếm thế nào" theo dòng thời gian. Hoàn toàn chưa wire.
- **`isFavorite`/`savedAt`** (lesson bookmark) — đã có nhưng list hiện không phân biệt.
- **`minutesRead` / `difficulty` (lesson)**, **challenge.difficulty/score**, **milestoneTask.type/maxScore** — có sẵn, đang bỏ.
- **`enrollment.taskPlanStatus` / `tasksCompletedAt` / `personalProjectGithubUrl`** — trạng thái capstone, chưa show.
- **`numContents`/`numChallenges`** precomputed — dựng bar không cần đếm tay.

## Information architecture MỚI
**Trục mới = COURSE-FIRST.** Nhóm Học tập xoay quanh "1 khóa" thay vì "1 loại hoạt động":
1. **Hub khóa** (mặc định Lịch sử học): grid card mỗi khóa enrolled — title + ring %tổng + 3 mini-count
   (lessons/challenges/milestones) + nút **Tiếp tục** (nhảy `currentTask`/lesson dở). Empty = chưa enroll → CTA Khám phá khóa.
2. **Trình xem toàn khóa** (chọn 1 khóa → primary view): **accordion module → lesson/challenge/milestone**,
   mỗi dòng có **trạng thái phủ** (✓ đọc / ✓ pass / ○ chưa · lock nếu premium chưa mở), độ khó + phút đọc/điểm.
   Header sticky: %tổng + đếm + Tiếp tục. **Đây là hiện thực hóa "render toàn bộ khóa".**
3. **Bằng chứng (evidence)**: Bài nộp / Lượt milestone / Nhận xét — **gắn ngữ cảnh khóa**, cross-link 2 chiều với
   cây (bấm challenge trong cây → xem bài nộp; bấm bài nộp → về vị trí trong cây).

## 3 hướng + trade-off → CHỐT
- **A. Course-first viewer (CHỐT).** Lịch sử học = Hub khóa → Trình xem toàn khóa (cây + progress phủ). 3 tab
  kia giữ là tab "bằng chứng" nhưng **gom theo khóa + cross-link** vào cây. → đúng tham vọng nhất; 1 nơi thấy
  hết chiều sâu 1 khóa; resume mạnh. Tốn nhất (walk cây + overlay 3 nguồn progress).
- **B. Activity-log + viewer phụ.** Giữ 4 tab log (chỉ dọn theo chuẩn Account), thêm 1 chỗ "Xem khóa" mở viewer
  riêng. Ít phá vỡ, tái dùng accordion. NHƯNG tham vọng "toàn khóa" thành thứ yếu → **không đạt ý thầy**.
- **C. Gộp 1 dashboard.** Trộn hub + cây + activity 1 trang, thu 4 tab → 1–2. Holistic nhưng phá IA sidebar nhóm
  + 1 trang quá tải, khó state.

**Lý do chốt A:** thầy nói thẳng "render toàn bộ khóa để users xem" → cây-khóa-phủ-tiến-độ phải là PRIMARY, không
phải drill-down ẩn (B) cũng không nhồi 1 trang (C). A giữ được nhóm tab sidebar (đã refactor) mà vẫn nâng Lịch sử
học thành viewer thật; 3 tab kia thành "bằng chứng" có ngữ cảnh thay vì log trơ.

## Section → dữ liệu BE/DB
| Section (hướng A) | Nguồn | Ghi chú |
|---|---|---|
| Hub: card mỗi khóa (ring % + 3 count + Tiếp tục) | `myCourses` (+ `milestoneTaskProgress.currentTask` cho resume) | có sẵn |
| Cây: module → lesson | `course(displayId).modules[].contents[]` (title/minutesRead/difficulty/isPremium/numChallenges) | tái dùng `Modules` accordion |
| Phủ lesson ✓đọc/★bookmark | `contentStatus` (per content) hoặc batch | cân nhắc query batch (xem dưới) |
| Phủ challenge ✓pass/score/attempts | `challengeSubmissionProgress(courseId)` | per-course, 1 call |
| Cây: milestone → task ✓done | `milestone` + `milestoneTaskProgress(courseId)` | `currentTask` = resume |
| Tab Bài nộp (gom theo khóa, link cây) | `myChallengeSubmissions` → drill `userChallengeSubmissionFeedbacks` | có |
| Tab Lượt milestone | `myMilestoneTaskAttempts` → drill `userMilestoneTaskFeedbacks` | có |
| Tab Nhận xét | `myLearningFeedbacks` (đã gộp 3 nguồn) | có |
| (mới) dải XP "kiếm thế nào" | `myXpHistory` | field CHƯA xài |

## Empty / Loading / Error / A11y (tính từ đầu)
- **Empty**: chưa enroll khóa → empty-state `TrayIcon` + CTA "Khám phá khóa". Cây khóa rỗng (module trống) → ẩn.
- **Loading**: skeleton **mirror accordion** (module bar + 3 row lesson giả) — không spinner trần.
- **Error**: `WarningOctagonIcon` + retry (`mutate`). Premium lesson chưa mở = **lock badge**, không vỡ.
- **A11y**: accordion = HeroUI `Accordion` (đúng slot, keyboard); trạng thái ✓/○ KHÔNG chỉ bằng màu (kèm icon +
  aria-label); progress ring có `aria-valuenow`; "Tiếp tục" là 1 primary rõ ràng.

## Cắt / Thêm
- **Thêm**: Hub khóa (ring + resume) · Trình xem toàn khóa (accordion phủ progress) · cross-link cây↔bằng chứng ·
  dùng `difficulty/minutesRead/score/maxScore/type` đang bỏ · (tùy) dải `myXpHistory`.
- **Cắt**: list "Bài học gần đây" phẳng (thay bằng "Tiếp tục" + vị trí trong cây) · score-không-thang (luôn `n/max`).
- **Giữ**: 4 tab sidebar (nhóm Học tập) — KHÔNG gộp; chỉ đổi NỘI DUNG từng tab, đặc biệt Lịch sử học.

## ⚠️ Khuyến nghị BE (chốt trước khi /ux-apply)
Hiện phủ progress phải gọi **nhiều query rời** (course-tree + contentStatus×N + challengeSubmissionProgress +
milestoneTaskProgress). Sạch nhất theo house-pattern CQRS: **thêm 1 query `myCourseOutline(courseId)`** trả CẢ cây
(module→lesson/challenge/milestone) **đã phủ cờ `read/passed/done` + score + currentTask** trong 1 call (projection
+ CDC). Nếu chưa muốn đụng BE: FE walk `course` + overlay `challengeSubmissionProgress`/`milestoneTaskProgress`
(per-course, 1 call mỗi cái) + `contentStatus` cần **batch** (đừng N+1) → có thể cần `contentStatuses(ids[])` mới.

→ Thầy duyệt hướng A + chốt cách lấy progress (BE `myCourseOutline` vs FE-walk) → `/ux-apply` để dựng. KHÔNG code ở bước này.
