# course-lesson Specification

## Purpose
TBD - created by archiving change course-learn-player. Update Purpose after archive.
## Requirements
### Requirement: Course learn player
The lesson route `/courses/[courseId]/lessons/[lessonId]` SHALL render a learn player:
a curriculum rail plus a content area. Its state surfaces (empty / loading / error), the
mark-complete progress loop, and the premium lock marker SHALL reflect real per-viewer
data rather than static placeholders.

#### Scenario: Curriculum rail with active lesson and progress
- **WHEN** a lesson opens
- **THEN** a rail lists chapters → lessons with a completion marker per lesson and the active lesson highlighted
- **AND** the chapter holding the active lesson is expanded
- **AND** a progress header shows completed/total

#### Scenario: Content area with tabs and navigation
- **WHEN** the content area renders
- **THEN** it shows a video area, the lesson title, and tabs for lecture / documents / notes
- **AND** a mark-complete action, a previous action (disabled at the first lesson), and a next action (disabled at the last lesson)

#### Scenario: Header meta chips gated on value
- **WHEN** the lesson header renders its meta chips
- **THEN** the "min read" chip is shown only when the read-time value is greater than zero
- **AND** the "challenges" chip is shown only when the challenge count is greater than zero

#### Scenario: Content-less lesson shows an invitation
- **WHEN** the reading view is active, the lesson is not locked, and it has no markdown body, no HTML fallback, no video and no documents
- **THEN** an empty-state invitation is shown instead of a blank bordered reading card

#### Scenario: Video slot communicates its state
- **WHEN** the lesson video source is still resolving
- **THEN** an aspect-ratio skeleton occupies the video slot
- **WHEN** the video fails with a fatal playback error
- **THEN** a compact "video unavailable" placeholder with a retry action is shown instead of an empty slot

#### Scenario: Mark a lesson complete
- **WHEN** the user reads a lesson to the end (a bottom sentinel becomes visible) or presses the manual mark-complete action
- **THEN** the completion is persisted for the viewer
- **AND** the action reflects the completed state and the rail marker + progress header update

#### Scenario: End-of-chapter challenge
- **WHEN** the lesson has a chapter challenge
- **THEN** a challenge callout is shown with a CTA into the challenge

#### Scenario: Premium lesson lock from per-viewer entitlement
- **WHEN** the rail renders a lesson marker
- **THEN** a lesson locked for the current viewer shows a lock marker
- **AND** a premium lesson the viewer already owns shows no lock marker
- **AND** the lock unlocks by enrolling, never by a separate VIP purchase

#### Scenario: Loading and error states
- **WHEN** the outline or lesson is loading
- **THEN** the rail and content each show a skeleton
- **WHEN** loading fails with no cached data
- **THEN** an error state with a retry action is shown

#### Scenario: Discussion entitlement state
- **WHEN** the lesson discussion request is denied for the viewer (HTTP 401 or 403)
- **THEN** an "enroll to join the discussion" invitation is shown instead of an error with a retry
- **WHEN** the discussion request fails transiently (5xx or network)
- **THEN** an error state with a retry action is shown

### Requirement: Mobile rail access
The learn player SHALL provide, on viewports below `lg` where the desktop content-map and
on-this-page rails are hidden, a fixed bottom bar that opens those rails as drawers so a
phone learner can jump modules and read the outline. The reading column SHALL reserve bottom
space so the bar never covers content.

#### Scenario: Content-map reachable on mobile
- **WHEN** the lesson reader is viewed below `lg`
- **THEN** a fixed bottom bar shows a control that opens the course content-map in a drawer
- **AND** the reading column reserves bottom padding so the bar never overlaps the content tail

#### Scenario: Outline reachable on mobile
- **WHEN** the lesson being read has an on-this-page outline and is viewed below `lg`
- **THEN** the bottom bar shows a control that opens the outline as a full-width panel in a drawer

#### Scenario: Bar absent where it has no rails
- **WHEN** a learn surface without a content rail is viewed below `lg`
- **THEN** the bottom bar is not shown

### Requirement: Lesson body rendering quality
The learn player SHALL render migrated HTML lesson bodies with a full typography ladder
(headings, code, preformatted blocks, blockquotes, images, tables), and SHALL render code
blocks with horizontal scrolling rather than wrapping that shatters long tokens.

#### Scenario: HTML lesson typography
- **WHEN** a migrated HTML lesson body renders
- **THEN** its headings, inline code, code blocks, blockquotes and images are styled to match the markdown reading experience

#### Scenario: Long code does not shatter
- **WHEN** a code block contains a line longer than the reading column
- **THEN** the block scrolls horizontally instead of wrapping mid-token

### Requirement: Content-map continue action
The content-map rail SHALL offer a one-tap action to resume at the learner's next lesson.

