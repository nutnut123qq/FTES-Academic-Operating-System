# enrolled-course-continue-cta — thẻ hover preview khoá đã tham gia phải "Tiếp tục học", không "Đăng ký khóa học"

## Why

Thẻ hover-preview của khoá học (`CourseHoverPreview`, hiện khi rê chuột lên card trong các shelf
duyệt khoá) LUÔN hiện nút chính là **"Đăng ký khóa học"** — kể cả với khoá mà người xem **ĐÃ tham
gia**. Người học đã ghi danh rê vào khoá của mình lại thấy mời "đăng ký" một khoá họ đang học: sai
thông điệp, và bấm vào thì đưa về trang bán hàng thay vì vào học tiếp.

Đây là chỗ DUY NHẤT trong luồng duyệt khoá còn bỏ sót tín hiệu ghi danh:

- `CatalogCourseCard` (chính card mà hover-preview bọc ngoài) đã đúng — nó dùng
  `useQueryMyEnrolledSlugsSwr()` → `enrolledSlugs.has(course.id)` để đổi CTA sang "Tiếp tục học" và
  điều hướng vào `/courses/{slug}/learn`.
- Trang chi tiết khoá (`CourseDetail` / `EnrollCard` / `PackageEnrollCard`) cũng đã đúng — khi
  `isEnrolled` (từ `useCourseEnrollment` ← `course.enrollment` do `useQueryCourseDetailSwr` resolve)
  thì thu về đúng một nút "Tiếp tục học" (`detail.continueLearning`).
- Chỉ có `CourseHoverPreview` là chưa đọc tín hiệu ghi danh nào cả.

## What Changes

- **`CourseHoverPreview` đọc trạng thái ghi danh của người xem** bằng đúng hook canonical mà card
  đang dùng — `useQueryMyEnrolledSlugsSwr()`. Hook này fetch `GET /courses/me/enrollments` MỘT LẦN
  dưới SWR key dùng chung (`course-my-enrolled-slugs`), token-gated → khách vãng lai không fetch, và
  mọi card + preview trên trang tái dùng chung một request. **Không phát request per-hover, không
  cần thêm cột enrollment trên item duyệt khoá, không đụng BE.** `course.id` chính là slug mà set
  keyed theo, nên chỉ cần `enrolledSlugs.has(course.id)`.
- **CTA phân nhánh theo ghi danh:**
  - **Đã tham gia** → nhãn `courses.continueLearning` ("Tiếp tục học") + điều hướng vào
    `/courses/{slug}/learn` (đúng route card + "my courses" đang dùng). Không enroll/checkout.
  - **Chưa tham gia** → GIỮ NGUYÊN nhãn `courseSystem.browse.preview.enroll` ("Đăng ký khóa học") +
    hành vi cũ (điều hướng về trang chi tiết `/courses/{slug}` để vào luồng đăng ký).

## Impact

- Affected specs: `course-catalog-browse` (ADDED).
- Affected code: `components/features/course/browse/CourseHoverPreview/index.tsx` (thêm hook ghi danh
  + phân nhánh CTA nhãn/route). Không đổi i18n (tái dùng `courses.continueLearning` +
  `courseSystem.browse.preview.enroll` đã có ở vi + en). Không đụng BE.
- `CourseDetail` KHÔNG cần sửa — đã xử lý đúng qua `useCourseEnrollment.onContinueLearning`.

## Non-goals

- Không thêm cột enrollment vào item danh sách duyệt khoá (`Course` / `useQueryCoursesSwr`) — tín
  hiệu ghi danh đã có sẵn qua hook dùng chung, thêm cột là dư thừa và cần contract BE mới.
- Không đổi hành vi/route của nhánh chưa-ghi-danh (vẫn về trang chi tiết như cũ).
- Không gộp/đổi luồng checkout.
