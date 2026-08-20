# community-live-surfaces Specification

## Purpose
TBD - created by archiving change community-de-mock. Update Purpose after archive.
## Requirements
### Requirement: Poll hiển thị và vote bằng dữ liệu thật
FE SHALL nạp poll qua `GET /community/posts/{postId}/poll` (hook `useQueryPollSwr(postId)`) và
gửi vote thật qua `POST /community/posts/{postId}/poll-votes` với UUID option thật, optimistic có
rollback; không còn `fetchPollMock` hay vote local-only.

`useQueryPollSwr` SHALL nhận `postId` **bắt buộc**. Hook SHALL KHÔNG tự đi tìm "poll mới nhất"
bằng cách quét trang đầu của bảng tin: cách đó vừa bỏ sót mọi poll nằm ngoài trang quét, vừa trả
về rỗng khi trang đầu tình cờ không có poll nào — trong khi hệ thống đang có poll.

Trang bình chọn SHALL liệt kê **mọi** bài bình chọn, mới nhất trước, có phân trang, và SHALL bỏ
phiếu được ngay tại hàng. Danh sách SHALL lấy qua đường tìm kiếm cộng đồng lọc theo loại bài ở
tầng DB, KHÔNG lọc bằng cách duyệt bảng tin ở phía client.

#### Scenario: Vote thật
- **WHEN** user chọn option trong `CommunityPoll` và bấm vote
- **THEN** UI tăng votes của option đó ngay (optimistic), request `poll-votes` được gửi với
  UUID option thật, hỏng thì rollback kèm toast

#### Scenario: Nhiều poll cùng tồn tại
- **GIVEN** hệ thống có từ hai bài bình chọn trở lên
- **WHEN** người dùng mở trang bình chọn
- **THEN** mọi bài bình chọn đều hiện, mới nhất trước — không phải chỉ một cái

#### Scenario: Poll nằm ngoài trang đầu bảng tin
- **GIVEN** một bài bình chọn cũ, không lọt vào trang đầu của bảng tin
- **WHEN** người dùng mở trang bình chọn và cuộn tới
- **THEN** bài đó vẫn hiện và vẫn bỏ phiếu được

#### Scenario: Chưa có bình chọn nào
- **WHEN** người dùng mở trang bình chọn mà hệ thống không có bài bình chọn nào
- **THEN** trạng thái rỗng hiện ra, và nội dung của nó SHALL KHÔNG khẳng định phạm vi "trong
  bảng tin của bạn" — danh sách không còn bị giới hạn theo bảng tin nữa

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

