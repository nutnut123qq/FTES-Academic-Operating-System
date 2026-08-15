# share-metadata-and-link-preview — link khoá học / môn học unfurl ra card thật, và bài viết có card xem trước

> **Change hồi tố.** Code đã ship trong đợt 1 (2026-08-15); tài liệu viết SAU theo diff thật.

## Why

1. **Mọi link dán ra ngoài đều unfurl thành card chung của site.** `/courses/[courseId]` và
   `/subjects/[subjectId]` là client component (`"use client"`), không có `generateMetadata`, nên
   Zalo/Messenger/Facebook chỉ thấy metadata mặc định của layout. Link khoá học là thứ được chia sẻ
   nhiều nhất, và nó trông y hệt link trang chủ.
2. **`NEXT_PUBLIC_SITE_URL` thiếu trên bản deploy.** `SEO_CONFIG.siteUrl` rơi về
   `http://localhost:3000`, nên `og:url` / `og:image` mặc định của MỌI trang production trỏ localhost.
3. **Bài cộng đồng dán link vào thì chỉ có một dòng url trần.** Không có card xem trước như F8 /
   Facebook. Không thể fetch thẳng trang đích từ trình duyệt (CORS), nên phải có route phía server —
   mà route "server tự gọi url do người dùng chọn" chính là một bề mặt SSRF.

## What Changes

- **`generateMetadata` cho `/courses/[courseId]`**: đổi page thành server wrapper (thân vẫn là client
  `CourseDetail`), fetch course theo slug (memo hoá bằng `React.cache` cho mỗi request), dựng title /
  description (đã strip HTML+markdown, cắt ~160 ký tự) / canonical + hreflang / OG + Twitter card với
  ảnh bìa thật. Fetch phía server không có token nên chỉ lấy được projection công khai — không rò
  giáo trình bị gate. Lỗi → `{}` (rơi về metadata mặc định), trang vẫn render.
- **`generateMetadata` cho `/subjects/[subjectId]`**: cùng khuôn, tên môn chọn theo locale
  (`vi` ưu tiên `nameVi`), title dạng `CODE — Tên`, ảnh `imageUrl || thumbnailUrl`.
- **`NEXT_PUBLIC_SITE_URL` vào `.env.production`** (kèm comment nói rõ hậu quả nếu thiếu).
- **MỚI route `GET /api/unfurl?url=…`** (`runtime: "nodejs"`) trả card `og:*` / `twitter:*` /
  `<title>` dạng JSON. Vì server gọi url do caller chọn nên có rào SSRF: chỉ http/https, cấm
  credentials trong url, chặn loopback / RFC1918 / link-local `169.254.x` (endpoint metadata của
  cloud) / CGNAT / multicast / `0.x`, chặn hostname trần và các hậu tố nội bộ
  (`.localhost .local .internal .home.arpa`), **resolve DNS lại trước MỖI hop**, tự đi redirect
  (tối đa 3 hop, mỗi hop validate lại), một deadline 5s dùng chung cho cả chuỗi.
- **Cache trong tiến trình** cho kết quả unfurl (thành công 10 phút, thất bại 60 giây, tối đa 200
  entry, evict cái cũ nhất) — một bài "hot" không unfurl lại theo mỗi lượt render. Không thêm Redis.
- **Trần đọc body 1 MiB** (KHÔNG phải 256 KiB như bản đầu). Lý do đo được: trang Next của chính
  FTES inline RSC payload TRƯỚC thẻ share, `og:title` của `/en/blog/<slug>` nằm ở ~byte 309k của tài
  liệu 315k — trần 256 KiB cắt mất và MỌI link FTES unfurl thành "no preview". Cũng vì thẻ share
  nằm SAU `</head>` (streamed metadata) nên KHÔNG được dừng ở `</head>`; quét toàn bộ phần body đã bị
  cắt trần.
- **MỚI card `LinkPreview`** (ảnh + tiêu đề + mô tả + domain, mở tab mới) render dưới thân bài cộng
  đồng cho link ĐẦU TIÊN trong bài (`firstLinkUrl` trong `postLinks.ts`: bỏ code fence / inline code
  trước, cắt dấu câu đuôi). Card là trang trí: đang tải hoặc không unfurl được thì render **rỗng**,
  không để lại hộp vỡ.
- **`unwrapAutolinks`** bỏ cặp `<>` của autolink CommonMark trong thân bài trước khi render, để
  người đọc thấy `https://…` chứ không phải `<https://…>` (cả hai dạng vốn đã thành `<a>` thật).

## Impact

- Affected specs: `share-metadata` (ADDED), `link-preview-unfurl` (ADDED)
- Affected code: `app/[locale]/courses/[courseId]/page.tsx`, `app/[locale]/subjects/[subjectId]/page.tsx`,
  `app/api/unfurl/{route.ts,unfurl.ts,unfurl.test.ts}`, `components/reuseable/LinkPreview/`,
  `components/features/community/CommunityPostDetail/{postLinks.ts,CommunityPostContent.tsx}`,
  `.env.production`, `messages/{en,vi}.json` (cụm `linkPreview.*`, `seo.communityPost.*`)
- Metadata cho `/community/[postId]` được dựng trong change này nhưng ĐÃ ĐƯỢC NỐI LẠI vào endpoint
  public ở change `community-public-og-and-feed-links` — xem change đó cho hình dạng cuối cùng.
- Không đụng BE, không migration.
