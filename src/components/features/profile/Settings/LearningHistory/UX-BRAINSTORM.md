# UX-BRAINSTORM — Lịch sử học (per-course "học theo ngày" + search)  (2026-06-18)

> Route: `/profile/learning`. Yêu cầu thầy: click 1 khóa → trang riêng show **nội dung đã học theo NGÀY**
> (kiểu activity feed, hình 3) + **thanh search**. Hình 2 (course card có IconTile + % + SegmentBar) = chuẩn render
> danh sách khóa. KHÔNG bịa data cho field không tồn tại.

## 0. Mục tiêu trang (≤30s)
- **Hub:** "tôi đang học những khóa nào, tới đâu rồi?" → chọn nhanh 1 khóa để tiếp tục/ôn.
- **Detail (mới):** "trong khóa này tôi đã học GÌ, NGÀY NÀO?" → một **nhật ký học theo ngày** ôn lại được + tìm 1 bài
  cụ thể bằng search. Đây là góc nhìn **learner-first** (tự nhìn lại hành trình), khác activity tab (flex/public).

## 1. Inventory (legacy chỉ để biết có gì)
- **Hub hiện tại** (`LearningHistory/index.tsx`): grid course card (label + lessons/challenge/milestone + ProgressMeter),
  click → set `?course=<globalId>` (`useSelectedCourse`) → render `CourseOutline` (cây module→lesson, Accordion + ListRow
  + DifficultyChip/StatusChip). Pain: card đời cũ (ProgressMeter 1 thanh, chưa SegmentBar như hình 2); detail = cây
  chương khô khan, KHÔNG có trục thời gian "đã học hôm nào", KHÔNG search.
- **Tái dùng được:** `IconTile` + `SegmentBar` (OverviewCourses, hình 2) · day-grouping `startOfDayMs`/`dayGroups` +
  header Hôm nay/Hôm qua/date (`ProfileActivity`, hình 3) · search `TextField`+`Input` client-filter (`Bookmarks`) ·
  `ListRow`/`DifficultyChip`/`StatusChip` + `toDifficulty/toStatusTone` (CourseOutline/map.ts) · `useQueryMyCoursesSwr`,
  `useQueryMyCourseOutlineSwr(courseId)`, `useSelectedCourse` (URL `?course=`).

## 2. ⚠️ DATA GAP (quyết định scope — phải đọc trước)
| Cần cho timeline theo ngày | Có sẵn? | Gap |
|---|---|---|
| Mốc thời gian đọc 1 bài (per lesson) | ❌ | `UserContentEntity` chỉ `is_read`+`updated_at` (đổi cả khi favorite) → KHÔNG đáng tin làm "ngày học" |
| Sự kiện học gắn **courseId** + timestamp thật | ⚠️ | `activities.lessonRead` có `created_at` thật nhưng **global, không có courseId** |
| Cây khóa + `isRead` per lesson | ✅ | `myCourseOutline` (nhưng không có ngày) |

**Kết luận:** "học theo ngày" **cần BE mới**. 2 lựa chọn (đề xuất A):
- **(A) khuyến nghị — `courseLearningHistory(courseId)`**: join `activities → content → module` lọc theo course,
  trả các event `lessonRead`/`challengePassed`/`milestonePassed` (label + `at` thật), newest-first. FE group theo ngày.
  Đúng tinh thần "nhật ký" + tận dụng `created_at` đã chính xác.
- **(B) rẻ hơn — thêm `readAt: timestamptz` vào `UserContentEntity`** (set 1 lần khi đọc thật) + expose `readAt` trên
  `MyCourseOutlineLesson`. FE group lesson `isRead` theo `readAt`. Nhược: chỉ có lesson, thiếu challenge/milestone vào dòng thời gian.

