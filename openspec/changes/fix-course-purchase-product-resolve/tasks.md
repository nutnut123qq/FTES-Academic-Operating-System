# Tasks — fix-course-purchase-product-resolve

## 1. Types + resolve
- [x] 1.1 `commerce/types.ts`: `ProductForCourseView`, `CheapestProductView` (`productId`), `ProductsForCourseResponse`.
- [x] 1.2 `commerce.ts` `getProductForCourse`: đọc `{products,cheapest}`, resolve `ProductForCourseView | null` (packageId-match; hoặc cheapest.productId→products[].id; fallback products[0]; rỗng→null).
- [x] 1.3 `useGetCourseProductSwr` / `useGetCoursePackageProductSwr`: generic → `ProductForCourseView | null`.

## 2. Verify
- [x] 2.1 `tsc --noEmit` sạch.
- [ ] 2.2 `npm run build` (webpack) xanh.
- [x] 2.3 API: `GET for-course` shape bọc xác nhận (`cheapest.productId` vs `products[].id`); cart POST đúng productId → 200, thiếu → 400.
- [x] 2.4 UI local: course chưa seed product (combo package) → nút "Đăng ký gói" **disabled** (không còn 400) — regression khớp hành vi mong đợi.
- [ ] 2.5 UI success-path (click Mua → cart 200) — bị chặn bởi data test (khóa có product thì student đã enroll; combo chưa seed product). Chờ seed BE hoặc 1 khóa paid có product + chưa enroll để drive full UI.
