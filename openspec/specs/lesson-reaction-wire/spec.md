# lesson-reaction-wire Specification

## Purpose
TBD - created by archiving change learn-engagement-wire. Update Purpose after archive.
## Requirements
### Requirement: Lesson reaction footer uses real API
`LessonReactionFooter` SHALL đọc `{viewCount, likeCount, myReaction}` từ `GET /courses/lessons/{lessonId}/reactions` (SWR) và toggle like qua PUT/DELETE `/reactions/LIKE` với optimistic update + rollback khi lỗi; file `useLessonReactionMock.ts` SHALL bị xóa.

#### Scenario: Số thật thay số bịa
- **WHEN** learner mở lesson seed có 2 like + view_count 42
- **THEN** footer hiện đúng 42 view, 2 like (không còn số hash từ contentId)

#### Scenario: Toggle like optimistic
- **WHEN** learner bấm like
- **THEN** UI đổi ngay (like+1, trạng thái active), request PUT bắn nền; nếu request fail thì UI rollback

#### Scenario: PREVIEW không like
- **WHEN** viewer chỉ có PREVIEW access
- **THEN** nút like disable kèm tooltip mời đăng ký khóa (không bắn PUT)

