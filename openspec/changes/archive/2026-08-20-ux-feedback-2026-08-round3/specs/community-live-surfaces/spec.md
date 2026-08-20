# community-live-surfaces

## MODIFIED Requirements

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
