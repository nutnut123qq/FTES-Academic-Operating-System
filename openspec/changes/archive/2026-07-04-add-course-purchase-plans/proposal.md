## Why

Trang chi tiết khóa học hiện chỉ có một CTA "Đăng ký học" duy nhất và nút "Học thử miễn phí" đang là no-op. Theo luật sản phẩm `premium-unlock-is-enroll-not-vip`, mỗi khóa có 2 tầng enroll: Free (free-enroll, xem ~20% + challenge) và Premium (purchased-enroll, mở toàn bộ). Cần làm rõ 2 tầng này trong card mua khóa, wire nút "Học thử", và đổi CTA theo trạng thái đã enroll — tất cả trên FE mock chờ BE course contract.

## What Changes

- Bổ sung cấu trúc 2 tầng Free / Premium vào `CourseDetail` mock contract (`useQueryCourseDetailSwr`), kèm trạng thái `isEnrolled`/`isPurchased`.
- Thay đổi card mua khóa bên phải trang chi tiết: hiển thị rõ 2 tầng Free / Premium (selector + so sánh quyền lợi), giữ PriceTag VND + USD reference + "Khóa học gồm".
- Wire nút "Học thử miễn phí" với `useMutateStartTrialSwr` (best-effort), sau đó điều hướng vào nội dung khóa học.
- CTA đổi theo trạng thái enroll: chưa enroll → primary "Đăng ký học" + secondary "Học thử miễn phí"; đã enroll → single primary "Vào học / Tiếp tục học".
- Bổ sung i18n keys mới cho 2 gói, quyền lợi, và các CTA trong `courseSystem.detail.*` (vi + en).
- Ghi chú `// ponytail:`/comment rõ phần nào là mock chờ BE.

## Capabilities

### New Capabilities
- `course-enrollment-intent`: Intent chung cho enroll / học thử / tiếp tục học, dùng lại trong card mua khóa.

### Modified Capabilities
- `course-detail`: Thay đổi yêu cầu layout card enroll bên phải để hiển thị 2 tầng Free/Premium và CTA động theo trạng thái enroll.

## Impact

- `src/components/features/course/CourseDetail/index.tsx`: thay đổi card enroll, thêm selector 2 tầng, wire CTA.
- `src/components/features/course/hooks/useQueryCourseDetailSwr.ts`: thêm field `enrollment`/`isEnrolled`/`isPurchased` + mock.
- `src/hooks/swr/api/graphql/mutations/useMutateStartTrialSwr.ts`: tái sử dụng (đã tồn tại) cho nút "Học thử".
- `src/messages/vi.json`, `src/messages/en.json`: thêm keys mới.
- Không đụng repo `FTES Admin` hay `starci-academy`; không bịa GraphQL mới; không dùng VIP/membership copy.
