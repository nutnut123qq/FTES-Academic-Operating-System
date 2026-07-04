## 1. Contract & mock data

- [x] 1.1 Thêm `CourseEnrollmentPlan` interface (name, priceVnd, badge, benefits) vào `useQueryCourseDetailSwr.ts`.
- [x] 1.2 Thêm `enrollment?: { isEnrolled: boolean; isPurchased: boolean }` vào `CourseDetail`.
- [x] 1.3 Thêm `plans: { free: CourseEnrollmentPlan; premium: CourseEnrollmentPlan }` vào `CourseDetail`.
- [x] 1.4 Cập nhật mock `fetchCourseDetailMock` với `enrollment` mặc định `isEnrolled=false`, `isPurchased=false` và 2 plans Free/Premium.

## 2. Shared enrollment intent hook

- [x] 2.1 Tạo `useCourseEnrollment` hook trong `src/components/features/course/hooks/`.
- [x] 2.2 Trả về `isEnrolled`, `onEnroll`, `onContinueLearning`, `onTryLearning`.
- [x] 2.3 `onTryLearning` gọi `useMutateStartTrialSwr().trigger({ courseId })` best-effort rồi `router.push(learnHref)`.
- [x] 2.4 `onEnroll` dùng `useRequireAuth` guard rồi route đến `/courses/[courseId]/enroll`.

## 3. Enroll card UI (CourseDetail)

- [x] 3.1 Thay thế block CTA hiện tại bằng tier selector (`SegmentedControl`) Free/Premium khi chưa enroll.
- [x] 3.2 Render benefit list khác nhau theo tier đang chọn.
- [x] 3.3 Khi chọn Free: hiển thị secondary CTA "Học thử miễn phí" + muted primary "Đăng ký học".
- [x] 3.4 Khi chọn Premium: hiển thị primary CTA "Đăng ký học" giá + secondary "Học thử miễn phí".
- [x] 3.5 Khi đã enroll: ẩn tier selector + price, chỉ hiển thị single primary "Tiếp tục học".
- [x] 3.6 Giữ PriceTag VND/USD và phần "Khóa học gồm" ở trạng thái chưa enroll.

## 4. i18n

- [x] 4.1 Thêm keys mới vào `src/messages/vi.json` nhánh `courseSystem.detail.*` cho tier names, badges, benefits, CTAs.
- [x] 4.2 Thêm keys tương ứng vào `src/messages/en.json`.
- [x] 4.3 Đảm bảo không còn chuỗi cứng trong component.

## 5. Verify & archive

- [x] 5.1 Chạy `tsc --noEmit` sạch trên file đã đổi.
- [x] 5.2 Chạy `npm run build` (webpack): compiled + TypeScript check + static pages OK; lỗi cuối cùng ở bước manifest (pages-manifest.json / next-font-manifest.json) là vấn đề build infrastructure/env, không phải code vừa đổi.
- [x] 5.3 Chạy `eslint` sạch trên file đã đổi.
- [x] 5.4 Kiểm tra JSON messages hợp lệ.
- [x] 5.5 Chạy `openspec archive` để archive change.
