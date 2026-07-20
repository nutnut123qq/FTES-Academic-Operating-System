# Tasks — package-full-course-entitlement-label

## 1. i18n
- [x] 1.1 `src/messages/vi.json`: thêm `detail.package.entitlementFullCourse` = "Trọn khoá" (cạnh `entitlementSummary`).
- [x] 1.2 `src/messages/en.json`: thêm `detail.package.entitlementFullCourse` = "Full course" (cùng vị trí).

## 2. CourseDetail package picker
- [x] 2.1 Thêm helper `hasFullCourseEntitlement(pkg)` (so `type` sau `trim().toUpperCase() === "COURSE"`).
- [x] 2.2 Thay `count`-only bằng `entitlementSummary`: COURSE → `t("detail.package.entitlementFullCourse")`; else `count > 0` → `t("detail.package.entitlementSummary", { count })`; else `null`.
- [x] 2.3 Render annotation theo `entitlementSummary` (bỏ điều kiện `count > 0` cũ).

## 3. Verify
- [x] 3.1 `openspec validate package-full-course-entitlement-label --strict` xanh.
- [x] 3.2 `npx tsc --noEmit` sạch (không output, exit 0).
- [x] 3.3 `npm run build` (webpack) xanh — `✓ Compiled successfully in 2.3min`.
- [x] 3.4 E2E qua trình duyệt trên apitest (2026-07-20) — ca 3 PASS: khoá nâng cấp
      `e2e-test-20260720-01-legacy-to-package`, gói `full` có 1 entitlement `COURSE` → nhãn hiện
      **"Trọn khoá"**, KHÔNG còn "1 phần". Ca 4 chống hồi quy: khoá PACKAGE nhiều tier
      (5 gói entitlement `PART`) giữ nguyên nhãn `{count} phần`, picker đổi headline bình thường.
      Bằng chứng: `C:\Users\hahuy\Desktop\cc\E2E-FE-COURSE-CARD-2026-07-20.md` (dump DOM `ca3/ca4`).
      Ghi nhận (không chặn): gói auto-upgrade tên BE đặt sẵn là "Trọn khoá" nên nhãn hiện 2 lần —
      theo dõi riêng.
- [x] 3.5 Bộ khoá vi/en khớp nhau (4754/4754, không lệch, không mồ côi — `entitlementSummary` vẫn dùng cho gói theo phần).
