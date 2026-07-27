## Why

Các composer đăng bài trên FTES-AOS đang có MỘT ô "Tiêu đề" riêng nằm TRÊN ô soạn
nội dung. Từ khi rollout rich editor (`RichTextEditor` + `MarkdownContent`), người dùng đã
định dạng được trong CÙNG một ô — nên ô tiêu đề tách rời là thừa và rối. Thầy chốt: *"bỏ
luôn cái title, có editor rồi, họ muốn tiêu đề thì bôi chọn H1 là oke"*. Nghĩa là composer
chỉ còn MỘT editor, tiêu đề chính là dòng H1 (`# …`) người dùng tự đánh dấu.

Backend KHÔNG đổi: endpoint tạo/sửa bài (community post, subject post, group feed, group
announcement) vẫn nhận `title` (string) LẪN `content`. Nên thay vì bỏ `title` khỏi payload,
ta DERIVE `title` từ nội dung lúc submit và bỏ ô nhập tiêu đề khỏi giao diện.

## What Changes

- **H1 vào thanh công cụ `"full"`** của `RichTextEditor` (đang có H2/H3) — H1 là "cần gạt"
  tiêu đề người dùng cần. `StarterKit` bật heading level `[1, 2, 3]`; `tiptap-markdown`
  serialize/parse `# ` chuẩn; `MarkdownContent` đã render H1 sẵn. i18n `richEditor.heading1`.
- **Util tách/ghép tiêu đề dùng chung** `reuseable/RichTextEditor/title.ts`:
  - `splitTitleFromMarkdown(md) → { title, body }`: block ĐẦU là H1 → lấy text làm `title`
    (bỏ inline mark, cap 120) và STRIP dòng H1 khỏi `body`; không có H1 → fallback `title`
    = dòng đầu không rỗng (plain text), giữ nguyên `body`; rỗng → title/body rỗng.
  - `joinTitleIntoMarkdown(title, body) → md`: prepend `# {title}` (dùng lúc mở form sửa).
  - Unit test (H1 đầu block, không H1, rỗng, H1 có inline mark, nhiều dòng trống đầu,
    round-trip join→split, title chỉ có H1).
- **Bỏ ô tiêu đề khỏi mọi composer có ô title RIÊNG**, dùng MỘT `RichTextEditor` + derive:
  - Community post TẠO (`CommunityComposerForm`) — bỏ `<input>` tiêu đề, derive lúc submit.
  - Community post SỬA (`PostEditDialog`) — mở form thì RE-COMBINE `title`+`content` thành 1
    Markdown (H1), lưu thì split lại.
  - Thảo luận môn (`SubjectCommunity` → `SubjectComposer`) — bỏ input, derive.
  - Feed nhóm (`GroupFeedComposer`) — bỏ input, derive.
  - Thông báo nhóm (`AnnouncementForm`, dùng cả tạo lẫn sửa) — 1 editor, recombine/split,
    GIỮ checkbox "Ghim lên đầu".
- **Không đụng** đường repost/quote (commentary plain, không có title) và các composer
  comment-scope (vốn đã body-only, không có title).
- **Blog**: FE này KHÔNG có màn soạn/sửa blog (hook create/update blog chưa được component nào
  dùng — blog author ở Admin repo) → KHÔNG có ô title để bỏ, không đổi gì. Nếu sau này thêm
  màn soạn blog, tiêu đề dẫn xuất phải chảy vào slug/listing (ghi chú để theo dõi).
- **KHÔNG** thêm dependency, **KHÔNG** đổi backend, **KHÔNG** `dangerouslySetInnerHTML`.

## Capabilities

### New Capabilities
- `composer-title-from-h1`: composer đăng bài dùng MỘT editor, tiêu đề dẫn xuất từ H1 đầu và
  bị strip khỏi body lưu trữ; có fallback khi không có H1 và round-trip khi sửa.

## Impact

- **Mới**: `src/components/reuseable/RichTextEditor/title.ts` (+ `title.test.ts`).
- **Sửa**: `RichTextEditor/{index.tsx,extensions.ts}` (nút + level H1),
  `community/CommunityComposer/CommunityComposerForm`, `modals/CommunityComposerModal`
  (prop `autoFocusTitle`→`autoFocus`), `community/CommunityPostDetail/PostEditDialog`,
  `subject/SubjectCommunity`, `group/GroupFeed/GroupFeedComposer`,
  `group/GroupAnnouncement/AnnouncementForm`.
- **i18n**: `richEditor.heading1` (vi + en); gỡ các key tiêu đề đã chết
  (`communityHub.composer.titleField`, `communityHub.engagement.editTitleLabel`,
  `groupsHub.feed.composer.titleField`, `groupsHub.announcements.titleField`,
  `subjects.community.titleField`).
- **Backend**: không đổi (title vẫn optional, content vẫn string).
