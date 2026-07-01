# CourseContents — "better heading" brainstorm (2026-06-21)

Trang: `/learn/content` (course-home). Phạm vi: **chỉ vùng heading** (tier-1 breadcrumb + tier-2 header), không
đụng tier-3 (search + accordion index). Thầy chỉ vào khối breadcrumb+title và ghi *"better heading"*.

## Chẩn đoán (ground: `CourseContents/index.tsx` L238–300)
1. **Lặp chữ:** breadcrumb kết `… › System Design Mastery` (crumb cuối read-only vì course-home OMIT `current`),
   rồi `Typography h3` ngay dưới lặp **y hệt** `System Design Mastery` → đọc 2 lần cùng 1 chữ.
2. **Title trống thông tin:** chỉ tên khóa, KHÔNG description, KHÔNG meta. Trong khi BE có sẵn nhưng **chưa dùng**:
   `course.entity.description`, `enrollmentCount`, `coverImageUrl`; derive được `modules.length` + tổng `giờ học`
   (Σ `lesson.minutesRead`). (Course-detail đã render đúng meta strip này: `CourseTrustStats`.)
3. **Không ranh giới** giữa danh-tính-khóa (title) và hành-động/tiến-độ (continue band) — dính 1 cụm xám.

## Dữ liệu khả dụng (đã ground qua Explore BE/DB + FE types)
| Khối heading | Field | Nguồn | Đang dùng? |
|---|---|---|---|
| Title | `course.title` | Redux `course.entity` / `outline.course.title` | ✓ |
| Description | `course.description` | Redux `course.entity` | ✗ (cơ hội) |
| Meta: level | — | (chưa fetch — cân nhắc thêm hoặc bỏ) | ✗ |
| Meta: số nội dung | `progress.lessonsTotal` / `modules.length` | outline | một phần |
| Meta: giờ học | Σ `lesson.minutesRead` | outline.modules | ✗ (cơ hội) |
| Meta: học viên | `enrollmentCount` | Redux `course.entity` | ✗ (cơ hội) |
| Cover | `coverImageUrl` | Redux `course.entity` | ✗ (cơ hội) |
| Continue | `nextContentTask ?? currentTask` | outline | ✓ |
| Progress | `progress.completionPercent` + stat line | outline | ✓ |

## 3 hướng (mockup trong chat widget `course_home_heading_directions`)
- **A — Giàu danh tính (ĐỀ XUẤT):** title H3 + `description` (gap-2, body-sm muted) + 1 hàng meta tĩnh
  (`Trung cấp · 87 nội dung · ~24 giờ · 25k học viên`), rồi `gap-6` divider → continue+progress band (giữ flat).
  Title hết "trơ" vì nó neo 1 khối header thật, không phải tên lặp lại đứng một mình. Dùng field chưa khai thác.
  Trade-off: hàng meta tĩnh hơi chạm stat line tiến-độ (`1/87…`) — phân vai rõ: meta = **catalog tĩnh**,
  stat = **tiến độ của bạn**. Neo: docs header **Stripe/Mintlify** + course header **Datacamp/Coursera**.
- **B — Ưu tiên học-tiếp (momentum):** demote tên khóa xuống 1 dòng nhỏ (breadcrumb đã mang tên rồi), HERO =
  **bài kế** ("Học tiếp · Chiến lược mở rộng hệ thống" làm heading lớn) + progress + stat. Hợp khi coi home là
  "bệ phóng tiếp tục", người học đã biết mình ở khóa nào. Trade-off: danh tính khóa yếu đi; nếu sau này muốn
  home là "cửa khóa học" thì A hợp hơn. Neo: **Duolingo / Codecademy** "continue your path".
- **C — Cover hero:** `coverImageUrl` (hoặc icon fallback) bên trái + title/desc/meta bên phải → cảm giác "cửa
  khóa học". Trade-off: cover trên trang học nội bộ = **trang trí** → chạm luật restraint/vanity (home chỉ giữ
  cái home là "nhà"); nặng hơn, dễ thừa. Neo: **Coursera/Udemy** course landing hero.

## Chốt đề xuất: **Hướng A**
Lý do: (1) fix đúng cái thầy chỉ — lặp chữ + title trơ — bằng cách **làm giàu** chứ không bỏ crumb (giữ trail
chuẩn `Home › Courses › <course>` như [[header-gap2-and-breadcrumb-everywhere]]); (2) tôn mọi luật đã chốt
(H3 không H1, continue flat không card [[course-home-vertical-rhythm-gap3]], title↔desc gap-2); (3) tiêu thụ field
BE chưa dùng (description/enrollment/giờ học) thay vì vẽ data ảo; (4) ít vanity nhất (so với C). B là phương án
thay thế mạnh nếu thầy muốn home thiên "tiếp tục" hơn "danh tính".

## Câu hỏi cần thầy chốt trước khi `/starci-fe-ux-apply`
1. Chọn **A / B / C** (hay lai)?
2. Nếu A: hàng meta giữ những mảnh nào? (level cần fetch thêm — có thể bỏ, chỉ giữ `87 nội dung · ~24 giờ ·
   25k học viên` từ field sẵn có). Có muốn cắt stat line `1/87 · 0/276 · 0/100` cũ để tránh trùng không?
3. Description: lấy `course.description` (có thể dài) → clamp 1 dòng hay 2 dòng?

## Lưu ý kỹ thuật ngoài lề (không thuộc heading, nhưng thấy khi đọc code)
- `CourseContents` wrapper còn `className="p-3"` (L219) trong khi `LearnShell` đã sở hữu `p-6` → **double padding**,
  phạm [[learn-content-padding-shell-p6]]. Nên gỡ `p-3` khi apply.
