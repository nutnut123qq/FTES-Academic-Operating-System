# Design — blog-nav-and-engagement

Bối cảnh code (đã đọc 2026-07-16): header = `useAppNav` (single source, 4 module plain-link)
→ render bởi `navbar/Navbar/HeaderNav` (desktop) + drawer mobile trong `navbar/Navbar/index.tsx`
— cả hai chỉ `modules.map(...)`, KHÔNG hardcode; `pathConfig().locale().blog()` đã tồn tại.
Trang bài viết = `src/components/layouts/blog/BlogPost/index.tsx` (SWR `getBlogPostBySlug`,
render MarkdownContent → RelatedPosts). Hook engagement mồ côi đã có đủ trong
`src/hooks/swr/api/rest/{queries,mutations}`. Auth guard chuẩn = `useRequireAuth`
(mở AuthenticationModal cho guest). Session user = `state.user.user` (`UserEntity`:
`id/username/displayName/avatar`).

## 1. Tab Blog — `useAppNav.tsx`

- `AppNavModule.key` union: `"home" | "workplace" | "course" | "community" | "blog"`.
- Thêm import `NewspaperIcon` từ `@phosphor-icons/react`.
- Trong mảng return, thêm SAU community (thứ tự chốt: Home · Workplace · Course ·
  Community · Blog):

```tsx
makeModule("blog", p.blog().build(), <NewspaperIcon className="size-5" />),
```

- Active state dùng `under(path)` mặc định → sáng cả `/blog` lẫn `/blog/<slug>`.
- i18n: `nav.blog = "Blog"` trong CẢ `src/messages/vi.json` và `en.json` (t(key) của
  makeModule đọc `nav.<key>`).
- KHÔNG sửa `HeaderNav`/drawer (map từ nguồn chung); cập nhật JSDoc "exactly four" →
  "exactly five" ở `useAppNav`, `HeaderNav`, `Navbar` cho khỏi lệch doc.

## 2. BlogEngagement — cấu trúc

```
src/components/layouts/blog/BlogPost/BlogEngagement/
  index.tsx            # container: fetch + state + reaction bar + list + composer
  CommentItem.tsx      # 1 dòng comment (author, time-ago, content, tim, sửa/xoá của chủ)
  CommentComposer.tsx  # textarea + nút gửi (dùng chung cho tạo mới + sửa inline)
```

Mount trong `BlogPost/index.tsx`, TRONG nhánh `{data && (...)}`, SAU `MarkdownContent`
TRƯỚC `RelatedPosts`:

```tsx
<BlogEngagement postId={data.id} initialEmojiCount={data.emojiCount} />
```

Component `"use client"`, tự quản dữ liệu bằng hook có sẵn — presentational con nhận props.

## 3. Reaction bar (post)

- State: `{ reacted: boolean | null, count: number }` khởi tạo `{null, initialEmojiCount}`
  (BE không trả "tôi đã react" trên GET — v1 chấp nhận nút ở trạng thái trung tính tới lần
  toggle đầu; sau toggle, `BlogReactionResult {reacted, emojiCount}` là nguồn sự thật).
- Nút: HeroUI `Button` `variant="tertiary"` icon `HeartIcon` (`weight="fill"` + `text-accent`
  khi `reacted === true`) + số `count`; `aria-pressed={reacted === true}`,
  `aria-label` i18n.
- Click: `guard(() => trigger(postId))` từ `useRequireAuth` (guest → modal SignIn, không bắn
  request); pending → disable (chống double-toggle).
- Hook: `usePostReactToBlogPostSwr` (đã có, arg = postId string).

## 4. Comment thread

- **Model BE**: comment PHẲNG (không parentId), sort `createdAt ASC`, page-based
  `{items, page, size, hasNext}`; write = authenticated, read = public (SecurityConfig
  permitAll GET `/blog/posts/**`). KHÔNG dùng block `Discussion` (GraphQL CommentNode,
  threaded, reaction đa loại) — dựng UI phẳng riêng, nhẹ, đúng contract REST.
- **Phân trang**: state `page` (size 20) + accumulate: giữ `Map<id, BlogCommentResponse>`
  gộp items các trang đã tải (dedupe theo id); `useGetBlogCommentsSwr({postId, page, size: 20})`
  re-key theo page; nút "Xem thêm bình luận" hiện khi `hasNext`, disabled khi đang tải.
