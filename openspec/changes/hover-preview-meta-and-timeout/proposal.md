# hover-preview-meta-and-timeout — bỏ cấp độ hiển thị 2 lần, thêm 1 hàng chi tiết, và panel chỉ đóng khi hết hover

## Why

Trên thẻ hover-preview khoá học (`CourseHoverPreview`, bật khi rê chuột lên card trong shelf/lưới duyệt
khoá), thầy chỉ ra 2 vấn đề:

1. **Cấp độ khoá bị hiện HAI lần.** Panel vừa có một **chip cấp độ đứng riêng** (ví dụ "Intermediate")
   vừa lặp lại cấp độ đó trong **dòng meta** ("Intermediate · 29 bài"). Thầy: *"Hiện tại nó có 2 chữ
   Intermediate nè bạn, bỏ 1 cái đi, đưa số lesson lên ngang với tag Intermediate"* — bỏ 1 cái, và giữ
   số bài học **ngang hàng** với nhãn cấp độ (đúng chỗ dòng meta). Bỏ được chip thừa cũng **trống thêm
   1 hàng** để hiển thị thêm chi tiết khoá học (*"để trống thêm 1 hàng để hiển thị thêm chi tiết khóa
   học"*).

2. **Panel tự tắt khi vẫn đang rê chuột.** Thầy: *"Cái modal này đang có thời gian hiển thị, tôi giữ
   hover mà nó vẫn tắt, fix lại cho tôi, khi nào tôi hết hover thì mới tắt modal"* — panel biến mất khi
   người xem vẫn giữ con trỏ trên nó. Nguyên nhân: bộ lắng nghe `scroll` (capture-phase, gắn trên
   `window`) **đóng panel với BẤT KỲ scroll nào** — kể cả khi người xem cuộn chính danh sách "Khoá học
   này bao gồm" BÊN TRONG panel (một `overflow-y-auto` con vẫn phát sự kiện scroll bắt được ở capture
   phase). Ngoài ra thời gian ân hạn khi rời (100ms) hơi ngắn cho quãng con trỏ đi từ card sang panel.

## What Changes

- **Bỏ chip cấp độ ĐỨNG RIÊNG trong header panel; giữ cấp độ ở dòng meta.** Header giờ chỉ còn chip
  merchandising (Bán chạy / Mới) khi có badge; cấp độ chỉ xuất hiện MỘT lần, trong dòng meta cùng số
  bài học ("{cấp độ} · {N} bài") — đúng yêu cầu "đưa số lesson lên ngang với tag Intermediate".
- **Thêm MỘT hàng chi tiết mới (được giải phóng nhờ bỏ chip thừa), ghim trong vùng header (không
  cuộn):** đánh giá + số học viên khi summary có (⭐ {rating} · {N} học viên — mirror của
  `CatalogCourseCard`), nếu không có thì một dòng mô tả ngắn (`line-clamp-1`) lấy từ detail đã tải lười.
  Dùng đúng field dữ liệu card đã mang (`Course.rating`, `Course.enrollmentCount`) → không gọi thêm BE.
- **Panel CHỈ đóng khi con trỏ rời cả card LẪN panel:**
  - Bộ lắng nghe `scroll` **bỏ qua sự kiện scroll phát ra TỪ TRONG panel** (`panelRef.contains(target)`)
    → cuộn danh sách includes bên trong panel KHÔNG còn làm panel biến mất; chỉ scroll trang/khối cha
    (làm card trôi khỏi vị trí panel đang ghim) mới đóng — như cũ. `resize` vẫn luôn đóng.
  - Tăng thời gian ân hạn khi rời từ 100ms → **150ms** để con trỏ đi từ card sang panel (và ngược lại)
    thoải mái. Vào lại card HOẶC panel **huỷ** close đang chờ (đã có, giữ nguyên) → panel không bao giờ
    đóng khi con trỏ vẫn nằm trên card hoặc panel.
  - **KHÔNG có timer "hiện N ms rồi ẩn"**: mở panel không bị giới hạn thời gian (xác nhận: không có
    timer hiển thị cố định nào, chỉ có timer MỞ có chủ đích và timer ĐÓNG-sau-khi-rời).

## Impact

- Affected specs: `course-catalog-browse` (ADDED — 2 requirement: dọn meta panel + panel chỉ đóng khi
  hết hover).
- Affected code: `components/features/course/browse/CourseHoverPreview/index.tsx`
  (bỏ chip cấp độ đứng riêng; thêm hàng rating/learners hoặc pitch; `CLOSE_DELAY_MS` 100→150; guard
  scroll-close theo `panelRef.contains`). Thêm test `hover-open-close.test.tsx`.
- Dùng lại i18n sẵn có (`courses.learners`, `courseSystem.levels.*`, `courseSystem.catalog.lessonsCount`);
  **không** thêm khoá i18n mới, **không** đụng BE.
- **GIỮ NGUYÊN** giới hạn chiều cao panel = chiều cao card (từ `course-hover-preview-height`) và nhánh
  CTA đã-tham-gia ↔ đăng-ký (từ `enrolled-course-continue-cta`): hàng chi tiết mới nằm trong vùng
  header ghim, không đụng vùng includes cuộn hay CTA.

## Non-goals

- Không đổi vị trí ngang / cách chọn side (phải/trái) / mũi tên caret, không đổi delay MỞ (300ms), không
  đổi portal.
- Không đổi hành vi đóng khi scroll TRANG (chỉ thêm ngoại lệ cho scroll TRONG panel).
- Không đổi `CatalogCourseCard`, không đổi cap chiều cao panel.
