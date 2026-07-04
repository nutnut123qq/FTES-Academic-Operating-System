## Context

Trang chi tiết khóa học (`/courses/[courseId]`) hiện có card mua khóa sticky bên phải gồm cover, PriceTag VND/USD, CTA "Đăng ký học", nút "Học thử miễn phí" no-op, và danh sách "Khóa học gồm". Theo rule `premium-unlock-is-enroll-not-vip`, khóa học có 2 tầng enroll của cùng một khóa:

- **Free** = free-enroll (`isPurchased=false`): đọc bài + challenge + ~20% nội dung.
- **Premium** = purchased-enroll (`isPurchased=true`): mở toàn bộ.

Tham khảo pattern từ `CoursePricingRail` và `CourseCtaButtons` trong `starci-academy`: card sticky bên phải, price nổi bật, CTA đổi theo enrolled-state, "Học thử" best-effort qua `startTrial` rồi vào content. Tuy nhiên repo FTES AOS chưa có BE course endpoint thật nên toàn bộ là FE mock, dùng SWR contract sẵn có.

## Goals / Non-Goals

**Goals:**
- Card mua khóa hiển thị rõ 2 tầng Free / Premium (dạng so sánh / selector), đúng ngữ nghĩa enroll.
- Nút "Học thử miễn phí" hoạt động: gọi `useMutateStartTrialSwr` best-effort rồi điều hướng vào nội dung.
- Trạng thái đã-enroll → CTA thành single primary "Vào học / Tiếp tục học".
- Giữ PriceTag VND + USD reference + "Khóa học gồm".
- i18n đầy đủ vi+en, không hardcode.

**Non-Goals:**
- Không tạo SKU/membership/VIP riêng.
- Không bịa GraphQL mới; chỉ dùng `startTrial` đã tồn tại.
- Không đụng backend repo hay `FTES Admin` / `starci-academy`.
- Không triển khai router học bài thật (route placeholder, ghi rõ).

## Decisions

### 1. Hướng UX: tier switcher inline trong card + so sánh quyền lợi
- **Chọn:** Dùng `SegmentedControl` (Free / Premium) ngay trong card, bên dưới price. Nội dung "Khóa học gồm" và CTA đổi theo tier đang chọn.
- **Lý do:** Bám sát nhất reference `CoursePricingRail` của starci-academy (card compact, price → ladder/selector → CTA), đồng thứng giữ nguyên cấu trúc card hiện tại (sticky box) thay vì chuyển sang 2 card song song chiếm chỗ.
- **Tương tác:** Khi chọn Free, CTA thứ cấp "Học thử miễn phí" nổi bật; khi chọn Premium, CTA chính "Đăng ký học" với giá.
- **Đã xem xét:** 2 card PricingCard đặt cạnh nhau — từ chối vì card bên phải hẹp, dễ bị crowded; inline switcher giữ gọn gàng và rõ ràng 2 tầng.

### 2. Trạng thái đã enroll ghi đè toàn bộ tier switcher
- **Chọn:** Khi `isEnrolled === true`, ẩn selector Free/Premium và price, chỉ hiện single primary "Vào học / Tiếp tục học".
- **Lý do:** Ngườii đã enroll không cần so sánh gói nữa; tránh confusion.

### 3. Dùng hook chung `useCourseEnrollment` cho intent
- **Chọn:** Tạo feature hook `useCourseEnrollment` trong `src/components/features/course/hooks/`.
- **Lý do:** Tách intent (enroll/continue/try) ra khỏi presentation, giống `CourseCtaButtons` reference; dễ tái sử dụng nếu sau này CTA xuất hiện ở chỗ khác.
- **Nội dung hook:** đọc `isEnrolled` từ `CourseDetail`, trả về `onEnroll`, `onContinueLearning`, `onTryLearning`.

### 4. Contract mock `CourseDetail`
- **Chọn:** Thêm `enrollment?: { isEnrolled: boolean; isPurchased: boolean }` vào `CourseDetail`. Giữ optional để không vỡ chỗ mock khác / BE cũ.
- **Lý do:** Đơn giản, đủ để render 2 trạng thái CTA; `isPurchased` phân biệt free-enroll vs paid-enroll nếu sau này cần.
- **Thêm `plans`:** `plans: { free: CourseEnrollmentPlan; premium: CourseEnrollmentPlan }` mô tả tên, giá (free = 0), badge, và danh sách quyền lợi. Shape gọn, tài liệu hoá trong design doc.

### 5. "Học thử" best-effort
- **Chọn:** Gọi `useMutateStartTrialSwr().trigger({ courseId })`; bất kể thành công/lỗi đều `router.push(learnHref)`.
- **Lý do:** Theo reference `useCourseEnrollment` của starci-academy; backend guard cũng sẽ tạo trial khi ngườii dùng thao tác đầu tiên trong khóa.
- **Route học bài:** placeholder `/courses/[courseId]/learn` vì chưa có trang content thật.

### 6. Canonical blocks dùng trực tiếp
- `PriceTag` cho VND/USD.
- `Button` (HeroUI) cho CTA.
- `SegmentedControl` cho tier switcher.
- `SectionCard` / `Card` + `CardContent` làm khung card nếu cần.
- `CheckListCard`/`CheckListItem` hoặc `IncludeRow` nội bộ cho danh sách quyền lợi.
- Không hand-roll `<div border>`/`<button hover:bg>`.

## Risks / Trade-offs

- **[Risk]** `startTrial` mutation cần auth token; khách chưa đăng nhập sẽ fail.  
  → **Mitigation:** Dùng `useRequireAuth` để bắt buộc đăng nhập trước khi nhấn "Học thử" hoặc "Đăng ký học"; flow giống CTA chính hiện tại.
- **[Risk]** Mock `enrollment` hardcode `isEnrolled=false` nên trạng thái "Vào học" khó test.  
  → **Mitigation:** Để lại comment `// ponytail: mock default false` và hướng dẫn toggle trong code để dev test; BE swap chỉ cần trả về field này.
- **[Trade-off]** Route `/courses/[courseId]/learn` là placeholder; khi có trang content thật chỉ cần đổi `pathConfig` / href.

## Open Questions

- Tên route học bài thật khi BE content page sẵn sàng (hiện placeholder).
- Có cần `useQueryCourseEnrollmentStatusSwr` riêng hay tiếp tục lấy từ `CourseDetail`? (Hiện chọn lấy từ `CourseDetail` vì chưa có query riêng.)