#### Scenario: Continue from the rail
- **WHEN** the content-map rail renders and a resume target is known
- **THEN** a "continue learning" action is shown that opens the resume-target lesson

### Requirement: Dynamic challenges tab
The reader's content/challenges tab list SHALL omit the challenges tab when the current
lesson has no challenge, so it never presents a permanent dead-end tab.

#### Scenario: No-challenge lesson hides the tab
- **WHEN** the current lesson has no challenge
- **THEN** the challenges tab is not shown in the reader tab list

#### Scenario: Challenge lesson shows the tab
- **WHEN** the current lesson has a challenge
- **THEN** the challenges tab is shown

### Requirement: Discussion composer is collapsible
The learn player's top-level discussion composer SHALL render as a slim collapsed pill
(avatar + placeholder) that expands to the full textarea on interaction, so an empty
textarea never dominates the discussion zone above the thread.

#### Scenario: Collapsed until used
- **WHEN** the discussion renders and the viewer has not started a comment
- **THEN** the top-level composer shows a slim avatar + "write a comment" pill
- **WHEN** the viewer activates the pill
- **THEN** it expands to a textarea with submit / cancel controls

### Requirement: Optimistic comment reaction
The learn player SHALL reflect a comment like/unlike immediately in the UI (heart + count)
via an optimistic update, rolling back if the request fails, instead of blocking on a
full refetch.

#### Scenario: Instant like
- **WHEN** the viewer likes a comment
- **THEN** the heart and count update immediately without waiting for the request
- **WHEN** the request fails
- **THEN** the like is rolled back to its prior state

### Requirement: Movable AI entry
On desktop the AI entry point SHALL be draggable vertically (with a drag-vs-click threshold)
and SHALL persist its position, so the learner can park it clear of the reading column.

#### Scenario: Drag and persist
- **WHEN** the learner drags the AI FAB vertically past the drag threshold
- **THEN** the FAB moves and the click that opens the chat is suppressed for that gesture
- **AND** the new position is restored on the next visit

### Requirement: Contextual learn nudges
The content home SHALL surface a contextual nudges strip (e.g. rank / next step) computed
from existing learn data, with each nudge self-hiding when it has nothing to say.

#### Scenario: Nudge shows when meaningful
- **WHEN** the viewer has a computable rank or next step on the content home
- **THEN** a nudge for it is shown

#### Scenario: Nudge hides when empty
- **WHEN** a nudge has no meaningful value (e.g. zero rank)
- **THEN** that nudge is not shown

### Requirement: Lesson reaction footer
The learn player SHALL show a one-tap reaction bar and a view count in the reading card foot,
so a finished reader has a lowest-friction way to react to the lesson itself.

#### Scenario: React to the lesson
- **WHEN** the reader finishes a readable lesson
- **THEN** a reaction bar with a view count is shown in the reading card foot
- **WHEN** the learner picks a reaction
- **THEN** the reaction reflects immediately and persists on the next visit

#### Scenario: Toggle the reaction off
- **WHEN** the learner picks the reaction they already selected
- **THEN** the reaction is removed

### Requirement: Reader lock reflects real entitlement
The lesson reader SHALL determine whether a lesson is locked from the reliable per-viewer
entitlement carried on the course curriculum, not from a lesson-content request that may fail
with an unauthorized error. An unentitled viewer SHALL see the paywall, never a blank "empty"
reading area.

#### Scenario: Unentitled viewer sees the paywall, not emptiness
- **WHEN** a viewer without entitlement opens a premium lesson and the lesson-content request is unauthorized
- **THEN** the reader shows the locked paywall (enroll CTA), not an empty-content invitation

#### Scenario: Entitled viewer reads normally
- **WHEN** an entitled viewer opens the same lesson
- **THEN** the lesson is not locked and its content (and video, when present) renders

### Requirement: Reader adapts to lesson content type
The lesson reader SHALL adapt its body layout to the lesson's content shape rather than always
drawing a reading card: a link-only lesson renders resource cards, a video-only lesson renders
no empty reading card, and written lessons render as before. The content-map SHALL omit sections
that contain no lessons.

#### Scenario: Link-only lesson renders resource cards
- **WHEN** a lesson body is essentially just external link(s)
- **THEN** each link is shown as a resource card (source + an open action that opens a new tab), not raw link text
- **AND** the "ask AI about a passage" hint is not shown

#### Scenario: Video-only lesson has no empty reading card
- **WHEN** a lesson has a video and no written body or documents
- **THEN** no empty reading card is shown — the player is followed directly by the reaction bar

#### Scenario: Written lesson unchanged
- **WHEN** a lesson has markdown or HTML body text
- **THEN** it renders in the reading card with the selection hint and reaction bar as before

