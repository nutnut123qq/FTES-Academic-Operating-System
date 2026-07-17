# fe-starci-ui-refinements — 5 tinh chỉnh UI bám pattern StarCI Academy

## Why
Sau khi xem lại bản StarCI Academy (`../../../starci-academy`, chỉ đọc tham khảo), thầy chốt 5
điểm UI của FTES AOS chưa "gọn/đúng hierarchy" như StarCI. Đây là các refinement FE-only
trên nội dung/data đã có (không thêm contract BE): đổi cách trình bày search, card mua gói,
thứ bậc tiêu đề outline, trang profile, và bo góc thumbnail. Mỗi mục bắt chước đúng 1 pattern
đã đọc trong source StarCI.

Ghi chú đảo hướng: search hiện tại của FTES là **inline dropdown** neo dưới ô search navbar
(`SearchInline` + `SearchDropdown`) + overlay **Drawer phải** (`SearchOverlay`). Sau khi xem
StarCI (`GlobalSearchModal` — modal GIỮA màn hình, `rounded-2xl`, command-palette), thầy đổi ý:
thay dropdown-inline bằng **popup command palette ở giữa**.

## What Changes
- **search-command-palette** — Bấm ô/nút search trên navbar (hoặc Ctrl/Cmd+K) mở **POPUP GIỮA
  màn hình** `rounded-2xl` (không còn Drawer phải, không còn dropdown neo dưới navbar): ô input
  trên cùng + badge `Esc`, list kết quả **NGAY TRONG popup**. Chưa gõ → mục **"Phổ biến"**
  (gợi ý khoá phổ biến, icon + title + giá). Gõ → kết quả live (icon + title + giá/phụ đề).
  Footer hint phím `↑↓ di chuyển · ⏎ mở · Esc đóng`. Chọn 1 kết quả → **điều hướng thẳng tới
  entity**, KHÔNG mở `/search` trung gian. (Bắt chước `GlobalSearchModal` của StarCI.)
- **course-package-pricing-card** — Card mua khoá (trang chi tiết) rút gọn kiểu StarCI
  `CoursePricingRail`: **giá hiện hành LỚN** + giá gốc gạch + **badge `-%`**; dòng scarcity
  màu **cam** ("Còn N suất Early bird"); list gói dạng **RADIO** (tên gói trái, giá phải, gói
  đang mở highlight màu accent + nhãn **"Đang mở"**); nút **Enroll** primary full-width →
  **In cart** (kèm icon xoá) → **Học thử miễn phí**; dòng **"N người đã đăng ký"** dưới cùng.
  Map từ `PackageView` thật (`useQueryCoursePackagesSwr` / `PackageGate`).
- **lesson-title-hierarchy** — Trong outline khoá (syllabus trang chi tiết + learn shell nếu
  cùng pattern): **TIÊU ĐỀ buổi/section NỔI BẬT** (`font-semibold`, cỡ lớn hơn, màu foreground),
  nhãn **"Phần N"** thành **eyebrow nhỏ** phía trên (`text-xs`, màu muted); description nằm dưới
  tiêu đề. Đảo hierarchy hiện tại (nhãn phần lấn át tiêu đề).
- **profile-gamification-redesign** — Trang `/profile` bố cục lại theo StarCI `PublicProfile`:
  cột trái identity (avatar + level chip + username + followers/following + badges + nút
  **Edit/Share profile** + Joined date); cột phải các section: **Courses** (card mỗi khoá:
  badge Trial/Enrolled + % + progress bar + dòng Content/Challenges/Milestone counts — map
  `useQueryMyCoursesSwr`/progress), **Contributions** (heatmap THẬT từ
  `GET /gamification/me/activity-days` + chọn năm + dòng "X-day streak · longest Y" từ
  `/gamification/me/streak`), các section chưa có data (**Job readiness**, **Skills**) render
  **EMPTY STATE** tử tế (KHÔNG mock số). Giữ nguyên các route con profile hiện có.
- **course-detail-thumbnail-rounded** — Ảnh thumbnail trang chi tiết khoá **bo tròn**
  (`rounded-2xl`/`rounded-3xl` theo token nhà) + `overflow-hidden`.

## Capabilities
### New Capabilities
- `course-package-pricing-card`: card mua gói gọn (giá lớn + gạch + -%, radio gói, CTA 3 tầng, đã-đăng-ký).
- `lesson-title-hierarchy`: đảo thứ bậc tiêu đề section/buổi trong outline (eyebrow "Phần N" + tiêu đề nổi bật).
- `profile-gamification-redesign`: `/profile` 2 cột identity + Courses/Contributions thật + empty state.
- `course-detail-thumbnail-rounded`: bo tròn thumbnail trang chi tiết khoá.

### Modified Capabilities
- `search-command-palette`: đổi overlay Drawer/dropdown-inline → popup command palette GIỮA màn hình + mục "Phổ biến".

## Impact
FE-only, không đổi contract BE (dùng lại `PackageView`, `useQueryMyCoursesSwr`,
`useGetMyActivityDaysSwr`, `useGetMyStreakSwr`, `SelfProfile` đã có). Chế độ GẤP: implement →
`npx tsc --noEmit` sạch; finding không chặn ghi vào `tasks.md`. Không commit ở bước viết spec này.

Nơi sửa chính (file path thật):
- Search: `src/components/features/search/SearchOverlay/index.tsx` (Drawer → Modal centered),
  `src/components/features/navbar/Navbar/index.tsx` (Ctrl/K mở palette),
  `src/components/features/navbar/Navbar/SearchInline/index.tsx` + `SearchDropdown.tsx` (bỏ
  dropdown-inline, đổi thành trigger mở palette), `.../SearchOverlay/SearchOverlayResults/`,
  `.../SearchOverlay/SearchOverlayFooter/`, mục "Phổ biến" mới.
- Pricing card: `src/components/features/course/CourseDetail/index.tsx` (`PackageEnrollCard`,
  `EnrollCard`, `CardCover`).
- Outline title: `src/components/features/course/CourseDetail/index.tsx` (syllabus section
  header ~L442–473), `src/components/features/learn/ContentMap/index.tsx` (accordion trigger).
- Profile: `src/components/features/profile/ProfileShell/index.tsx`,
  `src/components/features/profile/ProfilePersonal/index.tsx`, component Courses/Contributions
  mới; hooks có sẵn `useQueryMyCoursesSwr`, `useGetMyActivityDaysSwr`, `useGetMyStreakSwr`,
  block `StreakHeatmap`.
- Thumbnail: `src/components/features/course/CourseDetail/index.tsx` (`CardCover` ~L747).
- i18n `src/messages/vi.json` + `src/messages/en.json` (đủ key cả 2 ngôn ngữ).
