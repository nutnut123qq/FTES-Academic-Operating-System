# home-continue-image-and-mascot — Cáo xuống dưới "Tiếp tục học", thẻ khóa có ảnh bìa, ẩn khóa chưa publish

## Why
Trên trang chủ đã đăng nhập (`HomeLanding`), luồng hiện tại là: hero (bong bóng chào
của linh vật FrosTES nằm ngay trong cột chữ của hero, gần như đầu trang) → dải
"Tiếp tục học" (`MyCoursesSection`) → phần còn lại. Thầy chốt ba điều:

1. *"Con Cáo cho xuống dưới mục tiếp tục học tập chứ bạn"* — bong bóng chào của linh vật
   đang ở TRÊN, phải đưa xuống NGAY DƯỚI dải "Tiếp tục học".
2. *"Cho ảnh vô phần này"* — các thẻ khóa trong "Tiếp tục học" hiện KHÔNG có ảnh; phải
   thêm ảnh bìa khóa học vào mỗi thẻ.
3. *"khóa học nào đang không publish thì không trả ra cho người dùng"* — khóa CHƯA publish
   không được xuất hiện trong "Tiếp tục học".

## What Changes
- **Đổi thứ tự khối anh em trên `HomeLanding`:** bỏ `<HomeMascotGreeting />` khỏi
  `JourneyHero` (nơi nó đang nằm dưới stepper trong cột chữ hero) và render nó NGAY SAU
  `<MyCoursesSection />`. Luồng đăng-nhập giờ là: hero → **Tiếp tục học** → **bong bóng chào
  linh vật** → số liệu → … Đây là REORDER thuần: component linh vật GIỮ NGUYÊN (vẫn là
  `HomeMascotGreeting` → `MascotBubble`, copy/cá-nhân-hoá không đổi, vẫn 1 linh vật/trang).
- **Ảnh bìa khóa vào thẻ "Tiếp tục học":** thẻ `ContinueCard` đã có sẵn slot `cover`; truyền
  vào block nhà `CoverImage` (khung 16:9, bo góc, `object-cover`, lazy) làm thumbnail cố định
  bề rộng bên trái hàng info. Ảnh lấy từ `EnrollmentView.imageHeader` (cùng field ảnh bìa như
  `CourseSummary.imageHeader`), map vào `MyCourse.coverImage`. Khi không có ảnh → `CoverImage`
  hiện bề mặt khung rỗng (degrade nhẹ nhàng).
- **Ẩn khóa chưa publish (defensive FE + cần BE):** hook `useQueryMyCoursesSwr` lọc bỏ enrollment
  có khóa KHÔNG publish. Cổng lọc permissive: chỉ loại khi BE nói rõ chưa publish
  (`published === false`, hoặc `status !== "PUBLISHED"`); field vắng → coi như đã publish (build
  BE cũ, hoặc BE đã pre-filter) nên không bao giờ làm rỗng dải do thiếu cờ.

## Cần BE (paired change)
Việc ẩn khóa chưa publish PHẢI được enforce ở server. `GET /courses/me/enrollments` cần:
- **Loại khóa chưa publish khỏi truy vấn** (chỉ trả enrollment của khóa `PUBLISHED`).
- **Trả kèm ảnh bìa** `imageHeader` cho từng row.
- (Nên) trả kèm `status` (hoặc cờ boolean `published`) để FE lọc phòng thủ khớp BE.
Lọc FE ở đây chỉ là lớp phòng thủ cho tới khi mọi deployment mang change BE.

## Capabilities
### New Capabilities
- `home-continue-learning`: quy định thứ tự khối quanh dải "Tiếp tục học" của trang chủ
  đã-đăng-nhập (linh vật xuống dưới), ảnh bìa trên thẻ tiếp-tục-học, và việc ẩn khóa chưa publish.

## Impact
FE, 5 file:
- `src/components/features/home-landing/HomeLanding/index.tsx` (render linh vật sau MyCoursesSection)
- `src/components/features/home-landing/HomeLanding/sections/JourneyHero.tsx` (bỏ linh vật khỏi hero)
- `src/components/features/home-landing/HomeLanding/sections/MyCoursesSection.tsx` (truyền `cover`)
- `src/components/features/course/hooks/useQueryMyCoursesSwr.ts` (lọc publish + `coverImage`)
- `src/modules/api/rest/course/types.ts` (`EnrollmentView.imageHeader/status/published` — additive)

Không thêm i18n mới (dùng key sẵn có + title khóa làm alt). Cần BE change đi kèm (xem trên).
`tsc --noEmit` + `npm run build` (webpack) phải xanh.
