# Tasks — fix-course-purchase-product-resolve

## 1. Types + resolve
- [x] 1.1 `commerce/types.ts`: `ProductForCourseView`, `CheapestProductView` (`productId`), `ProductsForCourseResponse`.
- [x] 1.2 `commerce.ts` `getProductForCourse`: đọc `{products,cheapest}`, resolve `ProductForCourseView | null` (packageId-match; hoặc cheapest.productId→products[].id; fallback products[0]; rỗng→null).
- [x] 1.3 `useGetCourseProductSwr` / `useGetCoursePackageProductSwr`: generic → `ProductForCourseView | null`.

## 2. Verify
- [x] 2.1 `tsc --noEmit` sạch.
- [x] 2.2 `npm run build` (webpack) xanh. (2026-07-23: build + tsc exit 0.)
- [x] 2.3 API: `GET for-course` shape bọc xác nhận (`cheapest.productId` vs `products[].id`); cart POST đúng productId → 200, thiếu → 400.
- [x] 2.4 UI local: course chưa seed product (combo package) → nút "Đăng ký gói" **disabled** (không còn 400) — regression khớp hành vi mong đợi.
- [x] 2.5 UI success-path (click Mua → cart 200) — hết bị chặn data. (E2E Playwright 2026-07-23 `e2e/fix-course-purchase-product-resolve.spec.ts` 2/2: WED201c có product + student chưa enroll → Mua → POST cart 200; ca disabled: gói FREE của PRF192 không có product → "Nhận gói này" disabled, 0 POST.)