## 3. Hướng (≥2) + CHỐT
- **H1 — Hub đẹp lại + Detail = nhật ký theo ngày (CHỐT).** Hub: card hình-2 (IconTile + % + SegmentBar) + search lọc
  khóa. Click → Detail: header khóa (sticky, progress) + search bài + **toggle `Theo ngày | Theo chương`**: "Theo ngày"
  = timeline hình-3 (CẦN BE §2A); "Theo chương" = `CourseOutline` cũ (đã có, dùng để xem cái CHƯA học). Search lọc cả 2.
- **H2 — 1 timeline "nhật ký học" toàn-khóa, filter bằng chip khóa.** Dùng `userFeed` global lọc client. Ít BE hơn
  nhưng **trái yêu cầu** (thầy muốn click TỪNG khóa ra trang riêng) → loại.
- **H3 — chỉ thêm cột "ngày" vào outline.** Nhẹ nhưng không ra "nhật ký", phân cấp vẫn theo chương → loại.

**Chọn H1**: đúng literal ask (per-course + theo ngày + search), tái dùng tối đa block đã có, và GIỮ outline cũ làm
view "còn gì chưa học" thay vì vứt. Day-view BE-blocked (§2A) → ship được phần khả thi trước.

## 4. IA mới
**Hub `/profile/learning`** (1 scroll, không sticky — list ngắn):
1. PageHeader "Lịch sử học" + sub.
2. Search (lọc tên khóa) — chỉ hiện khi ≥ ~4 khóa.
3. Grid course card hình-2: `IconTile` + label + `%` + `SegmentBar` (content/challenge/milestone) → PressableCard `?course=`.
- Empty: chưa enroll → CTA "Khám phá khóa học". Loading: skeleton card ×3. Error: ErrorContent.

**Detail `?course=<id>`**:
1. Back link "← Lịch sử học" (`setSelectedCourse(null)`).
2. **Course header** (sticky top): IconTile + title + % + SegmentBar + meta (đã học N/M bài · N challenge · N milestone).
3. Search bài (client filter theo title) + toggle `Theo ngày | Theo chương`.
4. **Theo ngày** (default, CẦN BE §2A): day-group (Hôm nay/Hôm qua/date) → mỗi dòng = ListRow: icon loại
   (lesson `BookOpenIcon`/challenge `PuzzlePieceIcon`/milestone `FlagIcon`) + title + module/loại + DifficultyChip + giờ-trước.
   - Empty (chưa học ngày nào / search rỗng): EmptyContent `align="center"`. BE chưa có: empty "Sắp ra mắt" hoặc ẩn toggle.
5. **Theo chương**: `CourseOutline` cũ (lọc theo search).

## 5. Section → dữ liệu
| Section | Field |
|---|---|
| Hub card | `userCourses`: globalId/label/contentCompleted/Total, challenge*, completed/total, completionPercent |
| Detail header | `myCourseOutline.course` + `.progress` |
| Theo chương | `myCourseOutline.modules[].lessons[]` (isRead, difficulty, minutesRead, challenges) |
| **Theo ngày** | **`courseLearningHistory(courseId)` (MỚI, §2A)** — events {type, label, at, difficulty?, moduleTitle?} |
| Search | client-filter title (Bookmarks pattern) |

## 6. Cắt / thêm
- **Thêm:** SegmentBar cho hub card (bỏ ProgressMeter 1 thanh) · search hub + detail · day-timeline · toggle ngày/chương · sticky course header.
- **Giữ:** CourseOutline (thành tab "Theo chương") · `useSelectedCourse` URL `?course=` (deep-link, back mượt).
- **Cắt:** không.
- **BE TODO (flag thầy):** `courseLearningHistory(courseId)` [A] hoặc `readAt` trên user_contents + outline lesson [B].

## 7. A11y / state
- Toggle = `ExtendedTabs` (role tablist). Search `Input` có `aria-label`. Mỗi fetch bọc `AsyncContent`.
- Canh giữa empty/error bằng `align="center"` (Typography bake align). Icon trang trí `aria-hidden`.
