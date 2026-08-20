## ADDED Requirements

### Requirement: Facet kỳ học trên catalog

Catalog SHALL cho phép lọc theo **kỳ học**. Danh sách kỳ SHALL lấy từ endpoint kỳ CÔNG KHAI
(`GET /api/v1/terms`, không cần đăng nhập) — khách chưa đăng nhập xem được catalog thì cũng SHALL
dùng được bộ lọc này.

Việc lọc SHALL do SERVER thực hiện qua tham số `termId` của endpoint catalog, giống cách category
đang làm, và `termId` SHALL nằm trong khoá cache phía client để mỗi kỳ được nhớ riêng. Catalog SHALL
KHÔNG tự lọc theo kỳ ở phía client — client không biết khoá nào thuộc kỳ nào.

Lựa chọn mặc định SHALL là "tất cả kỳ" (không gửi tham số kỳ). Chuỗi rỗng SHALL KHÔNG bao giờ được
gửi lên như một giá trị kỳ.

Khi không có kỳ nào đọc được (danh sách rỗng, hoặc lời gọi thất bại), facet kỳ SHALL KHÔNG render và
catalog SHALL hoạt động y như khi chưa có tính năng này. Bộ lọc kỳ là phần thêm vào; vắng dữ liệu kỳ
SHALL KHÔNG làm hỏng trang.

Facet kỳ SHALL kết hợp AND với category, tìm kiếm và các facet còn lại.

#### Scenario: Khách lọc theo kỳ
- **GIVEN** người xem CHƯA đăng nhập đang ở `/courses`
- **WHEN** họ chọn một kỳ trong facet kỳ
- **THEN** lưới chỉ còn khoá thuộc kỳ đó, và facet vẫn dùng được (không có màn đăng nhập nào chen vào)

#### Scenario: Về "tất cả kỳ"
- **WHEN** người dùng chọn lại "tất cả kỳ"
- **THEN** catalog trở lại đúng tập khoá như khi chưa lọc theo kỳ

#### Scenario: Đổi kỳ liên tiếp
- **GIVEN** người dùng vừa xem kỳ A
- **WHEN** họ đổi sang kỳ B ngay sau đó
- **THEN** lưới hiển thị khoá của kỳ B, không phải kết quả cũ của kỳ A

#### Scenario: Không có kỳ nào
- **WHEN** danh sách kỳ trả về rỗng hoặc lời gọi thất bại
- **THEN** facet kỳ không render và phần còn lại của catalog hoạt động bình thường

#### Scenario: Kỳ kết hợp với category
- **GIVEN** người dùng đang xem một category
- **WHEN** họ chọn thêm một kỳ
- **THEN** lưới chỉ còn khoá vừa thuộc category đó vừa thuộc kỳ đó

## MODIFIED Requirements

### Requirement: Facet and sort bar
The catalog SHALL keep text search and level filtering, presented as a facet bar, and SHALL add a sort control with options `popular` (phổ biến, default), `newest` (mới), and `rating` (đánh giá). Search SHALL match across all categories on course code and name. Facets SHALL apply to the browse view on `/courses` and to the grid on the category page.

The bar SHALL also host the **term** facet. Every facet control on the bar SHALL be optional in the
same way: it renders only when the caller supplies both its current value and its change handler, so
a surface that does not facet by that dimension keeps the plain bar. Sort SHALL stay pinned to the end
of the row, so adding a facet never moves it.

Vì số kỳ có thể lên tới vài chục, facet kỳ SHALL KHÔNG dùng dạng segmented control (dạng đó dành cho
"một trong vài lựa chọn" như level và số sao) mà dùng một điều khiển chọn danh sách, có nhãn cho
trình đọc màn hình.

#### Scenario: Search spans all categories
- **GIVEN** the user types a query matching courses in more than one category
- **WHEN** the results update
- **THEN** matching courses from every category are shown (search is not scoped to a single category)

#### Scenario: Level and sort facets apply together
- **GIVEN** the user selects level `intermediate` and sort `rating`
- **WHEN** the view updates
- **THEN** only intermediate courses are shown, ordered by rating descending

#### Scenario: Default sort is popular
- **GIVEN** the catalog loads with no sort chosen
- **WHEN** courses render
- **THEN** they are ordered by the `popular` sort by default

#### Scenario: Bar không đổi với trang không lọc theo kỳ
- **GIVEN** một trang dùng facet bar nhưng không truyền giá trị/handler của kỳ
- **WHEN** bar render
- **THEN** không có điều khiển kỳ nào xuất hiện và bố cục của bar giữ nguyên như trước
