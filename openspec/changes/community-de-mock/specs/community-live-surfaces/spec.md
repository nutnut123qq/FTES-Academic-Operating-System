# community-live-surfaces

## ADDED Requirements

### Requirement: Poll hiển thị và vote bằng dữ liệu thật
FE SHALL nạp poll qua `GET /community/posts/{postId}/poll` (hook `useQueryPollSwr(postId)`) và
gửi vote thật qua `POST /community/posts/{postId}/poll-votes` với UUID option thật, optimistic có
rollback; không còn `fetchPollMock` hay vote local-only.

#### Scenario: Vote một option
- **WHEN** user chọn option trong `CommunityPoll` và bấm vote
- **THEN** UI tăng votes của option đó ngay (optimistic), request `poll-votes` được gửi với
  `optionId` thật, và sau revalidate `myOptionId` khớp option đã chọn
- **AND** nếu request lỗi, UI rollback về trạng thái trước và hiện toast lỗi

### Requirement: Bảng xếp hạng contributor dùng leaderboard thật
FE SHALL nạp `useQueryContributorsSwr` từ `GET /community/leaderboard` (map upvotesReceived→upvotes,
acceptedAnswers→accepted, downvotes=0) và bỏ `fetchContributorsMock`.

#### Scenario: Mở trang reputation
- **WHEN** user mở `/community/reputation`
- **THEN** danh sách xếp theo `rank` từ BE, số liệu là dữ liệu thật, không còn 4 tên mock cứng

### Requirement: Promo rail dùng advertisement thật
FE SHALL thay `useQueryCommunityPromoSwr` bằng `useQueryActiveAdvertisementSwr` với placement
`COMMUNITY_RAIL` (enum member mới phía FE); ad null SHALL ẩn panel promo thay vì hiện mock.

#### Scenario: Có house ad
- **WHEN** BE trả ad `COMMUNITY_RAIL` (seed sẵn từ BE)
- **THEN** DiscoveryRail hiện đúng `title/ctaText/linkUrl/imageUrl` của ad thật

#### Scenario: Không có ad
- **WHEN** BE trả null
- **THEN** panel promo không render (không lỗi console)

### Requirement: Tab campus là feed thật
FE SHALL truyền `campus` vào GraphQL `feed(tab, page, campus)`, bật tab CAMPUS trong
`CommunityFeedTab`/`toFeedTab`, và `/community/campus` SHALL render `CommunityFeed` thật thay
`CommunityScopePlaceholder`.

#### Scenario: Viewer có campus profile
- **WHEN** user có campus trong profile mở `/community/campus` không chọn campus
- **THEN** feed hiện post campus của user (BE fallback profile), shape card như các tab khác

#### Scenario: Không resolve được campus
- **WHEN** BE trả connection rỗng (user không có campus)
- **THEN** UI hiện empty-state có hướng dẫn cập nhật campus trong hồ sơ, KHÔNG hiện placeholder cũ

### Requirement: Trang Đã lưu
FE SHALL có trang `/community/saved` liệt kê bài đã bookmark qua
`GET /community/bookmarks/posts` (cursor phân trang) với nút bỏ lưu optimistic
(`DELETE /community/bookmarks/{postId}`), có link điều hướng từ CommunityShell.

#### Scenario: Xem và bỏ lưu
- **WHEN** user đã lưu 2 bài rồi mở `/community/saved`
- **THEN** 2 post card đầy đủ hiện theo thứ tự lưu mới nhất trước
- **AND** bấm bỏ lưu → card biến mất ngay, request DELETE gửi đi, lỗi thì card quay lại

### Requirement: Trending hiện tác giả
FE SHALL map field `author` mới của `PostResponse` vào hàng trending (tên + avatar), khôi phục
dòng tác giả từng bị giấu; `author` null SHALL tiếp tục ẩn dòng tác giả.

#### Scenario: Trending có tên tác giả
- **WHEN** BE trending trả `author.displayName`
- **THEN** hàng trending hiện tên hiển thị thay vì bỏ trống

### Requirement: Không còn marker mock stale trong community
FE SHALL xoá/refresh mọi docstring-marker sai thực tế trong `features/community` sau khi wire —
tối thiểu docstring "submit is a no-op mock (no BE)" của `CommunityComposer/index.tsx` (composer
đã submit thật).

#### Scenario: Quét marker
- **WHEN** grep `ponytail|mock BE` trong `src/components/features/community`
- **THEN** không còn kết quả nào mô tả một bề mặt ĐÃ wire là mock
