# Course Card Hover Preview

## Why

Trên trang danh sách khóa học (`/courses` + category page), card hiện tại chỉ hiển thị thông tin tóm tắt (cover, tên, rating, giá). Người dùng phải click vào từng khóa để xem mô tả, "what you'll learn" và quyết định enroll — tốn một lượt điều hướng cho mỗi khóa đang so sánh. Một hover preview kiểu Udemy (popover chi tiết bên cạnh card) cho phép so sánh nhanh nhiều khóa ngay tại catalog, tăng tỷ lệ chuyển đổi enroll.

## What Changes

- Thêm **hover preview popover** cho `CatalogCourseCard`: hover chuột (desktop, `pointer: fine`) lên card sau một delay ngắn → popover chi tiết hiện cạnh card, gồm:
  - Tiêu đề khóa học + badges (Bestseller/Mới, level chip)
  - Dòng "Cập nhật <tháng/năm>" (mock)
  - Meta: tổng giờ học · level · số bài học
  - Mô tả ngắn
  - Danh sách "Bạn sẽ học được" với checkmark (tối đa 3)
  - CTA chính "Đăng ký khóa học" (enroll — điều hướng đến trang chi tiết khóa, KHÔNG "Nạp VIP") + nút wishlist (reuse `SaveButton`)
- Popover định vị **trái/phải card tuỳ vị trí trong viewport** (flip tự động), có mũi tên/caret trỏ về card.
- **Chỉ desktop**: thiết bị touch/coarse pointer không có hover → không render popover, card giữ hành vi tap-to-navigate hiện tại.
- Mở rộng mock `Course` (`useQueryCoursesSwr`) thêm các field optional cho popup: `description`, `learnOutcomes` (string[]), `updatedAt` — **giả định**: BE sẽ cung cấp các field này trong course list endpoint; hiện mock FE-only.
- i18n vi + en cho mọi string mới.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `course-catalog-browse`: thêm requirement mới — hover preview popover trên shared course card (nội dung, định vị, delay, desktop-only, a11y, degrade khi thiếu field). Mock `Course` model mở rộng thêm `description`/`learnOutcomes`/`updatedAt`.

## Impact

- **Code**:
  - `src/components/features/course/browse/CatalogCourseCard/` — bọc card bằng hover-preview wrapper (component mới trong cùng feature family, vd `CourseHoverPreview`).
  - `src/components/features/course/hooks/useQueryCoursesSwr.ts` — mở rộng interface `Course` + mock data.
  - `src/i18n` message catalogs (vi + en) — namespace `courseSystem.browse.preview.*`.
- **Không đụng**: `blocks/cards/CourseCard` (GraphQL entity card), BE, routing.
- **Dependencies**: không thêm dependency mới — dùng HeroUI Popover/hover primitives + Tailwind sẵn có.
- **Ràng buộc dự án**: CTA theo luật [[premium-unlock-is-enroll-not-vip]] — enroll khóa, không membership/VIP.
