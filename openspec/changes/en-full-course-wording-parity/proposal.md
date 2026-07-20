# en-full-course-wording-parity — Thống nhất ngữ tiếng Anh cho "trọn khoá"

## Why

`src/messages/en.json` đang dùng HAI chuỗi khác nhau cho CÙNG một khái niệm, hiển thị ngay trên
cùng một card chi tiết khoá:

- `detail.wholeCourse` = "Whole course" (card mua khoá LEGACY)
- `detail.package.entitlementFullCourse` = "Full course" (nhãn entitlement `COURSE` trên card gói)

Bên `vi.json` đã được thống nhất thành "Trọn khóa" ngày 2026-07-20
(`package-card-drop-duplicate-full-course-label`), nhưng `en.json` thì chưa — nên bản tiếng Anh
vẫn lệch. Ngoài ra luật dedupe nhãn-trùng-tên-gói so sánh nhãn với tên gói theo chuỗi đã chuẩn hoá;
hai biến thể khác nhau làm ngữ nghĩa "cùng một nhãn" mờ đi.

## What Changes

- Chọn MỘT biến thể cho cả hai khoá: **"Full course"**. Căn cứ:
  - Spec đã archive của `package-card-drop-duplicate-full-course-label` ghi rõ nhãn entitlement là
    `"Trọn khóa" (en: "Full course")` — tức bản tiếng Anh chuẩn đã được chốt là "Full course".
  - Khớp thuật ngữ entitlement `COURSE` của BE (toàn khoá) và khớp chuỗi cùng cụm card
    `detail.planIncludes.fullVideo` = "{duration} full course video".
  - Các lần "whole course" còn lại trong `en.json` đều là **văn xuôi trong câu** ("learn the whole
    course", "across the whole course", "accompanies you the whole course") — không phải nhãn của
    khái niệm entitlement, nên không dùng làm căn cứ và KHÔNG đổi.
- `detail.wholeCourse`: "Whole course" → "Full course". `detail.package.entitlementFullCourse` giữ
  nguyên "Full course".
- CHỈ sửa đúng 1 giá trị; KHÔNG thêm/bớt khoá, KHÔNG đổi hàng loạt chuỗi khác, KHÔNG đụng `vi.json`,
  KHÔNG đụng code TSX/BE.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `course-detail`: hai khoá i18n chỉ cùng một khái niệm "trọn khoá" SHALL dùng cùng một chuỗi trong
  `en.json` ("Full course"), song song với luật đã có cho `vi.json` ("Trọn khóa").

## Impact

- FE only, i18n only: `src/messages/en.json` (đúng 1 dòng đổi giá trị).
- Không đổi hành vi component: `CourseDetail` vẫn đọc cùng key, unit test đối chiếu key
  (`detail.wholeCourse`) nên không ảnh hưởng.
- Verify: `npx tsc --noEmit` sạch + `npm run build` (next build --webpack) xanh; bộ khoá vi/en không
  lệch số lượng, không khoá mồ côi.
