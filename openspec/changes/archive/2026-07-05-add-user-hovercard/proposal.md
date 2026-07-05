## Why

Tên và avatar của ngườii dùng xuất hiện ở hàng chục chỗ trong FTES AOS (feed bài viết, comment, group, subject, leaderboard, chat, review khóa học, v.v.) nhưng hiện tại được render bằng nhiều đoạn code lặp, thiếu link đến profile, và không có cách nhanh để xem thông tin tóm tắt. User Hovercard giải quyết bằng một component dùng chung: hover vào tên/avatar là hiện popup thông tin user, hỗ trợ điều hướng profile và follow — tăng khả năng kết nối giữa các thành viên mà không phá layout hiện tại.

## What Changes

- Tạo component dùng chung `UserHovercard` và wrapper `UserLink` trong `src/components/blocks/identity/` theo chuẩn HeroUI v3 + SWR.
- Hovercard kích hoạt khi hover/focus vào **tên user** hoặc **avatar**; delay ~400ms trước khi mở, giữ popup mở khi di chuột từ trigger xuống popup (grace period).
- Lazy fetch thông tin user qua GraphQL `userProfile(username)`; cache bằng SWR để hover lại không gọi API.
- Hiển thị trong popup: avatar lớn, tên, @username, bio, số followers/following, nút **Theo dõi** dùng mutation `setFollow` (ẩn nút nếu là chính mình).
- Xử lý trạng thái loading và error bên trong popup.
- Click vào tên/avatar điều hướng đến trang công khai `/[locale]/u/[username]`.
- Refactor toàn bộ các chỗ render user hiện có về `UserLink` / `UserHovercard`:
  - Tên/avatar tác giả bài viết, comment, reply.
  - Thành viên group/subject, leaderboard, activity feed, chat conversation list.
  - Instructor card, review author, saved library, v.v.
- Bảo đảm accessibility: hovercard mở được bằng keyboard focus, đóng bằng `Esc`, tuân thủ `role="dialog"` / `aria-describedby`.
- Không thêm dependency mới; dùng HeroUI Popover/Tooltip + SWR đã có.

## Capabilities

### New Capabilities

- `user-hovercard`: Hành vi popup hiển thị thông tin user khi hover/focus, bao gồm delay, grace period, lazy fetch, cache, loading/error, follow button, và điều hướng profile.
- `user-link`: Component dùng chung để render tên + avatar của user, thay thế các đoạn code lặp hiện tại và đảm bảo mọi chỗ hiển thị user đều có hovercard + link profile nhất quán.

### Modified Capabilities

- Không có spec-level requirement thay đổi. Các tính năng hiện có (feed, comment, profile, group, subject, leaderboard, v.v.) chỉ được refactor để dùng component chung; behavior nghiệp vụ không đổi.

## Impact

- **UI Components**: `src/components/blocks/identity/UserHovercard/`, `src/components/blocks/identity/UserLink/`; thay đổi ~15–25 file render user hiện có.
- **Data fetching**: Tái sử dụng SWR hook `useQueryUserProfileSwr`; có thể cần hook wrapper mới nhận `username` thay vì lấy từ context.
- **Mutation**: Tái sử dụng `useMutateSetFollowSwr` (hoặc tạo nếu chưa có) để xử lý follow/unfollow trong hovercard.
- **Routing**: Tất cả link profile đi qua `/[locale]/u/[username]`; không thay đổi định nghĩa route.
- **i18n**: Thêm key `hovercard.*` vào `vi.json` / `en.json`.
- **Dependencies**: Không thêm dependency mới.
