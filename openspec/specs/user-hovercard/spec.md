# user-hovercard Specification

## Purpose
TBD - created by archiving change add-user-hovercard. Update Purpose after archive.
## Requirements
### Requirement: Hovercard kích hoạt khi hover hoặc focus vào tên hoặc avatar
`UserHovercard` SHALL bao bọc bất kỳ phần tử trigger nào chứa tên user hoặc avatar user. Khi ngườii dùng di chuột vào trigger HOẶC focus trigger bằng keyboard, hovercard SHALL chuẩn bị mở.

#### Scenario: Mouse hover vào tên tác giả bài viết
- **WHEN** user hover chuột vào tên tác giả
- **THEN** hovercard bắt đầu đếm delay để mở

#### Scenario: Keyboard focus vào avatar trong comment
- **WHEN** user tab focus vào avatar của một comment
- **THEN** hovercard bắt đầu đếm delay để mở

### Requirement: Touch/mobile không mở popup, tap điều hướng đến profile
Trên thiết bị touch, hovercard popup SHALL KHÔNG mở. Tap vào tên hoặc avatar SHALL điều hướng thẳng đến `/[locale]/u/[username]`. Popup chỉ mở bằng mouse hover (desktop) hoặc keyboard focus.

#### Scenario: Tap tên user trên điện thoại
- **WHEN** user tap vào tên tác giả bài viết trên màn hình cảm ứng
- **THEN** popup KHÔNG hiện và trình duyệt điều hướng đến profile

### Requirement: Delay trước khi mở và grace period trước khi đóng
Hệ thống SHALL đợi ~400ms sau khi hover/focus trước khi mở popup. Khi chuột rồi khỏi trigger, hệ thống SHALL đợi ~300ms (grace period) trước khi đóng để user có thể di chuột từ trigger xuống popup.

#### Scenario: Rồi chuột nhanh khỏi tên user
- **WHEN** user rồi chuột khỏi tên user trước khi delay kết thúc
- **THEN** hovercard KHÔNG mở

#### Scenario: Di chuột từ tên xuống popup
- **WHEN** user di chuột từ tên user xuống vùng popup trong grace period
- **THEN** hovercard VẪN mở và user có thể tương tác với popup

### Requirement: Lazy fetch profile với payload tối thiểu
`UserHovercard` SHALL KHÔNG fetch dữ liệu user khi render tĩnh. `useQueryUserHovercardSwr(username)` SHALL chỉ được kích hoạt khi hovercard đang mở hoặc đang trong delay mở. Query SHALL chỉ yêu cầu các field cần thiết cho card: `id`, `username`, `displayName`, `bio`, `avatar`, `followerCount`, `followingCount`, `isFollowedByMe`. Dữ liệu SHALL được cache bằng SWR theo username. Trong môi trường demo/local, fetcher SHALL trả về mock `UserHovercardData` thay vì gọi Apollo backend.

#### Scenario: Hover lần đầu trong demo
- **WHEN** user hover vào một user lần đầu trên local/demo
- **THEN** hook trả về mock profile với đầy đủ field mà không gọi backend

#### Scenario: Hover lại sau khi đã fetch
- **WHEN** user hover lại cùng một user
- **THEN** hệ thống KHÔNG gọi fetcher mới mà dùng dữ liệu đã cache

### Requirement: Popup hiển thị thông tin user
Khi dữ liệu có sẵn, hovercard popup SHALL hiển thị: avatar lớn, tên hiển thị (displayName hoặc username), @username, bio, số followers, số following. Nếu `displayName` trống thì fallback về `username`.

#### Scenario: Popup hiển thị đầy đủ thông tin
- **WHEN** hovercard mở với đầy đủ dữ liệu
- **THEN** popup hiển thị avatar, tên, @username, bio, follower/following count

### Requirement: Nút Theo dõi với optimistic update và rollback
Hovercard SHALL hiển thị nút "Theo dõi" khi viewer chưa follow user đích, user đích KHÔNG phải là chính viewer, và viewer đã đăng nhập. Khi nhấn nút, hệ thống SHALL toggle trạng thái `isFollowedByMe` và `followerCount` ngay lập tức (optimistic), gọi `setFollow({ userId, follow: true/false })`, và rollback nếu mutate lỗi. Nút SHALL bị disabled trong lúc mutation đang pending.

#### Scenario: Viewer chưa follow user
- **WHEN** popup hiển thị user khác mà viewer chưa follow
- **THEN** nút Theo dõi xuất hiện ở trạng thái ban đầu

#### Scenario: Nhấn nút Theo dõi
- **WHEN** viewer nhấn nút Theo dõi
- **THEN** UI toggle ngay sang trạng thái đã follow, gọi mutate, và rollback nếu lỗi

#### Scenario: Nút ẩn với chính mình hoặc guest
- **WHEN** hovercard thuộc về current user hoặc viewer chưa đăng nhập
- **THEN** nút Theo dõi KHÔNG hiển thị

### Requirement: Trạng thái loading và error
Hovercard SHALL hiển thị skeleton/loader khi dữ liệu đang tải. Nếu fetch thất bại, hovercard SHALL hiển thị thông báo lỗi và nút "Thử lại" để gọi lại API.

#### Scenario: API chậm
- **WHEN** dữ liệu chưa về sau khi popup mở
- **THEN** popup hiển thị trạng thái loading

#### Scenario: API lỗi
- **WHEN** query hovercard trả về lỗi
- **THEN** popup hiển thị lỗi và cho phép retry

### Requirement: Click trigger điều hướng đến profile
Click vào phần tử trigger (tên hoặc avatar) SHALL điều hướng đến `/[locale]/u/[username]`.

#### Scenario: Click tên user trong feed
- **WHEN** user click vào tên tác giả bài viết
- **THEN** trình duyệt điều hướng đến trang profile công khai của user đó

### Requirement: Accessibility
Hovercard SHALL mở được bằng keyboard focus, đóng bằng phím `Esc`, và trigger SHALL có `aria-haspopup="dialog"`. Popup content SHALL có `role="dialog"` hoặc tương đương theo HeroUI Popover.

#### Scenario: Keyboard navigation
- **WHEN** user tab đến trigger và focus
- **THEN** hovercard mở sau delay và user có thể tab vào nút Theo dõi bên trong popup

#### Scenario: Đóng bằng Esc
- **WHEN** popup đang mở và user nhấn `Esc`
- **THEN** popup đóng lại

