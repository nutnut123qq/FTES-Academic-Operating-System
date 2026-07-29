# leaderboard-display-name-fe — Bảng xếp hạng khóa đọc `displayName` thật (không lộ `legacy_<uuid>`)

## Why
Bảng xếp hạng khóa (`/courses/[id]/learn/leaderboard`) đang hiển thị `legacy_d8dff751…`
cho học viên đã migrate. Gốc ở BE: `CourseLeaderboardAssembler` cũ chỉ trả `username`, mà
với user migrate thì `username = "legacy_" + profileId` (placeholder migration), tên thật
nằm ở `display_name`. BE đã fix (PR đã merge): thêm field `displayName` (fullName → username
thật → "Học viên <suffix>") và sanitize mọi `legacy_*` khỏi cả `displayName` lẫn `username`
(→ null). Nhưng FE vẫn **chưa đọc field mới** — query GraphQL không xin `displayName` và
mapper `toEntry` suy `displayName` từ `username`, nên khi BE null-hoá `username` của user
legacy, FE sẽ rơi về `#<id>` thay vì tên thật.

## What Changes
- **Query** `query-course-leaderboard.ts`: thêm `displayName` vào selection `entries { … }`.
- **Type** `CourseLeaderboardEntry`: thêm `displayName: string | null` (kèm doc: BE không bao
  giờ trả `legacy_*`).
- **Mapper** `useQueryLearnLeaderboardSwr.toEntry`: thứ tự fallback đổi thành
  `entry.displayName ?? entry.username ?? #<id 8 ký tự>` (trước là `username ?? #id`). Row
  model FE đã sẵn field `displayName` nên podium/table hiển thị đúng ngay, không đụng render.

## Capabilities
### Modified Capabilities
- `course-leaderboard`: hàng xếp hạng ưu tiên `displayName` thật do BE resolve; không còn hiển
  thị placeholder `legacy_<uuid>`.

## Impact
FE-only, ăn khớp BE đã merge (`leaderboard-display-name`). Sửa 3 file (query/type/mapper),
không đổi component render. tsc sạch. Không migration, không API mới.
