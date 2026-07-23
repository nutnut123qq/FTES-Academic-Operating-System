# group-live-surfaces Specification

## Purpose
TBD - created by archiving change community-de-mock. Update Purpose after archive.
## Requirements
### Requirement: Group feed mang engagement thật
FE SHALL map `likeCount/commentCount/likedByMe` từ DTO `GET /groups/{id}/feed` (mở rộng bởi BE
`group-social-engagement`) trong `useQueryGroupFeedSwr.toGroupPost`, bỏ seed cứng
`likes:0/liked:false/comments:0`.

#### Scenario: Feed nhóm hiện số like thật
- **WHEN** một group post có 2 like và 1 comment
- **THEN** card trong GroupFeed hiện đúng 2 like, 1 comment, tim tô nếu viewer đã like

### Requirement: Like và comment group post đi qua endpoint community
FE SHALL wire `useMutateReactGroupPostSwr` vào `PUT/DELETE /community/reactions`
(targetType POST) và `useQueryGroupPostCommentsSwr` vào
`GET/POST /community/posts/{postId}/comments`, optimistic có rollback, revalidate key group feed.

#### Scenario: Like rồi bỏ like
- **WHEN** member bấm like một group post rồi bấm lần nữa
- **THEN** count +1 rồi −1, hai request PUT/DELETE tương ứng được gửi, trạng thái cuối khớp BE
  sau revalidate

### Requirement: Discussion threads sống
FE SHALL wire threads qua `/groups/{id}/discussion/threads**`: list (`useQueryGroupThreadsSwr`),
comment thread (`useQueryGroupThreadCommentsSwr`), reaction (`useMutateReactGroupThreadSwr`), và
`GroupDiscussion` SHALL có compose tạo thread + comment thật; mọi mock thread bị xoá.

#### Scenario: Tạo thread và trả lời
- **WHEN** member tạo thread mới rồi comment vào đó
- **THEN** thread xuất hiện đầu danh sách (sort last_activity desc), replyCount tăng, comment
  hiện trong thread — tất cả từ dữ liệu BE

### Requirement: RSVP sự kiện nhóm
FE SHALL hiện `attendeeCount` thật + trạng thái `attending`, với nút Tham gia/Huỷ gọi
`POST/DELETE /groups/{id}/events/{eventId}/attend` (hook mới `useMutateAttendGroupEventSwr`),
optimistic count±1 có rollback.

#### Scenario: Tham gia sự kiện
- **WHEN** member bấm "Tham gia" trên một event
- **THEN** count +1 và nút đổi thành "Huỷ tham gia" ngay; lỗi thì hoàn nguyên

### Requirement: Rules nhóm đọc/ghi thật
FE SHALL xoá `MOCK_GROUP_RULES`; `useQueryGroupManageSwr` đọc `GET /groups/{id}/rules`, editor
trong GroupManagement lưu qua `PUT /groups/{id}/rules` (hook mới `useMutateGroupRulesSwr`).

#### Scenario: Sửa rules
- **WHEN** manager sửa danh sách rules và lưu
- **THEN** PUT gửi mảng string mới, SWR manage revalidate, reload trang vẫn thấy rules mới

### Requirement: Avatar/cover nhóm upload thật
FE SHALL wire GroupCreate + GroupManagement theo luồng presign → upload multipart → verify
(`POST /groups/{id}/media/presign|verify`), hiển thị `avatarUrl/coverUrl` trả về từ
`GroupResponse` mở rộng.

#### Scenario: Đổi avatar nhóm
- **WHEN** manager chọn ảnh mới trong GroupManagement và lưu
- **THEN** 3 bước presign/upload/verify chạy tuần tự, avatar mới hiện sau revalidate; lỗi bước
  nào hiện toast bước đó, không nửa vời

### Requirement: Members giữ nguyên (đã thật)
FE SHALL KHÔNG sửa `useQueryGroupMembersSwr` (đã dùng `GET /groups/{id}/members` thật) ngoài
việc xác nhận không còn marker mock.

#### Scenario: Xác nhận members
- **WHEN** rà `useQueryGroupMembersSwr.ts`
- **THEN** không có mock/fetchMock nào — chỉ verify, không đổi hành vi

