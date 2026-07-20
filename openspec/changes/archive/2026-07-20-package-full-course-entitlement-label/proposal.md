# package-full-course-entitlement-label — Gói phủ toàn khoá ghi "Trọn khoá" thay vì "1 phần"

## Why

Card chọn gói ở trang chi tiết khoá đếm mù `pkg.entitlements?.length` rồi render
`detail.package.entitlementSummary` = "{count} phần". Gói "Trọn khoá" nay chỉ mang ĐÚNG MỘT
entitlement `type = "COURSE"` phủ toàn bộ khoá ⇒ card ghi **"1 phần"**. Đây là lỗi bán hàng
nghiêm trọng: khách đọc card tưởng gói đắt nhất chỉ mở được 1 phần, trong khi nó mở cả khoá.

## What Changes

- `CourseDetail` (package picker) đổi annotation cạnh tên gói từ "đếm mù" sang phân loại:
  - Gói có bất kỳ entitlement `type === "COURSE"` → nhãn cố định **"Trọn khoá"** (en:
    "Full course"), KHÔNG kèm số. `COURSE` phủ tất nên khi gói trộn nhiều loại entitlement thì
    `COURSE` THẮNG, các entitlement còn lại không được cộng vào.
  - Gói không có `COURSE` → giữ nguyên hành vi cũ: `{count} phần` với `count = entitlements.length`,
    và `count === 0` thì không render annotation.
- i18n: thêm khoá `detail.package.entitlementFullCourse` ở cả `vi.json` và `en.json`.
  `entitlementSummary` GIỮ NGUYÊN (vẫn dùng cho gói theo phần) — không có khoá mồ côi.
- So sánh `type` không phân biệt hoa/thường (BE trả `"COURSE"`, phòng biến thể) và trim khoảng trắng.
- KHÔNG đổi BE, KHÔNG đổi contract `EntitlementView`, KHÔNG đụng giá/CTA/lock.

## Capabilities

### New Capabilities
- `course-detail`: card chọn gói SHALL gắn nhãn "Trọn khoá" cho gói có entitlement `COURSE` thay vì
  đếm số phần; các gói khác giữ cách đếm hiện có.

### Modified Capabilities
<!-- none -->

## Impact

- FE only. `src/components/features/course/CourseDetail/index.tsx` (annotation trong
  `SelectableCardGroup` items), `src/messages/vi.json`, `src/messages/en.json`.
- Verify: `npx tsc --noEmit` sạch + `npm run build` (next build --webpack) xanh; vi/en cùng bộ khoá.
