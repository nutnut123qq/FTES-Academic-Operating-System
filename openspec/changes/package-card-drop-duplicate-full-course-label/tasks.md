# Tasks — package-card-drop-duplicate-full-course-label

## 1. i18n — thống nhất chính tả (chỉ 2 khoá)
- [x] 1.1 Đếm biến thể trong `src/messages/vi.json` để chọn chuẩn — "khóa" 165 vs "khoá" 54; viết hoa "Khóa" 44 vs "Khoá" 9 → chọn **"khóa"**.
- [x] 1.2 `detail.package.entitlementFullCourse`: "Trọn khoá" → "Trọn khóa".
- [x] 1.3 `detail.wholeCourse` đã là "Trọn khóa" (đúng chuẩn) → KHÔNG phải sửa. Hai khoá nay khớp nhau.
- [x] 1.4 KHÔNG đụng chuỗi khác trong `vi.json`, KHÔNG đụng `en.json` (diff vi.json đúng 1 dòng).

## 2. CourseDetail — bỏ nhãn trùng tên gói
- [x] 2.1 Thêm `normalizeLabel()` — `NFD` → cắt `\p{M}` (bỏ dấu) → trim → lowercase → gộp khoảng trắng.
- [x] 2.2 Nhánh `hasFullCourseEntitlement`: `normalizeLabel(pkg.name) === normalizeLabel(fullCourseLabel)` → `null` (ẩn nhãn), ngược lại vẫn render nhãn.
- [x] 2.3 Nhánh đếm `{count} phần` giữ NGUYÊN, không đụng.

## 3. Verify
- [x] 3.1 `openspec validate package-card-drop-duplicate-full-course-label --strict` → `Change '...' is valid`.
- [x] 3.2 `npx tsc --noEmit` sạch (exit 0, không output).
- [x] 3.3 `npm run build` (next build --webpack) → `✓ Compiled successfully in 63s` + `✓ Generating static pages using 7 workers (6/6)`.
      Lần chạy đầu vướng `.next/lock` của một build song song từ session khác → CHỜ build đó xong rồi
      xoá đúng file `lock` (không xoá `.next`, không kill process của họ).
- [x] 3.4 Bộ khoá vi/en: 4754/4754, `only vi: []`, `only en: []` — không lệch, không mồ côi.
- [x] 3.5 Unit test `CourseDetail/index.test.tsx` 4/4 xanh.
- [x] 3.6 E2E chống hồi quy (dữ liệu THẬT apitest) — `goi-prf192prf193---nhap-mon-lap-trinh-cc`:
      `FREE 3 phần · BASIC 4 phần · PREMIUM 6 phần · MASTER 6 phần · Ôn tập thực chiến 2 phần`,
      **0 lần** chữ "Trọn kho…" — trùng khít dump trước change.
- [x] 3.7 E2E ca gói trọn khoá — ⚠️ chạy với **payload `/packages` dựng lại ở tầng mạng**, KHÔNG phải
      khoá thật: khoá fixture cũ `e2e-test-20260720-01-legacy-to-package` **đã bị xoá khỏi apitest**
      (`GET /api/v1/courses/{slug}` → 404) và quét cả 23 khoá thì **không khoá PACKAGE nào còn gói có
      entitlement `COURSE`** (đều `PART`). Nên intercept XHR trả đúng hình dạng BE auto-upgrade rồi để
      FE render thật trên `/vi/courses/demo-java-nang-cao`. Kết quả 3 hàng:
      - `Trọn khoá` + `[COURSE]` → nhãn **KHÔNG render**; DOM chỉ còn
        `<span class="truncate">Trọn khoá</span>` (không có span `shrink-0 text-[11px]`).
      - `Gói VIP` + `[COURSE]` → vẫn có `<span class="shrink-0 text-[11px] leading-none text-muted">Trọn khóa</span>`.
      - `"  TRỌN   KHOÁ "` + `[COURSE]` → nhãn **KHÔNG render** (chuẩn hoá bắt được lệch dấu/hoa/space).

## 4. Còn nợ
- [ ] 4.1 Chạy lại 3.7 trên khoá PACKAGE THẬT khi apitest có lại một khoá auto-upgrade
      (gói `name="Trọn khoá"` + entitlement `COURSE`).
