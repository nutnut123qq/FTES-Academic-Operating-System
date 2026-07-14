# subject-discussion-feed — Spec

## ADDED Requirements

### Requirement: Feed thảo luận query bằng subject UUID

Tab "Thảo luận" của subject workspace SHALL query GraphQL `subjectWorkspace(subjectId).community(scope)` bằng **UUID** của môn học chứ KHÔNG bằng course code từ route segment; FE SHALL resolve code → UUID (qua subject detail, field `uuid` = `detail.id`/`summary.id`) trước khi gọi feed, comments, và react hook. Route segment `/subjects/[subjectId]` SHALL vẫn là course code (không đổi routing/link). Khi UUID chưa resolve xong, tab SHALL ở trạng thái loading (skeleton) thay vì empty/error.

#### Scenario: Mở tab Thảo luận của một môn
- **WHEN** người dùng mở `/subjects/PRF192/discussion` và môn có bài viết
- **THEN** FE SHALL resolve `PRF192` → UUID rồi query `subjectWorkspace(subjectId: <UUID>)`
- **AND** feed hiển thị các bài viết của môn (không còn "Không tải được thảo luận")

#### Scenario: Không truyền code vào GraphQL
- **WHEN** feed/comments/react hook chạy
- **THEN** giá trị `subjectId` gửi vào GraphQL SHALL là UUID, KHÔNG phải course code
- **AND** khi UUID chưa sẵn sàng, hook GraphQL SHALL chưa fire (tab ở trạng thái loading)
