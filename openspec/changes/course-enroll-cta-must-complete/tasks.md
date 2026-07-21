## 1. Nút đăng ký chỉ bấm được khi mua được

- [x] 1.1 `useCourseEnrollment`: thêm `canBuy` (`Boolean(product)`) + `isResolvingProduct`; bỏ
      `router.push(detailHref)` (điều hướng về chính trang đang đứng).
- [x] 1.2 `EnrollCard`: nút đăng ký `isDisabled` khi không mua được, nhãn `detail.notForSale` +
      dòng `detail.notForSaleHint`; khoá i18n vi+en. `notForSale = canBuy === false &&
      !isResolvingProduct` (đang tải thì CHƯA kết luận).

## 2. Khoá PACKAGE không có gói vẫn mua được

- [x] 2.1 Export `WholeCourseGateCard` + `WholeCourseGateCardProps` từ `PackageGateModal`
      (`onClose` optional — trang chi tiết không có gì để đóng).
- [x] 2.2 `PackageEnrollCard`: nhánh danh sách gói rỗng dùng `WholeCourseGateCard` (KHÔNG viết bản
      sao thứ năm của luồng `addCart → isFree ? checkout : payment.open`), vẫn giữ nút học thử.
      Mua xong revalidate course detail qua `onPurchased` (mutate của `useQueryCourseDetailSwr`).

## 3. Lỗi tải gói tách khỏi nhánh rỗng

- [x] 3.1 `useQueryCoursePackagesSwr`: trả thêm `retry` (mutate).
- [x] 3.2 `PackageEnrollCard`: nhánh `isError` riêng — `detail.package.errorTitle` /
      `errorHint` + nút `detail.retry`; khoá i18n vi+en.

## 4. Verify

- [x] 4.1 `npx tsc --noEmit` sạch (exit 0, không dòng nào).
- [x] 4.2 `npm run build` (webpack): `✓ Compiled successfully in 73s`.
- [x] 4.3 Test mới — 8 test, **mỗi nhóm đã kiểm ĐỎ trước bằng cách gỡ đúng fix ra**:

      `hooks/useCourseEnrollment.test.tsx` (2 test)
      - Gỡ fix: trả lại `router.push(pathConfig()...build())` ở nhánh không có product.
        ĐỎ: `expected "spy" to not be called at all, but actually been called 1 times`.
      - Khôi phục → 2/2 XANH.

      `CourseDetail/enrollCta.test.tsx` — nhóm EnrollCard (3 test)
      - Gỡ fix: ép `notForSale = false`.
        ĐỎ: `Unable to find an element with the text: detail.notForSale`.
      - Khôi phục → XANH.

      `CourseDetail/enrollCta.test.tsx` — nhóm PackageEnrollCard (3 test)
      - Gỡ fix: trả lại nhánh gộp `isError || isEmpty || packages.length === 0` in
        "đang cập nhật gói". ĐỎ cả 3: `detail.wholeCourse` không tìm thấy ·
        `preview.modal.emptyTitle` không tìm thấy · `detail.package.errorTitle` không tìm thấy.
      - Khôi phục → 6/6 XANH trong file.

      Chạy cả thư mục `src/components/features/course`: 13 passed / 1 failed — cái failed là
      test ĐỎ SẴN trên master (mục 5).

## 5. Ghi nhận, KHÔNG sửa trong change này

- `CourseDetail/index.test.tsx > EnrollCard (LEGACY) > renders one paid option…` ĐỎ SẴN trên
  `master` từ commit `0a7ddb8` (người khác đổi `EnrollCard` sang picker trong khi test mock
  `SelectableCardGroup` thành `<div/>` rỗng) — assert `detail.wholeCourse`, nội dung nằm trong
  picker bị mock rỗng. Thay đổi của change này KHÔNG chạm mã sinh ra chuỗi đó (chỉ thêm nhánh
  `notForSale`, mặc định `canBuy === undefined` → hành vi y hệt trước), và số test đỏ trong file
  vẫn đúng 1 như trước. Vì vậy đặt test mới ở FILE RIÊNG `enrollCta.test.tsx`.

## 6. Còn nợ / chưa verify

- Chưa E2E trên apitest (chưa mở khoá không product / khoá PACKAGE rỗng gói bằng tài khoản thật);
  mới verify ở tầng render + type + build.
- 4 bản sao luồng `addCart → isFree ? checkout : payment.open` vẫn còn (change này chỉ TÁI DÙNG
  bản trong `PackageGateModal`, không đẻ thêm bản thứ 5). Gộp về một hook dùng chung = change riêng.
