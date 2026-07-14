# course-purchase-product-resolve — Spec

## ADDED Requirements

### Requirement: Resolve concrete productId từ response for-course bọc

Luồng mua khóa học SHALL resolve một `productId` cụ thể (một phần tử `products[]` của response bọc `GET /commerce/products/for-course/{courseId}` = `{ products, cheapest }`) TRƯỚC khi add-to-cart, và MUST NOT đọc `id` ở cấp `data` (không tồn tại → undefined → post `productId` rỗng → BE 400). Khi có `packageId`, hệ thống SHALL chọn phần tử `products[]` có `packageId` khớp và SHALL trả null nếu không khớp (không mua nhầm gói). Khi không có `packageId`, hệ thống SHALL ưu tiên `cheapest` — map `cheapest.productId` (field là `productId`, KHÔNG phải `id`) về phần tử `products[]` có `id` tương ứng — rồi fallback `products[0]`. Khi `products` rỗng, hệ thống SHALL trả null để CTA mua bị disable thay vì post `productId` rỗng.

#### Scenario: Khóa non-package có product
- **WHEN** `for-course` trả `products=[{id:P,...}]` và `cheapest={productId:P}`
- **THEN** hệ thống SHALL resolve product có `id = P`
- **AND** add-to-cart post `productId = P` (không rỗng) → BE 200

#### Scenario: Package chưa seed product khớp
- **WHEN** truyền `packageId` mà không phần tử `products[]` nào có `packageId` khớp
- **THEN** hệ thống SHALL trả null và CTA mua SHALL bị disable
- **AND** KHÔNG có request add-to-cart nào với `productId` rỗng (không còn 400)

#### Scenario: Khóa không bán
- **WHEN** endpoint 404 hoặc `products` rỗng
- **THEN** hệ thống SHALL trả null và CTA mua SHALL ẩn/disable
