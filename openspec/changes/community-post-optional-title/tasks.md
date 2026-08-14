# Tasks — community-post-optional-title

## 1. Helper
- [x] 1.1 `splitTitleFromMarkdown(markdown, options?)`: mặc định không H1 ⇒ `title: ""`; `fallbackTitle: true` giữ hành vi cũ (dòng đầu làm tiêu đề).
- [x] 1.2 Cập nhật test `title.test.ts`: mặc định không bịa; opt-in vẫn bịa; vòng join→split khép kín khi tiêu đề rỗng.

## 2. Bề mặt bắt buộc có tiêu đề
- [x] 2.1 `AnnouncementForm` truyền `{ fallbackTitle: true }` (BE `@NotBlank title`).

## 3. Render
- [x] 3.1 `CommunityFeed`: chỉ render dòng tiêu đề khi `post.title` khác rỗng.
- [x] 3.2 `CommunityPostContent`: chỉ render `<h5>` khi `post.title` khác rỗng.

## 4. Verify
- [x] 4.1 `tsc --noEmit` sạch + vitest liên quan xanh.
