# course-enroll-cta-must-complete — nút mua ở trang chi tiết khoá không được bấm rồi đứng yên

## Why

Trang chi tiết khoá có ba trạng thái mà nút mua **bấm được nhưng không dẫn tới đâu**. Cả ba đều là ca
ĐA SỐ trên dữ liệu thật của apitest (19 khoá LEGACY / 4 khoá PACKAGE), không phải ca hiếm.

**1. Khoá không resolve được product → nút "Đăng ký học" điều hướng về chính trang đang đứng.**
`useCourseEnrollment` khi không có product chạy `router.push(detailHref)` — mà `detailHref` CHÍNH LÀ
URL trang chi tiết đang mở. Người dùng bấm, URL không đổi, không có modal thanh toán, không có thông
báo: nút chết im lặng. Trong khi đó `EnrollCard` render nút luôn ở trạng thái bấm được, không hề biết
product có resolve hay không.

**2. Khoá PACKAGE mà danh sách gói rỗng → chỉ hiện "Đang cập nhật gói", không có bước thanh toán nào.**
Đây là đúng ngõ cụt đã sửa cho tường phí trong trang học (`learn-paywall-works-on-legacy-course`):
ở đó `PackageGateModal` đã có `WholeCourseGateCard` (mua trọn khoá qua product `COURSE_UNLOCK` cấp
khoá) — nhưng trang chi tiết **chưa dùng nó**, nên vẫn kẹt.

**3. Lỗi tải danh sách gói bị in thành lỗi dữ liệu.** Nhánh `isError` (mạng hỏng / 401 / WAF chặn)
hiện đúng câu "Các gói của khóa này đang được cập nhật" — đổ lỗi cho dữ liệu trong khi đây là lỗi
fetch, và không cho người dùng cách nào thử lại.

## What Changes

- **`useCourseEnrollment` công bố `canBuy`** (`Boolean(product)`) + `isResolvingProduct`, và **bỏ hẳn
  cú `router.push(detailHref)`** vô nghĩa. Không có product thì CTA không được bấm, chứ không "đi
  đâu đó" rồi đứng yên.
- **`EnrollCard` disable nút khi không mua được** và đổi copy sang trạng thái "Chưa mở bán" + một
  dòng giải thích, thay vì nhãn "Đăng ký học" bấm được. Lối "Học thử miễn phí" vẫn còn nguyên.
- **Trang chi tiết tái dùng `WholeCourseGateCard`** (export từ `PackageGateModal`) cho nhánh khoá
  PACKAGE có danh sách gói rỗng — KHÔNG viết bản sao thứ năm của luồng
  `addCart → isFree ? checkout : payment.open`. Đó chính là lý do lỗi này sót: repo đang có 4 bản của
  cùng một luồng.
- **Tách nhánh lỗi khỏi nhánh rỗng**: lỗi tải gói hiện thông báo lỗi thật + nút "Thử lại" (revalidate),
  không mượn câu "đang cập nhật gói".

## Impact

- Affected specs: `course-detail` (ADDED).
- Affected code: `components/features/course/hooks/useCourseEnrollment.ts`,
  `components/features/course/hooks/useQueryCoursePackagesSwr.ts` (thêm `retry`),
  `components/features/course/CourseDetail/index.tsx`,
  `components/features/course/PackageGateModal/index.tsx` (export + `onClose` optional),
  `messages/vi.json`, `messages/en.json`.
- Không đụng BE. Không đổi luồng mua của khoá PACKAGE có gói.

## Non-goals

- Gộp 4 bản sao luồng `addCart → checkout/payment` về một hook dùng chung (đáng làm, nhưng là change
  riêng — ở đây chỉ TÁI DÙNG bản đã có thay vì đẻ thêm bản mới).
- Đổi cách BE quyết định khoá nào có product / có gói.
