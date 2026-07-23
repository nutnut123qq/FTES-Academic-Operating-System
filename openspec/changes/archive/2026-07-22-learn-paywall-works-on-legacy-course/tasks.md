## 1. Cổng thanh toán mua được trên khoá không có gói

- [x] 1.1 `PackageGateModal`: thêm `WholeCourseGateCard` — resolve product `COURSE_UNLOCK` cấp khoá
      (`useGetCourseProductSwr`) rồi chạy `thêm giỏ → PaymentModal`, cùng shape handler với
      `PackageGateCard`. Gói free (giá 0) đi thẳng checkout như nhánh gói.
- [x] 1.2 Nhánh rỗng đổi từ thông báo cụt sang `WholeCourseGateCard`; thông báo "không có gói phù hợp"
      chỉ còn khi product cũng không resolve được. Lỗi tải gói rơi vào cùng nhánh này.
- [x] 1.3 Nhánh khoá có gói giữ nguyên từng dòng.

## 2. Lớp mờ teaser

- [x] 2.1 `DocumentReader`: thêm `hasTeaserBody` (chữ / HTML / link tài nguyên); fade chỉ vẽ khi
      `locked && hasTeaserBody`.
- [x] 2.2 `LessonReader` (nhánh bài KHÔNG phải DOCUMENT, vd VIDEO): **bản sao thứ hai của đúng khối
      đó** — cùng markup, cùng lỗi. Vá lần đầu chỉ sửa `DocumentReader` nên bài VIDEO vẫn còn vệt
      trắng (sếp phát hiện trên `Buổi 1` của JPD133). Thêm `hasTeaserBody` tương tự.
      ⚠️ Nợ: hai khối này là code trùng lặp nguyên văn (`LessonReader:339-360` vs `DocumentReader`),
      nên mọi lỗi ở đây đều phải sửa hai lần. Đáng gộp về một component, tách change riêng.

## 3. Verify

- [x] 3.1 `npx tsc --noEmit` sạch.
- [x] 3.2 Test mới, **mỗi test đã được kiểm bằng cách gỡ fix ra cho nó ĐỎ trước**:
      `DocumentReader/index.test.tsx` (3 test — gỡ fix → `expected 1 to be +0`);
      `PackageGateModal/index.test.tsx` (2 test — gỡ fix → không tìm thấy `detail.wholeCourse`).
- [x] 3.3 `npm run build` (webpack) xanh.
- [x] 3.4 E2E trên apitest: mở bài PREVIEW của một khoá LEGACY → không còn vệt trắng phủ tiêu đề;
      bấm đăng ký → ra PaymentModal/QR.
      (E2E Playwright 2026-07-23 `e2e/learn-paywall-works-on-legacy-course.spec.ts` 1/1 xanh, login STUDENT
      programmatic: WED201c PREVIEW "Buổi 1" tiêu đề không vệt trắng (fade=0 khi teaser rỗng); CTA →
      PackageGateModal → WholeCourseGateCard "Trọn khóa" 399k → cart 200 → PaymentModal.)

## 4. Ghi nhận, KHÔNG sửa trong change này

- `CourseDetail/index.test.tsx` đang ĐỎ trên `master` từ commit `0a7ddb8` (PR #37, đổi `EnrollCard`
  sang picker trong khi test mock `SelectableCardGroup` thành `<div/>` rỗng). Đã xác nhận bằng cách
  stash toàn bộ thay đổi của change này rồi chạy lại — vẫn đỏ. Thuộc phần người khác đang làm.
- Câu chữ tường phí vẫn nói "Subscribe to a package…" trên khoá không có gói — cần chốt copy riêng.
- Bài DOCUMENT dạng file/link không có gì để xem thử: BE trả teaser rỗng là đúng về bảo mật, nhưng
  trải nghiệm "học thử" của bài đó hiện là màn hình trống + tường phí.
