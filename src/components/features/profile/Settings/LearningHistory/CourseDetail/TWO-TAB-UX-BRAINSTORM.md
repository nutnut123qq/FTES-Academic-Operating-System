# UX Brainstorm — Learning-history CourseDetail = 2 tab (Contents · Personal Project) accordion-card (2026-06-23)

> Thầy đã CHỐT hướng. Doc này ground vào data thật + ref accordion + chốt IA để `/starci-fe-ux-apply` dựng.

## Trang
- Route: `/profile/(settings)/learning?course=<globalId>` → `LearningHistory` → khi chọn course → **`CourseDetail`**.
- Hiện tại `CourseDetail`: header khóa (icon + title + % + SegmentBar + meta) → search → **TabsCard "Theo ngày /
  Theo chương"** → Card bọc `CourseDayTimeline` (nhật ký theo ngày) hoặc `CourseOutline` (cây chương).

## Mục tiêu (job của trang)
Người học mở "Lịch sử học" của 1 khóa để soi **mình đã đi tới đâu** trên 2 trục độc lập:
1. **Nội dung khóa** (chương → bài, đã đọc/chưa) — "Contents".
2. **Dự án cá nhân / capstone** (milestone → task, đã hoàn thành/đang làm/chưa) — "Personal Project".

## Dữ liệu — KHÔNG cần BE mới ✅
**Một query `myCourseOutline` (đã wire sẵn `useQueryMyCourseOutlineSwr(rawCourseId)`) trả ĐỦ cả 2 tab:**

| Tab | Nguồn (trong `MyCourseOutlinePayload`) | Field dùng |
|---|---|---|
| **Contents** | `modules[]` → `lessons[]` | module `title`/`orderIndex`/`isPremium`; lesson `title`/`isRead`/`minutesRead`/`isPremium`/`difficulty`/`challenges[]` |
| **Personal Project** | `milestones[]` → `tasks[]` | milestone `title`/`orderIndex`; task `title`/`completed`/`lastScore`/`maxScore`/`type` |
| Header | `progress` | `lessonsRead/Total`, `challengesCompleted/Total`, `tasksCompleted/Total`, `completionPercent` |
| Auto-expand | `currentTask` / `nextContentTask` | `kind` + `id` (+ `milestoneId`) → mở sẵn đúng chương/milestone đang dở |

→ Tab Personal Project chỉ là **render `outline.milestones`** — KHÔNG thêm query (`milestoneTaskProgress` chỉ cần
nếu muốn `numAttempts`; outline đã có `completed` + `lastScore` là đủ cho trạng thái).

**Trạng thái milestone (suy từ tasks):** `done` = mọi task `completed`; `inProgress` = có task `completed` HOẶC
`lastScore>0` nhưng chưa hết; `todo` = chưa task nào động tới.
**Trạng thái task:** `completed` → done (success); `!completed && lastScore>0` → đã thử (warning); else → todo (muted).

## IA mới (CHỐT)
1. **Back link** "Lịch sử học" (giữ).
2. **Header khóa** sticky: IconTile + title (H5) + `completionPercent%` + `SegmentBar` (content/challenge/milestone)
   + 1 dòng meta muted (giữ nguyên — đang tốt).
3. **`TabsCard` (leftTabs)** = **`Contents` | `Personal Project`** — thay cặp "Theo ngày / Theo chương".
   **CHỐT 2026-06-23 (thầy duyệt): BỎ HẲN tab "Theo ngày" (`CourseDayTimeline`)** khỏi surface — đúng "2 tab".
   Code `CourseDayTimeline` giữ lại trong repo (không xóa file), chỉ bỏ render + bỏ query `courseLearningHistory`
   khỏi `CourseDetail` nếu không còn ai dùng.
4. **Search** (giữ) — lọc bài/milestone trong tab đang mở.
5. **Thân tab = ACCORDION-CARD** (pattern thầy chốt): **`<Card>` với padding `p-0` bọc 1 `Accordion`**, mỗi
   chương/milestone = 1 accordion item (divider giữa các item, KHÔNG tách N card rời như hiện tại).
   - **Contents**: item = chương → header `title` + bên phải `"n/m đã đọc"` (muted; xanh `text-success` khi đủ) +
     Indicator. Expand → rows bài: `CircleCheck`(success) nếu `isRead` / `Circle`(muted) nếu chưa + title + `phút` +
     khóa premium. Auto-mở chương chứa `nextContentTask`.
   - **Personal Project**: item = milestone → header `title` + **chip trạng thái** (Hoàn thành = success `/10` tint ·
     Đang làm = warning · Chưa làm = muted) + `"n/m"` + Indicator. Expand → rows task: icon done/đã-thử/todo +
     title + điểm `lastScore/maxScore`. Auto-mở milestone của `currentTask`.

## Ref accordion (ground, KHÔNG bịa)
- Draft **[[accordion-default-fill-everywhere]]**: MỌI accordion dùng chung 1 da — `variant="default"` +
  `overflow-hidden rounded-2xl border border-default bg-default`, trigger title `text-base font-semibold`,
  meta gom **bên phải cạnh `Accordion.Indicator`**, default mở/gập theo vai nội dung. → áp đúng cho cả 2 tab.
- Draft **[[lesson-accordion-contrast-and-size]]**: dùng `variant="default" + bg-default` (không `surface` — trùng
  nền dark), title `text-base`. → "accordion-card" = Card khung (`p-0`, `rounded-2xl border`) + Accordion fill bên
  trong, item nổi bằng `bg-default` + divider.
- **[[item-card-meta-inside-bounded-object]]** + **[[one-progress-bar-at-a-time]]**: meta/tiến độ nằm cạnh trigger,
  KHÔNG rải thanh progress mỗi item — dùng count "n/m" + chip trạng thái (gập), thanh tổng chỉ ở header khóa.

## Cắt / Thêm
- **Cắt:** tab "Theo ngày" (`CourseDayTimeline`) khỏi surface; bỏ kiểu "N chương = N card rời" → gộp 1 accordion-card.
- **Thêm:** tab Personal Project (milestone accordion + trạng thái) — data đã có, chưa từng hiện ở đây ("0 milestone"
  cũ là vì surface không render milestones, không phải thiếu data).
- **Giữ:** header khóa, search, SegmentBar, AsyncContent 4-state, breadcrumb/back.

## State (tính từ đầu)
- **loading**: skeleton mirror accordion-card (vài header item + 1 item mở vài row) — theo `/starci-fe-skeleton-apply`,
  `isLoading = data === null || data === undefined || isLoading`.
- **empty**: chưa enroll / khóa rỗng → EmptyContent (đã có). Tab Personal Project khi `milestones` rỗng → message
  "Khóa này chưa có dự án cá nhân" (tự ẩn accordion).
- **a11y**: Accordion = react-aria (HeroUI) — keyboard/aria sẵn; chip trạng thái có text, không chỉ màu.

## Đã seed để render đẹp (local, user pakoohacha588)
22/95 bài đọc (chương đầu đủ, sau thưa dần) · 100 user_milestone_tasks, **33 passed** = 6 milestone done + 1
milestone 3/5 (đang làm) + còn lại chưa làm → đủ 3 trạng thái cho tab Personal Project.

→ Thầy duyệt mockup → `/starci-fe-ux-apply` dựng (sửa `CourseDetail` + thêm `CourseMilestoneOutline` accordion-card,
tái dùng `CourseOutline` cho Contents nhưng đổi sang Card `p-0` + Accordion).
