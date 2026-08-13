# group-live-surfaces

## MODIFIED Requirements

### Requirement: Like và comment group post đi qua endpoint community
FE SHALL wire `useMutateReactGroupPostSwr` vào `PUT/DELETE /community/reactions` (targetType POST),
optimistic có rollback, revalidate key group feed.

Đường **ĐỌC** bình luận của một group post SHALL đi qua GraphQL `post(id)` — hook dùng chung
`useQueryPostCommentsSwr` (cache `["post-detail", postId]`) — và SHALL KHÔNG đọc qua REST
`GET /community/posts/{postId}/comments` nữa: DTO `CommentResponse` của đường REST chỉ mang
`authorId` thô, không có author card, nên tên/username/avatar/staffRole của người bình luận không
tồn tại trên đường đó. Tên hiển thị SHALL lấy từ author card (`displayName` → `username`); khi BE
không gửi card thì SHALL là chuỗi rỗng (bề mặt tự render nhãn thành viên chung) — SHALL KHÔNG BAO
GIỜ là uuid.

Đường **GHI** bình luận SHALL giữ REST `POST /community/posts/{postId}/comments`, đi qua hook dùng
chung `useMutateCreatePostCommentSwr`: append lạc quan có rollback khi ghi hỏng, và revalidate
cache post-detail (`["post-detail", postId]`) sau khi ghi — KHÔNG phải cache
`["group-post-comments", …]` cũ.

Thread bình luận SHALL nhận cả `error` (không chỉ `hasError`) để lỗi hết-phiên / bài riêng tư /
bài đã xoá hiện đúng nguyên nhân thay vì một dòng lỗi chung kèm nút thử-lại không bao giờ thành
công.

#### Scenario: Like rồi bỏ like
- **WHEN** member bấm like một group post rồi bấm lần nữa
- **THEN** count +1 rồi −1, hai request PUT/DELETE tương ứng được gửi, trạng thái cuối khớp BE
  sau revalidate

#### Scenario: Bình luận ký bằng tên thật, không phải uuid
- **WHEN** member mở phần bình luận của một bài trong feed nhóm
- **THEN** mỗi bình luận (và mỗi reply) hiện tên hiển thị, avatar và huy hiệu staffRole từ author
  card, link hồ sơ trỏ tới `username` — không dòng nào ký bằng uuid

#### Scenario: BE không gửi author card
- **WHEN** một bình luận về mà không có author card
- **THEN** ô tên là chuỗi rỗng và bề mặt render nhãn thành viên chung, KHÔNG in id ra màn hình

#### Scenario: Gửi bình luận rồi thấy ngay
- **WHEN** member gửi một bình luận (hoặc reply một cấp) trong feed nhóm
- **THEN** bình luận hiện ngay trong thread, request `POST /community/posts/{postId}/comments`
  được gửi, và sau khi thành công cache post-detail được revalidate để thay node lạc quan bằng
  bản server; ghi hỏng thì node lạc quan biến mất và bản nháp được giữ

#### Scenario: Lỗi đọc nói đúng nguyên nhân
- **WHEN** đọc bình luận thất bại vì phiên hết hạn (401) hoặc bài không còn thấy được
- **THEN** thread hiện đúng nguyên nhân đó, không phải một dòng lỗi chung
