# Tasks — en-full-course-wording-parity

## 1. Chọn biến thể
- [x] 1.1 Soi `en.json`: "whole course" 4 lần, "full course" 2 lần — nhưng 3/4 lần "whole course" là
      VĂN XUÔI trong câu ("learn the whole course", "across the whole course", "accompanies you the
      whole course"), không phải nhãn khái niệm; còn "full course" xuất hiện ngay CÙNG CỤM card
      (`detail.planIncludes.fullVideo` = "{duration} full course video").
- [x] 1.2 Tra spec đã archive `2026-07-20-package-card-drop-duplicate-full-course-label`: nhãn
      entitlement được chốt là `"Trọn khóa" (en: "Full course")` → chọn **"Full course"**
      (cũng khớp entitlement `COURSE` của BE). Căn cứ đã ghi vào proposal.

## 2. i18n
- [x] 2.1 `detail.wholeCourse`: "Whole course" → "Full course".
- [x] 2.2 `detail.package.entitlementFullCourse` giữ nguyên "Full course" (không đụng).
- [x] 2.3 Không đổi chuỗi văn xuôi khác, không đụng `vi.json` — `git diff src/messages/en.json`
      đúng 1 dòng (`-"wholeCourse": "Whole course"` / `+"wholeCourse": "Full course"`).

## 3. Verify
- [x] 3.1 `openspec validate en-full-course-wording-parity --strict` → `Change '...' is valid`.
      (Lần đầu fail vì câu đầu của Requirement chưa có SHALL — parser chỉ đọc dòng đầu; đã sửa.)
- [x] 3.2 Bộ khoá vi/en: `vi 4754 en 4754`, `only vi []`, `only en []` — không lệch, không mồ côi.
- [x] 3.3 `npx tsc --noEmit` → exit 0, không output.
- [x] 3.4 `npm run build` (next build --webpack) → exit 0, `✓ Compiled successfully in 103s` +
      `✓ Generating static pages using 7 workers (6/6) in 1391.4ms`. Không vướng `.next/lock`.

## 4. Còn nợ
- [ ] 4.1 Chưa E2E xem trang chi tiết khoá ở locale `en` (chỉ đổi giá trị i18n, không đổi code;
      unit test `CourseDetail/index.test.tsx` đối chiếu theo KEY nên không phủ được giá trị).
