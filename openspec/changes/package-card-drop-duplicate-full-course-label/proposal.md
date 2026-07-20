# package-card-drop-duplicate-full-course-label — Bỏ nhãn "Trọn khoá" in hai lần + thống nhất chính tả

## Why

Chuỗi change "khoá LEGACY → PACKAGE" khiến BE tự tạo gói mặc định với `name = "Trọn khoá"` và
đúng MỘT entitlement `type = "COURSE"`. Change `package-full-course-entitlement-label` lại render
entitlement `COURSE` thành nhãn "Trọn khoá". Hệ quả: card gói hiện **"Trọn khoá  Trọn khoá"** —
tên gói rồi lại nhãn — và đây là hình dạng **MẶC ĐỊNH của mọi khoá auto-upgrade**, không phải ca hiếm.

Thêm một lỗi chính tả lệch ngay trên cùng một card: `detail.wholeCourse` = "Trọn khóa" còn
`detail.package.entitlementFullCourse` = "Trọn khoá" (dấu sắc đặt khác vị trí).

## What Changes

- `CourseDetail` (package picker, `SelectableCardGroup` trong `PackageEnrollCard`): khi nhãn
  entitlement TRÙNG tên gói thì **ẩn nhãn**, chỉ in tên gói một lần. So sánh sau chuẩn hoá
  (bỏ dấu tiếng Việt + trim + lowercase + gộp khoảng trắng thừa) để "Trọn khoá" / "Trọn khóa" /
  "TRỌN KHOÁ" / "Trọn  khoá" đều bắt được là trùng.
- Gói tier thường (entitlement `PART`/`LESSON`/… không có `COURSE`) **giữ nguyên** hành vi đếm
  `{count} phần` hiện có — dedupe chỉ áp cho nhánh nhãn toàn khoá.
- i18n: thống nhất chính tả HAI khoá `detail.wholeCourse` và `detail.package.entitlementFullCourse`
  trong `src/messages/vi.json` theo biến thể **"khóa"** — biến thể phổ biến áp đảo trong repo
  (`vi.json`: 165 lần "khóa" vs 54 lần "khoá"; viết hoa 44 "Khóa" vs 9 "Khoá"). CHỈ sửa 2 khoá này,
  KHÔNG đổi hàng loạt chuỗi khác.
- KHÔNG đổi BE, KHÔNG đổi contract `PackageView`/`EntitlementView`, KHÔNG đụng giá/CTA/lock/`en.json`.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `course-detail`: card chọn gói SHALL ẩn nhãn entitlement khi nó trùng tên gói (so sánh chuẩn hoá),
  thay vì in cùng một chuỗi hai lần; chính tả "Trọn khóa" SHALL thống nhất giữa card LEGACY và card gói.

## Impact

- FE only. `src/components/features/course/CourseDetail/index.tsx` (helper chuẩn hoá + annotation
  trong `SelectableCardGroup`), `src/messages/vi.json` (2 giá trị, không thêm/bớt khoá).
- Verify: `npx tsc --noEmit` sạch + `npm run build` (next build --webpack) xanh; bộ khoá vi/en không
  lệch, không mồ côi; E2E trình duyệt trên 2 ca (gói "Trọn khoá" và khoá nhiều tier).
