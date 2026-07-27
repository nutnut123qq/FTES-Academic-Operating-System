## 1. H1 trong editor

- [x] 1.1 `extensions.ts`: `StarterKit` heading khi `headings` bật → level `[1, 2, 3]`
- [x] 1.2 `RichTextEditor/index.tsx`: thêm nút **H1** (`TextHOne`) vào thanh `"full"` (giữ H2/H3),
  `toggleHeading({ level: 1 })` + `isActive` state
- [x] 1.3 i18n `richEditor.heading1` (vi + en, mirrored); relabel heading2/heading3 vi để
  H1 = "Tiêu đề"

## 2. Util tách/ghép tiêu đề (dùng chung)

- [x] 2.1 `reuseable/RichTextEditor/title.ts`: `splitTitleFromMarkdown` (H1 đầu → title + strip;
  fallback dòng đầu; cap 120; bỏ inline mark + block marker) + `joinTitleIntoMarkdown`
- [x] 2.2 `title.test.ts`: H1 đầu block, không H1 (fallback), H2 không tính là title,
  H1 có inline mark, link/code trong H1, nhiều dòng trống đầu, rỗng, title-only,
  cap dài, round-trip join→split (14 test)

## 3. Bỏ ô title khỏi composer (derive từ H1)

- [x] 3.1 Community TẠO `CommunityComposerForm`: bỏ `<input>` title + state `title`;
  `canSubmit` chỉ cần body non-empty; submit `splitTitleFromMarkdown(body)`; prop
  `autoFocusTitle`→`autoFocus` (cập nhật `CommunityComposerModal`)
- [x] 3.2 Community SỬA `PostEditDialog`: 1 editor seed `joinTitleIntoMarkdown(title, content)`;
  save `splitTitleFromMarkdown(draft)` → `{ title, content }`; bỏ import `Input`/`TextField`
- [x] 3.3 Thảo luận môn `SubjectComposer`: bỏ input title; derive lúc submit
- [x] 3.4 Feed nhóm `GroupFeedComposer`: bỏ input title; derive lúc submit
- [x] 3.5 Thông báo nhóm `AnnouncementForm` (tạo + sửa): 1 editor recombine/split;
  GIỮ checkbox "Ghim lên đầu"; reset về rỗng sau khi tạo

## 4. Dọn i18n chết + không đụng phần khác

- [x] 4.1 Gỡ 5 key title đã chết (community composer/engagement, group feed/announcement,
  subject community) khỏi en.json + vi.json
- [x] 4.2 KHÔNG đụng repost/quote commentary (plain), comment-scope composer (đã body-only),
  hay blog (FE không có màn soạn blog)

## 5. Không double-render H1

- [x] 5.1 H1 bị STRIP khỏi `content` lưu trữ ở nhánh H1 → detail/feed/card render body qua
  `MarkdownContent` không hiện tiêu đề hai lần (title lưu riêng, render riêng như cũ)

## 6. Verify

- [x] 6.1 `npx tsc --noEmit` sạch (exit 0)
- [x] 6.2 `npm run build` (webpack) thành công (exit 0)
- [x] 6.3 `npx vitest run` RichTextEditor: 20 test xanh (14 title + 6 mention)
- [x] 6.4 `openspec validate composer-title-from-h1 --strict`
