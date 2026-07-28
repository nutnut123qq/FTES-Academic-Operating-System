# Tasks — package-gate-compact

## 1. Bỏ dòng "đã sở hữu N khóa học"
- [x] 1.1 Grep xác nhận `payment.loyalty.enrolled` là key CHẾT (không consumer nào truyền `PriceTag` `breakdown.loyaltyNote`)
- [x] 1.2 Gỡ key `payment.loyalty.enrolled` khỏi `messages/vi.json` ("Bạn đã sở hữu {count} khóa học")
- [x] 1.3 Gỡ key `payment.loyalty.enrolled` khỏi `messages/en.json` ("You own {count} courses"); giữ `diligent`; JSON hợp lệ cả 2 locale

## 2. Gọn shell modal
- [x] 2.1 Dialog `max-w-2xl` → `max-w-lg`
- [x] 2.2 Thumbnail cover `w-28` → `w-20`
- [x] 2.3 Thân modal `gap-4` → `gap-3`; lưới gói `gap-3` → `gap-2`; skeleton `gap-3`/`h-24` → `gap-2`/`h-20`

## 3. Gọn card gói (nhánh bán theo gói)
- [x] 3.1 `PackageGateCard`: `p-4`/`gap-3` → `p-3`/`gap-2`; cột trái name+chip `gap-1` → `gap-2`; feature list `gap-1.5` → `gap-2`
- [x] 3.2 Thay cột giá dựng tay 3 dòng bằng `<PriceTag size="sm">` (giá bán + gốc gạch + chip −X% 1 hàng); bỏ biến `discount`

## 4. Gọn card trọn khoá (nhánh legacy)
- [x] 4.1 `WholeCourseGateCard`: `p-4`/`gap-3` → `p-3`/`gap-2`; empty-state `py-6`/`gap-3` → `py-4`/`gap-2`
- [x] 4.2 Thay giá dựng tay bằng `<PriceTag size="sm">` (COURSE_UNLOCK chỉ có giá charged → không gạch/chip); giữ CTA + luồng checkout

## 5. Dọn code trùng + test
- [x] 5.1 Bỏ hàm cục bộ `formatPrice` (giờ không dùng); import `PriceTag` từ block nhà
- [x] 5.2 Test mock thêm `Chip.Label` + `Tooltip` cho `PriceTag`; giữ 3 test PackageGateModal xanh

## 6. Verify
- [x] 6.1 `npx tsc --noEmit` sạch (0 lỗi)
- [x] 6.2 `npx vitest run` PackageGateModal + course feature xanh (23 test)
- [ ] 6.3 `npm run build` (webpack) — env local chậm/dễ timeout; CI/Vercel xác minh
