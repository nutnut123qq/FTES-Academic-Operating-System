## Context

`MyCoursesSection` (dải "Tiếp tục học") render grid `sm:grid-cols-2 lg:grid-cols-4` các
`ContinueCard`. `ContinueCard` bố cục **1 hàng ngang**: `cover` (shrink-0, `w-24 sm:w-28`) +
cột chữ (`min-w-0`, title `truncate` + subtitle `truncate`) + `ctaLabel` (shrink-0). Trong
`max-w-6xl` (~1120 px nội dung), 4 cột + `gap-3` → mỗi thẻ ~271 px: 112 (ảnh) + 12 + ~110
(nhãn "Tiếp tục học") ⇒ cột chữ còn ~30 px → **title/subtitle bị truncate về gần 0**.

`HomeMascotGreeting` hiện là sibling ĐỨNG SAU `MyCoursesSection` trong `HomeLanding`, bọc
trong `<section className="mx-auto ... py-10">` → một dải riêng chỉ có mascot.

Ràng buộc: `MyCoursesSection` **tự ẩn** (`return null`) khi guest / đang load / không có
enrollment → không thể chỉ "nhét mascot vào trong" rồi bỏ dải cũ, vì guest sẽ mất mascot.
Guardrail của hệ: **đúng 1 mascot / trang**.

## Goals / Non-Goals

**Goals:**
- Mascot nằm trong dải "Tiếp tục học", dưới tiêu đề, trên dãy thẻ.
- Tên khoá + "% hoàn thành" đọc được trên thẻ.
- Guest vẫn thấy đúng 1 mascot (không mất tính năng, không nhân đôi).
- Không sửa block dùng chung `ContinueCard` (còn dùng ở nơi khác).

**Non-Goals:**
- Không đổi copy/i18n, không đổi personalization của mascot.
- Không đổi thứ tự các dải khác của landing.
- Không thiết kế lại `ContinueCard` (ảnh trên - chữ dưới) — chỉ đổi số cột ở cấp feature.

## Decisions

### D1. Mascot render trong `MyCoursesSection`; dải riêng chỉ còn là DỰ PHÒNG
Thêm export `HomeMascotGreetingBand` trong `HomeMascotGreeting.tsx`: dùng lại
`useQueryMyCoursesSwr` và **`return null` khi `hasCourses`** (vì lúc đó mascot đã render bên
trong dải khoá học), ngược lại render đúng dải như hiện tại. `HomeLanding` gọi
`HomeMascotGreetingBand` thay cho `<section><HomeMascotGreeting/></section>`.

Vì sao không nâng state lên `HomeLanding` rồi truyền xuống: hook là SWR với key cố định
(`["course-my-courses"]`) → gọi ở 2 component **không phát sinh request thứ hai** (SWR dedupe
+ cache), mà giữ được mỗi dải tự quyết định hiển thị — đúng lối "band tự ẩn" đang dùng khắp
landing, không thêm prop drilling.

Đã cân nhắc: (a) copy mascot vào cả 2 chỗ rồi ẩn bằng CSS `hidden`/`sm:block` — sai, vì điều
kiện là *có enrollment* chứ không phải breakpoint, và sẽ có 2 mascot trong DOM (vi phạm
guardrail + đọc 2 lần cho screen reader). (b) Bỏ hẳn dải guest — sai, guest mất lời chào.

### D2. Thẻ tối đa 2 cột (`sm:grid-cols-2`), bỏ `lg:grid-cols-4`
Thẻ ~554 px ở desktop: 112 (ảnh) + 12 + ~110 (CTA) ⇒ cột chữ ~310 px → đủ hiện tên khoá dài
("Làm quen cơ sở dữ liệu SQL Server + JDBC") và dòng "% hoàn thành".

Đã cân nhắc: (a) 3 cột + CTA thu thành icon mũi tên → cột chữ ~230 px, đủ cho tên ngắn nhưng
vẫn bóp tên dài, lại phải sửa `ContinueCard` (block chung). (b) Đổi `ContinueCard` sang bố cục
dọc (ảnh trên - chữ dưới) → chữ được trọn chiều rộng nhưng thay đổi hình dáng block ở MỌI nơi
đang dùng, ngoài phạm vi yêu cầu. Cách 2 cột là ít rủi ro nhất và đúng nghĩa "thẻ dài ra".

Hệ quả chấp nhận: với 4 khoá (limit hiện tại) dải cao thêm 1 hàng.

### D3. Verify bằng E2E mock, không cần mật khẩu test
Máy hiện KHÔNG có `FTES_TEST_PASSWORD` nên `loginAs` không dùng được. Hook chỉ gate theo
**sự tồn tại** của `keycloak:access_token` trong localStorage, còn dữ liệu lấy từ
`GET /courses/me/enrollments` → E2E seed token giả + `page.route` mock 3 enrollment (một cái
tên rất dài, một cái không có `imageHeader`) là dựng được đúng dải cần kiểm. Lưu ý: Redux
`authenticated` vẫn false (không có Keycloak thật) nên mascot hiện **bản copy guest** — vị trí
mascot vẫn kiểm được, còn copy signed-in đã có unit/i18n phủ.

## Risks / Trade-offs

- **Mascot biến mất nếu điều kiện 2 chỗ lệch nhau** (dải khoá học ẩn nhưng band dự phòng cũng
  ẩn) → cả 2 dùng CÙNG một hook và cùng một cờ `hasCourses`, và E2E kiểm cả 2 ca (guest: đúng
  1 mascot ngoài dải; có khoá: đúng 1 mascot bên trong dải, không có mascot thứ hai).
- **Dải cao thêm khi có 4 khoá** → chấp nhận; nếu thấy dài có thể hạ `HOME_MY_COURSES_LIMIT`
  xuống 2 sau, không cần đổi bố cục.
- **Tên khoá cực dài vẫn có thể truncate** (title `truncate` 1 dòng trong block chung) → với
  ~310 px đủ cho các tên thực tế đang có; muốn 2 dòng thì phải sửa `ContinueCard` (ngoài phạm
  vi, ghi lại làm việc sau).
