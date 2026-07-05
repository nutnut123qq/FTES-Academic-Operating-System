# user-link Specification

## Purpose
TBD - created by archiving change add-user-hovercard. Update Purpose after archive.
## Requirements
### Requirement: Component dùng chung để render tên và avatar user
`UserLink` SHALL là component duy nhất dùng để render tên user kèm avatar (nếu có). Component SHALL nhận props mô tả user: `username` (bắt buộc để link + hovercard), `displayName` (tùy chọn), `avatar` (tùy chọn), `size` (tùy chọn), `showAvatar` (tùy chọn), `className` (tùy chọn).

#### Scenario: Render user với đầy đủ thông tin
- **WHEN** component nhận `{ username, displayName, avatar }`
- **THEN** nó hiển thị avatar và tên hiển thị (`displayName || username`)

#### Scenario: Render user chỉ có username
- **WHEN** component nhận `{ username }`
- **THEN** nó hiển thị initials avatar và username

### Requirement: Tự động bao bọc bởi UserHovercard và link profile
`UserLink` SHALL tự động wrap nội dung bằng `UserHovercard` (khi có `username`) và `Link` đến `/[locale]/u/[username]`. Click vào bất kỳ phần nào của `UserLink` (avatar hoặc tên) SHALL điều hướng đến profile.

#### Scenario: Hover vào avatar trong UserLink
- **WHEN** user hover vào avatar trong `UserLink`
- **THEN** `UserHovercard` kích hoạt và hiển thị popup

#### Scenario: Click vào tên trong UserLink
- **WHEN** user click vào tên trong `UserLink`
- **THEN** trình duyệt điều hướng đến `/[locale]/u/[username]`

### Requirement: Áp dụng ở tất cả các chỗ render user
Mọi nơi trong codebase render tên user hoặc avatar user SHALL sử dụng `UserLink` / `UserHovercard` thay vì code lặp. Các khu vực bắt buộc: tên/avatar tác giả bài viết, comment, reply, thành viên group/subject, leaderboard, activity feed, instructor card, review author, saved library.

#### Scenario: Tên tác giả trong community feed
- **WHEN** refactor `CommunityFeed` để dùng `UserLink`
- **THEN** tên tác giả có avatar, link profile và hovercard

#### Scenario: Comment trong Discussion
- **WHEN** refactor `CommentItem` để dùng `UserLink`
- **THEN** tên + avatar commenter có link profile và hovercard

### Requirement: Không phá layout và style hiện tại
`UserLink` SHALL chấp nhận `className` để override style và KHÔNG ép buộc margin/padding mặc định. Layout hiện tại của các màn hình SHALL giữ nguyên sau refactor.

#### Scenario: Refactor leaderboard row
- **WHEN** thay thế phần identity trong `LeaderboardShell` bằng `UserLink`
- **THEN** row vẫn giữ chiều cao, màu nền zone, và căn chỉnh như cũ

### Requirement: Hỗ trợ nhiều data shape mà không làm crash
`UserLink` SHALL xử lý gracefully khi input là object có `username`/`displayName`/`avatar`, hoặc chỉ là string `username`, hoặc thiếu dữ liệu. Khi thiếu `username`, component SHALL render fallback text/avatar mà không link và không hovercard.

#### Scenario: Dữ liệu author là string
- **WHEN** `author` chỉ là `"johndoe"`
- **THEN** `UserLink` render tên "johndoe" với initials avatar, không hovercard

#### Scenario: Dữ liệu user object đầy đủ
- **WHEN** `author` là `{ username: "johndoe", displayName: "John", avatar: "url" }`
- **THEN** `UserLink` render đầy đủ avatar + tên + hovercard + link

