# course-legacy-enroll-card-parity — card mua khoá LEGACY dùng chung ngôn ngữ với card chọn gói

## Why

Trang chi tiết khoá đang có HAI card mua khác hẳn nhau (`CourseDetail/index.tsx:586`):

- `saleMode = "PACKAGE"` → `PackageEnrollCard`: danh sách gói thật từ `GET /courses/{id}/packages`,
  mỗi gói có tên do admin đặt, giá bán + giá gạch + % giảm, bullet quyền lợi từ `descriptions`,
  nhãn "Đang mở" cho gói đang chọn (`defaultPackage` chỉ dùng để chọn sẵn gói ban đầu — KHÔNG có
  chip "Đề xuất" nào trong code; đính chính sau E2E 2026-07-20).
- `LEGACY` / thiếu `saleMode` → `EnrollCard`: hai tier "Free"/"Premium" **do FE tự nghĩ ra** — BE
  không có khái niệm tier cho khoá legacy — với bullet quyền lợi cứng trong i18n, trong đó
  `allChallenges` và `certificate` **không dựa trên dữ liệu nào**; khoá không có challenge hay chứng
  chỉ vẫn hiện.

Khách xem hai khoá cạnh nhau thấy như hai sản phẩm của hai hệ thống khác nhau, và card legacy hứa
những thứ khoá có thể không có.

Lưu ý phạm vi: sau change BE `course-legacy-package-upgrade`, khoá legacy nâng lên PACKAGE sẽ tự động
dùng `PackageEnrollCard` — change này CHỈ lo những khoá còn ở LEGACY trong thời gian chuyển đổi.

## What Changes

- **Bỏ tier "Free"/"Premium" bịa.** Card LEGACY hiển thị đúng những gì có thật: một lựa chọn trả phí
  "Trọn khoá" (giá bán + giá gạch + % giảm, lấy từ `course.price` như hiện nay) và — chỉ khi khoá thật
  sự có bài học thử — lối vào "Học thử miễn phí".
- **Dùng lại đúng một cách trình bày.** Tách phần render một lựa chọn mua trong `PackageEnrollCard`
  thành một component dùng chung, để card LEGACY và card PACKAGE có cùng bố cục, cùng cách hiện giá,
  cùng chip, cùng nút. Không nhân bản CSS.
- **Bullet quyền lợi chỉ từ dữ liệu thật:** số bài học và số bài học thử (đã có), bỏ `allChallenges`
  và `certificate` khỏi card cho tới khi hợp đồng BE có số liệu tương ứng. Khoá `challengeCount`
  undefined thì dòng challenge không render.
- Không đổi luồng mua: vẫn `useCourseEnrollment` (resolve product COURSE_UNLOCK cấp course → giỏ →
  PaymentModal). Không đụng `PackageEnrollCard` về mặt hành vi.

## Impact

- Affected specs: `course-detail` (MODIFIED).
- Affected code: `components/features/course/CourseDetail/index.tsx` (`EnrollCard`,
  `PackageEnrollCard` — tách phần trình bày dùng chung),
  `components/features/course/hooks/useQueryCourseDetailSwr.ts` (bỏ `plans` bịa),
  `messages/vi.json` + `messages/en.json` (bỏ khoá i18n không còn dùng).
- Không phụ thuộc BE. Có thể ship độc lập, trước hoặc sau change BE.

## Non-goals

- Dựng picker nhiều gói giả cho khoá LEGACY — BE không cho khoá LEGACY có gói; muốn nhiều gói thì
  nâng khoá lên PACKAGE.
- Đổi `PackageEnrollCard` về hành vi/nội dung.
