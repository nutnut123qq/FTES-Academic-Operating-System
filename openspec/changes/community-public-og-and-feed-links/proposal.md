# community-public-og-and-feed-links — link bài cộng đồng unfurl ra card thật, và dòng feed hết in `<>`

> **Change hồi tố.** Code đã ship trong đợt 2 (2026-08-15); tài liệu viết SAU theo diff thật.
> Change này chạm CẢ HAI repo: endpoint public nằm ở `FTES-AOS-Backend`, phần FE mô tả dưới đây.

## Why

1. **Metadata bài cộng đồng dựng ở đợt 1 gọi đường ĐÃ BỊ GATE.** `generateMetadata` chạy trên server,
   nơi không có bearer token, nên `GET /community/posts/{id}` chỉ có thể trả 401 ở đó. Mỗi lượt render
   vừa **chắc chắn hỏng** vừa **tốn một request vô ích**, và mọi link chia sẻ rơi về copy chung.
   Không thể nới gate của endpoint cũ — nó trả nội dung đầy đủ, counters, authorId, groupId, status.
2. **Dòng feed cộng đồng in link trần dạng `<https://…>`.** Tác giả viết autolink CommonMark; dòng
   feed in snippet dưới dạng **TEXT THUẦN** (cả hàng đã nằm trong một `<Link>` phủ toàn bộ, chèn `<a>`
   vào đây là lồng anchor), nên cặp `<>` lộ nguyên ra màn hình.

## What Changes

### BE (repo `FTES-AOS-Backend`, ghi ở đây để không nhầm là FE tự bịa endpoint)
- **Endpoint MỚI đặt cạnh endpoint cũ**, KHÔNG nới gate của `GET /posts/{id}`:
  `GET /api/v1/community/public/posts/{id}` trả `PublicPostCard(id, title, excerpt, imageUrl,
  authorName, createdAt)`. Namespace `/public/` riêng để `permitAll` trúng ĐÚNG một route, và
  projection hẹp là hình dữ liệu công khai duy nhất — không có đường nào để field riêng tư lọt ra.
  Không trả content đầy đủ, không counters, không authorId/groupId/status.
- **Cổng quyền ở `PostService.findPublicPost` — 3 lớp lọc**, mỗi lớp có ca test riêng: `status` phải
  ĐÚNG `PUBLISHED` (whitelist, không blacklist "khác REMOVED"); `deletedAt` phải null; bài thuộc nhóm
  thì nhóm phải `isPublic(...)` (cố ý KHÔNG dùng `!isPrivate` — khách ẩn danh không có membership để
  xét, nên PRIVATE / RESTRICTED tương lai / nhóm đã xoá đều đóng). Mọi lý do đều trả
  `Optional.empty()` → controller map thành **CÙNG một 404** `COMMUNITY_POST_NOT_FOUND`, nên không dò
  được sự tồn tại của bài nhóm kín bằng cách quét id.
- `excerpt` tái dùng `ModerationExcerpt.of` (bỏ markup + MỌI URL, cắt 200 ký tự — card xem trước
  không thành nơi phát tán link); ảnh bìa = ảnh IMAGE đầu tiên theo `sortOrder`; `authorName` qua
  `ProfileQuery` nên đã qua `DisplayNames` → không lộ placeholder `legacy_<uuid>`.
- **Không cần migration** (V334 vẫn còn trống, không dùng).

### FE
- **`getPublicPostCard(id)`** trong adapter community, **`authenticated: false`** (bắt buộc: để
  `authenticated` thì mỗi lần render tốn một lần thử refresh token vô ích) + type `PublicPostCard`
  (cố ý KHÔNG là subset của `PostResponse` — nó là thứ caller ẩn danh được phép thấy).
- **`generateMetadata` của `/community/[postId]`** đọc card public thay vì gọi đường auth-gated rồi
  nuốt 401. Bỏ helper `firstImage` (BE trả sẵn `imageUrl`); `toDescription` rút gọn còn cắt 160 ký tự
  vì BE đã trả plain-text. **404 → fallback về copy chung `seo.communityPost.*`** — giống hệt trường
  hợp bài không tồn tại, nên link tới bài nhóm kín unfurl ra card chung chứ không tiết lộ là nó tồn tại.
- **`useQueryCommunityFeedSwr.toCommunityPost`**: `snippet` chạy qua `unwrapAutolinks` (hàm ĐÃ CÓ SẴN
  ở `CommunityPostDetail/postLinks.ts`, dùng cho trang chi tiết). **Không viết hàm mới, không nhân
  bản logic.** `CommunityFeed/index.tsx` **KHÔNG SỬA** — snippet chảy vào đã sạch từ mapper, giữ nguyên
  ràng buộc "snippet là text thuần".
- **`postLinks.test.ts`**: thêm 2 ca còn thiếu — url trần giữ nguyên; `a < b`, `b > c`, `<div>` không
  bị đụng, đồng thời khẳng định `<https://a.vn/x>` → `https://a.vn/x`. Test này đủ sức bắt cách cài
  sai hay gặp nhất là `replace(/[<>]/g, "")`.

## Impact

- Affected specs: `share-metadata` (ADDED — card public cho bài cộng đồng),
  `community-feed-threads` (ADDED — snippet không in `<>`)
- Affected code (FE): `app/[locale]/community/[postId]/page.tsx`,
  `modules/api/rest/community/{community.ts,types.ts}`,
  `components/features/community/hooks/useQueryCommunityFeedSwr.ts`,
  `components/features/community/CommunityPostDetail/postLinks.test.ts`
- Affected code (BE, repo khác): `PostService`, `CommunityMapper`, `PostController`, `CommunityDtos`,
  `SecurityConfig` (đúng 1 dòng `permitAll` cho `GET /api/v1/community/public/posts/*`),
  `PublicPostCardTest`
- Không thêm chuỗi hiển thị nào → không đụng `messages/{en,vi}.json`.

## Tác dụng phụ KHÔNG tránh được (đã cân nhắc)

`toCommunityPost` là mapper **DÙNG CHUNG** cho cả feed lẫn `useQueryCommunitySearchSwr`, nên kết quả
tìm kiếm trong cộng đồng cũng hết in `<>` theo. Không thể sửa riêng feed mà không tách mapper — tách
ra chỉ để "đúng phạm vi" là thêm code thừa cho một thay đổi có lợi. Hàng trích dẫn/repost
(`QuotedPostCard`) mở từ feed cũng nhận snippet đã sạch.

## Bề mặt KHÁC vẫn in `<>` (chỉ LIỆT KÊ, đã KHÔNG sửa)

1. `features/community/CommunitySaved/index.tsx:99` — bài đã lưu, snippet từ nguồn riêng.
2. `features/saved/SavedLibrary/index.tsx:174-185` — ghép `title — snippet` làm title hàng VÀ haystack
   tìm kiếm; `<>` lọt vào cả hiển thị lẫn chuỗi tìm. `features/dashboard/CommunityTab/SavedSection` cùng họ.
3. `features/search/SearchResultRow/index.tsx:41` — tìm kiếm toàn hệ, nguồn khác community feed.
4. `reuseable/QuotedPostCard/index.tsx:49-51` — sạch khi mở từ feed, nhưng caller nào tự truyền
   snippet thô thì vẫn dính.

Không dính: `SubjectCommunity/index.tsx:113` dùng `<MarkdownContent>` nên `<https://…>` đã thành
autolink thật. Bề mặt thông báo chưa rà — không khẳng định sạch hay bẩn.
