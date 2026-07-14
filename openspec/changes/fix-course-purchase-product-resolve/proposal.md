# fix-course-purchase-product-resolve — Resolve productId đúng từ response for-course bọc

## Why

Luồng mua khóa học 400 khi thêm vào giỏ. Root cause là **contract drift FE↔BE** (BE không hỏng):
`GET /commerce/products/for-course/{courseId}` trả object **bọc** `{ products: [...], cheapest: {...} }`
KHÔNG có `id` ở cấp trên, nhưng `getProductForCourse` parse như `ProductView` phẳng rồi đọc
`product.id` → `undefined`. Guard `if (product)` vẫn true (object non-null) nên vẫn gọi
`addCart.trigger({ productId: undefined, quantity: 1 })`; axios bỏ field undefined → body `{ quantity: 1 }`
→ BE `productId must not be null` → **400** → không tạo được hóa đơn. (Marketplace không dính vì
`listProducts` trả list phẳng có `id`.)

**Gotcha then chốt (xác nhận qua live API):** hai object nested dùng **tên id khác nhau** —
`data.cheapest = { productId, priceVnd }` (field `productId`) còn `data.products[] = { id, ... }`
(field `id`). Resolve `cheapest` mà đọc `.id` vẫn undefined → phải map `cheapest.productId` về
phần tử `products[]` (cái có `.id`).

## What Changes

- `commerce/types.ts`: thêm `ProductForCourseView` (`{ id, name?, priceVnd?, priceCoin?, packageId? }`),
  `CheapestProductView` (`{ productId, priceVnd? }` — chú ý `productId`), `ProductsForCourseResponse`
  (`{ products, cheapest }`).
- `commerce.ts` `getProductForCourse`: đọc shape bọc, resolve về `ProductForCourseView | null` client-side:
  (a) có `packageId` → `products.find(p => p.packageId === packageId)` (không khớp → **null** để nút Mua
  disable, không mua nhầm gói); (b) không packageId → ưu tiên `cheapest` map `productId`→`products[].id`,
  fallback `products[0]`; rỗng → null.
- `useGetCourseProductSwr` / `useGetCoursePackageProductSwr`: generic `ProductView | null` → `ProductForCourseView | null`.
- Callers (`useCourseEnrollment`, `CourseDetail.onBuyPackage`) đọc `.id/.priceVnd/.priceCoin` — không đổi.

## Capabilities

### New Capabilities
- `course-purchase-product-resolve`: luồng mua khóa SHALL resolve một `productId` thật từ response
  for-course bọc trước khi add-to-cart; không resolve được → CTA disable, KHÔNG post `productId` rỗng.

### Modified Capabilities
<!-- none -->

## Impact

- FE only. `modules/api/rest/commerce/{types.ts,commerce.ts}`, `hooks/swr/api/rest/queries/{useGetCourseProductSwr,useGetCoursePackageProductSwr}.ts`.
- `tsc --noEmit` + `npm run build` (webpack) xanh. Verify: cart POST đúng `productId` → 200 (API); course chưa seed product → nút Mua disable (không còn 400).
- Lưu ý data: package course cần mỗi COURSE_UNLOCK product có `fulfillment_config.packageId` khớp package; chưa seed → nút disable (đúng), cần seed BE để mua được.
