# Tasks — home-continue-image-and-mascot

## 1. Đưa linh vật xuống dưới "Tiếp tục học" (CHANGE 1)
- [x] 1.1 Bỏ import + render `<HomeMascotGreeting />` khỏi `JourneyHero` (đang nằm dưới stepper trong cột chữ hero)
- [x] 1.2 Import `HomeMascotGreeting` trong `HomeLanding/index.tsx` và render NGAY SAU `<MyCoursesSection />`, bọc trong 1 section có gutter `max-w-6xl` + padding dọc
- [x] 1.3 GIỮ NGUYÊN component linh vật (copy/cá-nhân-hoá/`MascotBubble`) — chỉ reorder; vẫn 1 linh vật/trang

## 2. Ảnh bìa vào thẻ "Tiếp tục học" (CHANGE 2a)
- [x] 2.1 Thêm `EnrollmentView.imageHeader?: string | null` (additive) trong course `types.ts`
- [x] 2.2 Thêm `MyCourse.coverImage: string | null` và map `enrollment.imageHeader ?? null` trong `useQueryMyCoursesSwr`
- [x] 2.3 Truyền block nhà `CoverImage` (src = `course.coverImage`, alt = title) vào slot `cover` của `ContinueCard` ở `MyCoursesSection`, thumbnail 16:9 bo góc, bề rộng cố định `w-24 sm:w-28`, degrade khi null

## 3. Ẩn khóa chưa publish (CHANGE 2b)
- [x] 3.1 Thêm `EnrollmentView.status?: string | null` + `published?: boolean | null` (additive) trong course `types.ts`
- [x] 3.2 Thêm cổng lọc `isPublishedEnrollment` permissive (loại chỉ khi BE nói rõ chưa publish; field vắng → giữ) và áp vào `.filter(...)` cạnh `enrollment.active`
- [x] 3.3 Ghi rõ phụ thuộc BE: `GET /courses/me/enrollments` phải pre-filter khóa chưa publish + trả `imageHeader` (+ `status`/`published`)

## 4. Verify
- [x] 4.1 Sửa mock `MyCourse` trong `AiHub/index.test.tsx` (thêm `coverImage: null`) để tsc xanh
- [x] 4.2 `npx tsc --noEmit` sạch (exit 0)
- [x] 4.3 `npm run build` (webpack) xanh