- **Composer** (đầu danh sách): user đã đăng nhập → textarea + nút gửi
  (`usePostCreateBlogCommentSwr`, `{postId, request: {content}}`, max 5000 ký tự khớp BE);
  thành công → append response vào map + clear draft. Guest → 1 dòng
  `blog.engagement.signInToComment` là Button link mở modal auth (`requireAuth()`),
  KHÔNG render textarea.
- **CommentItem**:
  - Author: `authorUsername` có → `<UserLink username={authorUsername} size="sm" />`
    (hovercard + avatar sẵn); `null` (user legacy/BE cũ) → `UserAvatar` seed = `userId`
    + label i18n `blog.engagement.anonymous` ("Học viên FTES").
  - Meta: time-ago (`getTimeAgoLabel` từ `@/modules/dayjs`); `updatedAt > createdAt` →
    hậu tố `blog.engagement.edited`.
  - Nội dung: plain text `whitespace-pre-wrap break-words` (KHÔNG markdown — BE lưu text thô).
  - Tim comment: `usePostReactToBlogCommentSwr` — cùng pattern §3 (count từ
    `emojiCount`, toggle qua guard).
  - Chủ comment (`comment.userId === currentUser?.id`, currentUser từ
    `useAppSelector(state => state.user.user)`): menu Sửa (composer inline prefill,
    `usePostUpdateBlogCommentSwr`) + Xoá (confirm modal HeroUI, `usePostDeleteBlogCommentSwr`,
    thành công → bỏ khỏi map). Không phải chủ → không render menu.
- **Empty/error**: list rỗng → `EmptyContent` i18n `blog.engagement.empty`; lỗi fetch →
  inline retry (pattern `AsyncContent` như phần trên của trang).
- **A11y**: heading `blog.engagement.commentsTitle` + count; nút icon-only có `aria-label`;
  composer `<label>` ẩn.

## 5. Types + i18n

- `src/modules/api/rest/blog/types.ts`:
  - `BlogCommentResponse` + `authorUsername?: string | null`
  - `BlogPostPage` + `totalElements?: number | null`
  (mirror delta BE `blog-admin-filter-and-engagement-seed`; đều optional → chạy được với BE
  chưa cập nhật.)
- i18n (vi + en): `nav.blog`; cụm `blog.engagement.{likesLabel, commentsTitle,
  commentPlaceholder, submit, loadMore, empty, signInToComment, anonymous, edited, edit,
  delete, confirmDeleteTitle, confirmDeleteBody, cancel, save}`.
- `auth.context` key cho guard: dùng key generic sẵn có (`auth.context.generic`) — không
  thêm context mới nếu chuỗi hiện có đã đủ nghĩa.

## 6. Navbar search inline (desktop)

Bối cảnh code (đã đọc 2026-07-16): `navbar/Navbar/SearchButton` = `InputButtonLike`
(nút GIẢ input) → `useSearchOverlayState().open()`; `SearchOverlay` = Drawer phải, own
keyboard nav + aria combobox + recent + footer "See all"; data = `useGlobalSearch(enabled,
size)` (Redux `state.search.query` + debounce 300 + gate `authenticated && (isOpen ||
enabled) && hasMinChars`, SWR dedupe theo key). Navbar đăng ký Ctrl/Cmd+K mở overlay
(`Navbar/index.tsx:96-107`) VÀ SearchOverlay tự đăng ký Ctrl+K lần nữa (`:82-99`).

### 6.1 Component mới `navbar/Navbar/SearchInline/`

```
SearchInline/
  index.tsx        # container: input thật + trạng thái mở dropdown + keyboard nav
  SearchDropdown.tsx  # panel kết quả neo dưới ô (absolute, w-input→max-w-xl)
```

- **Input thật** (HeroUI Input, mirror style `SearchOverlayInput`: icon kính lúp, nút
  clear, spinner khi loading) đặt đúng chỗ `SearchButton` cũ:
  `className="hidden w-[260px] md:flex"`, `focus-within` nới `w-[340px]` (transition).
  Suffix Kbd Ctrl+K giữ nguyên khi CHƯA focus.
