# blog-nav-and-engagement — Tab Blog trên header + UI comment/reaction cho bài blog

## Why

Blog đã wire thật (`/blog` + `/blog/[slug]` gọi REST BE, 19 bài seed) nhưng:

1. **Không đường vào từ header** — 4 tab (Home · Workplace · Course · Community) trong
   `useAppNav` không có Blog; khách chỉ tới `/blog` qua link founder byline ở home hoặc gõ URL.
2. **Trang bài viết KHÔNG có engagement** — BE đủ endpoint comment/reaction
   (`BlogEngagementController`), FE đã có sẵn cả cụm hook mồ côi từ change `rest-fetch-blog`
   (`useGetBlogCommentsSwr`, `usePostCreateBlogCommentSwr`, `usePostUpdateBlogCommentSwr`,
   `usePostDeleteBlogCommentSwr`, `usePostReactToBlogPostSwr`, `usePostReactToBlogCommentSwr`)
   nhưng chưa có UI nào dùng — người đọc không bình luận/thả cảm xúc được.
3. **Search trên navbar là nút giả** — `SearchButton` chỉ TRÔNG như input
   (`InputButtonLike`) nhưng bấm vào lại mở panel `SearchOverlay` riêng (drawer phải) rồi
   mới gõ được: thêm 1 bước + context switch cho hành vi phổ biến nhất của header. Hook
   `useGlobalSearch` + GraphQL `search` đã sẵn — chỉ thiếu ô input thật ngay trên navbar.

## What Changes

- **Tab Blog (desktop + mobile)**: `useAppNav` thêm module thứ 5 `blog` (label i18n
  `nav.blog`, icon `NewspaperIcon`, path `pathConfig().locale().blog().build()`, active
  prefix `/blog`) — HeaderNav desktop và mobile drawer cùng ăn từ nguồn này nên KHÔNG sửa
  2 consumer; active state đúng cả `/blog` lẫn `/blog/[slug]`.
- **Cụm engagement dưới bài viết** (`/blog/[slug]`, component mới
  `BlogEngagement` trong `src/components/layouts/blog/BlogPost/`):
  - **Reaction bar**: nút tim + `emojiCount` của bài (toggle qua
    `usePostReactToBlogPostSwr`); guest bấm → mở modal đăng nhập (`useRequireAuth`).
  - **Comment thread** (phẳng, không reply lồng — đúng model BE): list phân trang
    `useGetBlogCommentsSwr` + nút "Xem thêm" theo `hasNext`; composer cho user đã đăng
    nhập; sửa/xoá comment của chính mình; thả tim từng comment. Guest CHỈ đọc — mọi nút
    write đi qua guard auth.
  - Types FE mirror BE delta (`blog-admin-filter-and-engagement-seed` bên FTES-AOS-Backend):
    `BlogCommentResponse` + `authorUsername?`, `BlogPostPage` + `totalElements?`.
- **navbar-search-inline (desktop ≥ md)**: bỏ hành vi `SearchButton` mở `SearchOverlay`;
  thay bằng ô search input GÕ TRỰC TIẾP trên navbar (component mới `SearchInline`), kết
  quả xổ **dropdown ngay dưới ô** — dùng lại `useGlobalSearch` (debounce 300ms + GraphQL
  `search` sẵn có) + keyboard nav ↑↓ Enter, Esc đóng, click-ngoài đóng, footer "Xem tất
  cả" → `/search?q=…`. **Mobile (< md) GIỮ full-screen overlay** — màn hẹp không đủ chỗ
  cho dropdown neo dưới ô navbar, overlay hiện tại đã tối ưu (input pin top + Cancel).
  Ctrl/Cmd+K: desktop focus ô inline; mobile mở overlay như cũ.

## Capabilities

### Modified Capabilities
- `app-shell-navigation`: header/drawer từ 4 → 5 module (thêm Blog), đổi tên 2 requirement
  "exactly four" → "exactly five".
- `blog`: trang bài viết thêm cụm engagement (reaction bar + comment thread); requirement
  mới "Blog article engagement".
- `search-command-palette`: desktop chuyển từ overlay-trigger sang input inline + dropdown
  trên navbar; overlay chỉ còn là bề mặt mobile; requirement "Open and close the search
  overlay" sửa phạm vi + requirement mới "Inline navbar search dropdown on desktop".

## Impact

- Sửa: `src/components/features/app-shell/useAppNav.tsx` (module + key union),
  `src/messages/{vi,en}.json` (`nav.blog` + cụm `blog.engagement.*` + `search.*` bổ sung),
  `src/modules/api/rest/blog/types.ts` (2 field additive),
  `src/components/layouts/blog/BlogPost/index.tsx` (mount BlogEngagement),
  `src/components/features/navbar/Navbar/index.tsx` (mount SearchInline desktop, Ctrl+K
  focus inline; icon mobile giữ mở overlay),
  `src/components/features/search/SearchOverlay/index.tsx` (gỡ listener Ctrl+K nội bộ —
  tránh double-handle; overlay giữ nguyên phần còn lại cho mobile).
- Mới: `src/components/layouts/blog/BlogPost/BlogEngagement/` (index + CommentItem +
  CommentComposer); `src/components/features/navbar/Navbar/SearchInline/` (input thật +
  dropdown kết quả, thay `SearchButton` trên desktop — `SearchButton` gỡ hoặc thu về
  alias mobile).
- KHÔNG đổi BE trong repo này; field mới nullable nên chạy được cả với BE chưa deploy delta
  (fallback hiển thị khi `authorUsername` vắng).
- Không dependency mới.