#### Scenario: Empty section hidden
- **WHEN** a course section contains no lessons
- **THEN** the content-map rail does not list that section

### Requirement: Sơ đồ tư duy tô khoá theo quyền người xem, không theo cờ nội dung

Sơ đồ tư duy của khoá SHALL xác định trạng thái "khoá" của một học phần bằng cờ khoá PER-VIEWER của
các bài trong học phần đó (`LessonView.locked`), KHÔNG bằng cờ tĩnh "bài trả phí" (`!free`). Một học
phần SHALL chỉ ở trạng thái "khoá" khi người xem không mở được bài nào trong đó.

Chú giải trạng thái khoá SHALL dùng ngôn ngữ đăng ký/mua khoá học, KHÔNG dùng ngôn ngữ nâng hạng
("nâng cấp", "upgrade") — cơ chế mở khoá của hệ thống là đăng ký khoá học.

#### Scenario: Học viên đã mua khoá
- **WHEN** người xem đã mua khoá nên mọi bài đều không bị khoá với họ
- **THEN** không học phần nào bị tô trạng thái khoá, kể cả học phần gồm toàn bài trả phí

#### Scenario: Khách chưa mua, toàn bộ bài bị khoá
- **WHEN** mọi bài của một học phần đều bị khoá với người xem và chưa bài nào hoàn thành
- **THEN** học phần đó được tô trạng thái khoá

#### Scenario: Học phần còn bài mở được
- **WHEN** một học phần có ít nhất một bài người xem mở được
- **THEN** học phần đó KHÔNG bị tô trạng thái khoá

### Requirement: Mở học phần từ sơ đồ tư duy hành xử như rail nội dung

Bấm một học phần trên sơ đồ tư duy SHALL mở bài đầu tiên mà người xem còn quyền vào (khác
`accessLevel` `NONE`). Khi không bài nào trong học phần mở được, sơ đồ SHALL mở cổng thanh toán gói
(cùng cổng mà rail nội dung dùng) thay vì điều hướng thẳng vào một bài bị khoá.

#### Scenario: Học phần có bài mở được nằm sau bài khoá
- **WHEN** bài đầu của học phần có `accessLevel` `NONE` còn bài thứ hai thì không
- **THEN** bấm học phần mở bài thứ hai

#### Scenario: Học phần khoá hoàn toàn
- **WHEN** mọi bài của học phần đều có `accessLevel` `NONE`
- **THEN** bấm học phần mở cổng thanh toán gói
- **AND** không có điều hướng nào vào trang bài học

### Requirement: Video xem thử không phụ thuộc trường theo người xem

Trang học SHALL mount khối video xem thử khi bài là bài video đã sẵn sàng phát và có thời lượng xem
thử (`previewSeconds > 0`) — một thuộc tính của NỘI DUNG — kể cả khi trường theo người xem
(`accessLevel`) vắng mặt hoặc chưa xác định. Nhánh cũ theo `accessLevel === "PREVIEW"` SHALL giữ
nguyên.

Lý do: khách chưa đăng nhập là đúng nhóm cần mời chào, mà đó lại là nhóm hay có `accessLevel` rỗng
nhất; mất khối video là mất cả lối xem thử lẫn CTA mua.

#### Scenario: Khách chưa đăng nhập xem bài video có thời lượng xem thử
- **WHEN** bài video ở trạng thái sẵn sàng phát, `previewSeconds` là 900 và `accessLevel` là rỗng
- **THEN** khối video được mount

#### Scenario: Bài video không có thời lượng xem thử
- **WHEN** bài video sẵn sàng phát nhưng `previewSeconds` là 0 và `accessLevel` rỗng, không có ref phát được
- **THEN** khối video không được mount

### Requirement: Cổng gói phải liệt kê cả gói miễn phí mở khoá bài đó

Cổng thanh toán gói SHALL liệt kê mọi gói mở khoá bài hiện tại bất kể giá, kể cả gói giá 0. Cổng
SHALL KHÔNG loại gói chỉ vì giá bằng 0 — làm vậy khiến người dùng bị chào mua trọn khoá tính phí
trong khi chỉ cần nhận gói miễn phí. Gói giá 0 SHALL đi theo nhánh nhận-gói-miễn-phí sẵn có (thêm vào
giỏ rồi checkout thẳng, không mở cổng thanh toán).

#### Scenario: Gói miễn phí mở khoá bài
- **WHEN** bài bị khoá được mở bởi một gói giá 0 đang hoạt động
- **THEN** cổng liệt kê gói đó
- **AND** không rơi xuống nhánh chào mua trọn khoá tính phí

#### Scenario: Gói tính phí giữ nguyên
- **WHEN** bài bị khoá được mở bởi các gói tính phí
- **THEN** cổng liệt kê các gói đó sắp rẻ trước như trước