- **State**: value đọc/ghi Redux `setSearchQuery` (dùng CHUNG slice với overlay + trang
  `/search` — handoff "Xem tất cả" giữ nguyên hành vi). Dropdown mở khi: input focus
  VÀ `trimmed.length >= SEARCH_MIN_CHARS`. Đóng khi: Esc / click ngoài (`useOnClickOutside`
  hoặc blur có relatedTarget check — chọn pattern sẵn có trong repo) / chọn kết quả /
  điều hướng.
- **Data**: `useGlobalSearch(dropdownOpen, 8)` — arg `enabled` của hook ĐÃ or với
  overlay-open nên inline chỉ cần truyền cờ của mình; KHÔNG thêm hook mới, KHÔNG sửa
  chữ ký `useGlobalSearch`.
- **Dropdown**: `SearchDropdown` render trong wrapper `relative` của input —
  `absolute top-full mt-2 w-[420px] max-h-[70vh] overflow-y-auto rounded-2xl border
  border-default bg-surface shadow-lg z-50`; nội dung tái dùng `SearchOverlayResults`
  (groups + optionId + activeRowId — component đã prop-driven, không đụng) + hàng footer
  "Xem tất cả kết quả" (mirror `SearchOverlayFooter`); trạng thái: loading giữ kết quả cũ
  (`keepPreviousData` sẵn có), error → `ErrorContent` retry, rỗng → `EmptyContent`,
  guest → prompt đăng nhập mở `AuthenticationModal` (mirror body overlay §hiện có).
- **Keyboard**: mirror `onInputKeyDown` của overlay (↑↓ wrap qua `flatRows`, Enter mở
  active row hoặc `/search?q=`, Esc đóng dropdown + giữ focus input); aria combobox
  (`role="combobox"`, `aria-expanded`, `aria-activedescendant`, listbox id) — pattern đã
  có sẵn trong overlay, port sang.
- **Recent searches**: v1 dropdown KHÔNG hiện recent khi query rỗng (dropdown chỉ mở khi
  đủ min-chars — giữ navbar sạch); recent vẫn được GHI khi activate/see-all (`addRecent`)
  để trang `/search` + mobile overlay dùng chung.

### 6.2 Mobile + overlay + shortcut

- **Mobile (< md) GIỮ full-screen overlay**: màn hẹp không neo được dropdown dưới ô
  navbar (không đủ bề ngang, bàn phím ảo che) — icon search mobile giữ `openSearch()`
  như hiện tại. `SearchOverlay` không đổi UI; CHỈ gỡ listener Ctrl+K nội bộ của nó
  (double-register với Navbar).
- **Ctrl/Cmd+K (Navbar handler, single source)**: viewport ≥ md (check
  `window.matchMedia("(min-width: 768px)")` tại thời điểm bấm) → focus ô inline (ref);
  < md → `openSearch()` như cũ.
- `SearchButton` cũ: xóa (desktop thay bằng SearchInline; mobile vốn dùng icon Button
  riêng trong Navbar, không qua SearchButton).

### 6.3 i18n

Tái dùng nguyên cụm `search.*` sẵn có (label/placeholder/noResultsFor/seeAll/…); thêm
tối đa `search.inlineHint` nếu cần chuỗi mới (vi+en).

## Seed data

- FE không có migration. Dữ liệu để test/deploy đến từ BE FTES-AOS-Backend:
  - `V201__seed_blog_from_legacy.sql` (đã có): 6 category + 19 bài published.
  - `V215__seed_blog_engagement_demo.sql` (change `blog-admin-filter-and-engagement-seed`,
    cùng lane): 3 comment + reactions cho 5 bài mới nhất, idempotent — mở `/blog/[slug]`
    là thấy thread có dữ liệu ngay.

## Verify

- `tsc --noEmit` sạch + eslint file chạm + `npm run build` (webpack) xanh.
- Runtime (apitest): tab Blog hiện desktop + drawer mobile, active đúng ở `/blog` và
  `/blog/<slug>`; guest đọc được comment nhưng mọi nút write mở modal đăng nhập; user thật
  tạo/sửa/xoá comment + toggle tim post/comment thấy count đổi.
