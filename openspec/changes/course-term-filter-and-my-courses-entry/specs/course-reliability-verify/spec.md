## ADDED Requirements

### Requirement: "Khoá học của tôi" có đường vào thật và lọc được theo kỳ

Trang `/courses/me` SHALL luôn tới được từ trong app bằng ít nhất một đường điều hướng **luôn hiện
diện** với người đã đăng nhập. Đường đó SHALL là thẻ "Khoá học của tôi" ở tab Khoá học của
`/dashboard`, qua liên kết "Xem tất cả" ngay cạnh danh sách rút gọn. Liên kết này SHALL chỉ hiện khi
người học thật sự có khoá — dẫn từ một danh sách rỗng sang một trang rỗng không phải là đường vào.

Một đường vào SHALL KHÔNG được coi là hợp lệ nếu bề mặt chứa nó không bao giờ render cho người đã
đăng nhập. Cụ thể, home landing là trang **chỉ dành cho khách** (người đã đăng nhập bị chuyển thẳng
sang dashboard), nên mọi liên kết đặt trong một band chỉ hiện với người đã đăng nhập trên trang đó
SHALL được coi là code chết, không phải đường vào.

`/courses/me` SHALL cho lọc danh sách khoá theo **kỳ học**, dựa trên kỳ đã đóng dấu trên chính
enrollment (`termId`/`termName` của `GET /courses/me/enrollments`). Bộ lọc SHALL:

- dựng danh sách kỳ từ chính các khoá người đó đang có, KHÔNG từ toàn bộ kỳ của hệ thống;
- có một nhóm **"ngoài kỳ học"** cho enrollment không thuộc kỳ nào (`termId` null) — đây là trạng thái
  phổ biến của khoá quyền vĩnh viễn và SHALL KHÔNG bị rơi khỏi mọi lựa chọn;
- vẫn xếp được vào một nhóm chọn được khi `termId` có giá trị nhưng tên kỳ null (kỳ đã bị xoá), dùng
  nhãn fallback thay vì chuỗi rỗng;
- KHÔNG render khi chỉ có một nhóm kỳ trở xuống;
- khi lọc ra 0 khoá, hiển thị trạng thái rỗng nói rõ là do bộ lọc, KHÔNG dùng lại thông điệp
  "chưa đăng ký khoá nào".

Danh sách khoá ở `/courses/me` và ở thẻ dashboard SHALL vẫn đọc từ CÙNG một nguồn dữ liệu, nên tiến độ
và trạng thái kỳ ở hai nơi SHALL KHÔNG bao giờ lệch nhau.

#### Scenario: Vào "Khoá học của tôi" từ dashboard
- **GIVEN** student đã enroll ≥ 1 khoá
- **WHEN** mở `/dashboard`, tab Khoá học, bấm "Xem tất cả" ở thẻ Khoá học của tôi
- **THEN** đi tới `/courses/me` (giữ đúng locale prefix) và thấy đúng danh sách khoá đó với tiến độ khớp

#### Scenario: Chưa có khoá thì không mời đi vào chỗ rỗng
- **GIVEN** tài khoản chưa enroll khoá nào
- **WHEN** mở tab Khoá học của dashboard
- **THEN** thẻ hiện trạng thái rỗng và KHÔNG hiện liên kết "Xem tất cả"

#### Scenario: Lọc theo kỳ
- **GIVEN** người học có khoá thuộc kỳ A, kỳ B và một khoá ngoài kỳ
- **WHEN** chọn kỳ A trong bộ lọc của `/courses/me`
- **THEN** chỉ còn khoá của kỳ A; chọn "ngoài kỳ học" thì chỉ còn khoá không thuộc kỳ nào

#### Scenario: Kỳ đã bị xoá
- **GIVEN** một enrollment mang `termId` nhưng không có tên kỳ
- **WHEN** mở `/courses/me`
- **THEN** khoá đó vẫn hiển thị và vẫn nằm trong một nhóm lọc được, nhãn dùng fallback (không phải chuỗi rỗng)

#### Scenario: Chỉ có một kỳ
- **GIVEN** mọi khoá của người học đều thuộc cùng một kỳ (hoặc đều ngoài kỳ)
- **WHEN** mở `/courses/me`
- **THEN** bộ lọc kỳ không render

## REMOVED Requirements

### Requirement: My-courses ở Home và popup menu

**Reason**: Requirement này mô tả ba bề mặt "nhất quán" mà hai trong ba đã không còn đúng:

1. Section Home (`MyCoursesSection`) là **code chết**. `HomeLanding` chuyển người đã đăng nhập thẳng
   sang `/dashboard` và `return null` trước khi vẽ, trong khi band này tự ẩn với người chưa đăng nhập
   / không có enrollment — hai điều kiện loại trừ nhau, nên nó không bao giờ render. Change này xoá
   hẳn file đó.
2. Hàng "Khóa học của tôi" trong popup account menu (`AccountMenuAuthed`) đã bị gỡ ngày 2026-08-15.

Giữ requirement này lại chỉ tạo ra một kịch bản kiểm thử không thể pass và một mô tả sai về nơi tìm
"Khoá học của tôi".

**Migration**: Thay bằng requirement "Khoá học của tôi có đường vào thật và lọc được theo kỳ" ở trên —
đường vào chuyển sang dashboard (tab Khoá học → "Xem tất cả"), `/courses/me` giữ nguyên và được bổ
sung bộ lọc kỳ. Nguồn dữ liệu chung của các bề mặt còn lại không đổi, nên yêu cầu "tiến độ khớp nhau
giữa các nơi" được giữ nguyên trong requirement mới. CTA `LESSON_COMPLETE` của quest board vẫn trỏ
`/courses/me` như cũ, không đụng tới.
