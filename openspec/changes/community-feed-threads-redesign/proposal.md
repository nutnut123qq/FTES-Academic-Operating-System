## Why

Đầu trang cộng đồng (`/community`) đang chiếm quá nhiều chiều cao trước khi thấy bài đầu tiên:
một hàng "Có gì mới?" (avatar chữ cái + nút Đăng), rồi một ô tìm kiếm luôn hiển thị, rồi một hàng
chip lọc loại bài, rồi một hàng sắp xếp. Ba khối search/filter/sort luôn bày ra dù hiếm khi dùng,
đẩy nội dung xuống dưới. Thầy muốn **gọn như Threads**: gom cả cụm về **một hàng duy nhất**.

Ngoài ra:

- Ô "Có gì mới?" hiện dùng avatar chữ-cái đầu (`engagement.you`) thay vì avatar thật của người dùng.
- Tab **Xu hướng** render một danh sách **sơ sài** (số thứ hạng + tiêu đề + tác giả + lượt thích)
  qua `CommunityTrending`/`useQueryTrendingSwr`, trong khi For you / Following / Campus đã render
  **post card đầy đủ** qua `CommunityFeed`. Các tab hiển thị không đồng nhất.

## What Changes

- **Header gọn kiểu Threads (1 hàng):** `[avatar người dùng] [ "Có gì mới?" → mở composer ]
  [🔍 → popover] [ Đăng ]`, có đường kẻ mảnh phía dưới. Bỏ ô tìm kiếm luôn-hiện + hàng chip lọc +
  hàng sắp xếp khỏi luồng chính.
- **Gom search + lọc + sắp xếp vào MỘT kính lúp:** nút icon 🔍 nằm cùng hàng với nút Đăng; bấm vào
  **sổ xuống một popover** (HeroUI `Popover` neo dưới icon) chứa nguyên `CommunityFilterBar` cũ
  (ô tìm kiếm + chip loại bài All/Discussion/Question/Showcase/Knowledge + toggle Mới nhất/Cũ nhất).
  Popover nối vào **đúng state/handler search cũ** — chỉ đổi CHỖ ĐẶT control, không đổi cách lọc.
  Khi có từ khoá / loại bài / sort khác mặc định thì icon hiện **một chấm nhỏ** báo đang lọc.
- **Avatar người dùng ở ô soạn:** ô "Có gì mới?" hiển thị avatar THẬT của người đang đăng nhập
  (Redux `user.user`, cùng nguồn với avatar tài khoản trên navbar, qua block `UserAvatar`); khách /
  chưa có ảnh thì rơi về avatar sinh tự động / chữ cái đầu.
- **Mọi tab render post card đầy đủ:** tab Xu hướng chuyển sang dùng `CommunityFeed tab="trending"`
  (hook feed đã map sang BE `feed(tab: TRENDING)`), nên hiển thị đúng post card đầy đủ như For you.
  Gỡ `CommunityTrending` + `useQueryTrendingSwr` (đã thành mã chết sau khi đổi route).

## Capabilities

### New Capabilities
- `community-feed-redesign`: header gọn kiểu Threads + popover kính lúp gom search/lọc/sắp xếp +
  mọi tab feed dùng post card đầy đủ.

## Impact

- **Sửa:** `CommunityFeed/index.tsx` (thay `ComposerTrigger` bằng `CommunityFeedHeader` có avatar +
  popover kính lúp; bỏ filter bar luôn-hiện), `CommunityFilterBar/index.tsx` (bố cục dọc hợp popover,
  control loại bài cuộn ngang khỏi tràn trên mobile), `community/trending/page.tsx` (→ `CommunityFeed
  tab="trending"`).
- **Xoá:** `CommunityTrending/index.tsx`, `hooks/useQueryTrendingSwr.ts` (mã chết).
- **i18n:** thêm `communityHub.search.open` + `communityHub.search.openActive` (vi + en).
- **FE-only:** không đổi backend, không thêm dependency. Dùng lại block sẵn có (`UserAvatar`,
  HeroUI `Popover`, `CommunityFilterBar`, `SearchInput`, `SegmentedControl`, feed post card).
