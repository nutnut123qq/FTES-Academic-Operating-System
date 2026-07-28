# hls-fullscreen-and-datauri-image — Player self-host dùng fullscreen NATIVE (bỏ nút trùng) + render ảnh nhúng data-URI trong bài DOCUMENT

## Why
Hai lỗi nhỏ nhưng khó chịu ở trang học:

1. **Nút phóng to trùng trên player HLS self-host.** Đợt `preview-blur-document-trial-only`
   dựng `LessonFullscreenButton` (phóng to một `<div>` container để giữ AI FAB trong
   fullscreen) và ép cả 2 player dùng chung. Player self-host (`<video controls>`) vốn ĐÃ có
   nút fullscreen native của trình duyệt → thành ra hiện **2 nút phóng to** chồng nhau (native
   + overlay tự chế), lại phải `controlsList="nofullscreen"` để bịt native — rối và thừa.
2. **Ảnh nhúng data-URI trong bài DOCUMENT không hiện.** Body bài dạng
   `![](data:image/png;base64,…)` bị chốt URL của react-markdown (`defaultUrlTransform`, strip
   MỌI `data:`) xoá `src` → ảnh vỡ / hiện như text thô. Ảnh nhúng base64 là nội dung do admin
   soạn hợp lệ, cần render đúng thành `<img>`.

## What Changes
- **Player self-host dùng fullscreen NATIVE của `<video>`, bỏ overlay tự chế.**
  `LessonHlsPlayer` không còn import/dùng `useElementFullscreen` / `useElementFullscreenSupported`
  / `LessonFullscreenButton`, không còn `controlsList="nofullscreen"` → giữ nguyên bộ điều khiển
  native (kể cả nút fullscreen của trình duyệt). `LessonFullscreenButton` (overlay phóng to
  container) giờ **chỉ còn dùng ở player YouTube**, nơi native fullscreen của iframe đã bị tắt
  (`playerVars.fs=0`) nên cần nút tự chế để phóng to container (giữ AI FAB trong tầm nhìn).
- **Cho phép render ảnh data-URI trên `img[src]` (chỉ vài mime ảnh an toàn).**
  `MarkdownContent` thêm `urlTransform` giữ nguyên `data:image/(png|jpeg|jpg|gif|webp|svg+xml);base64,`
  cho `img[src]` (còn lại nhường `defaultUrlTransform`), và mở rộng schema `rehype-sanitize`
  (thêm scheme `data` cho ĐÚNG `protocols.src`) để data-image sống qua sanitize ở nhánh
  `allowHtml`. `javascript:` và mọi `data:`/scheme khác trên link (`href`) VẪN bị strip — không
  nới rộng bề mặt XSS.
- **`stripPreviewLinks` (teaser học thử) KHÔNG đụng data-URI.** Bộ strip link của
  `DocumentReader` thêm negative-lookahead `(?!data:)` cho `![alt](url)`/`[text](url)` inline:
  ảnh nhúng `![](data:…)` là nội dung (không mở trang ngoài) nên giữ nguyên; chỉ link
  http/https ngoài + anchor mới bị bỏ URL.

## Capabilities
### New Capabilities
- `hls-fullscreen-and-datauri-image`: player self-host dùng fullscreen native (nút overlay chỉ ở
  YouTube) + render ảnh nhúng data-URI trong markdown (guard mime + không đụng link).

## Impact
FE-only, nhánh `fix/hls-fullscreen-and-datauri`. Sửa: `LessonHlsPlayer`,
`LessonFullscreenButton` (doc + copy), `MarkdownContent`, `DocumentReader`. Thêm test:
`MarkdownContent` (data-image render thành `<img>` giữ src; `javascript:` bị strip) +
`DocumentReader` (teaser giữ data-image, vẫn bỏ link ngoài). tsc `--noEmit` (exit 0) + webpack
build compiled + vitest ảnh hưởng xanh. Không đụng hành vi preview (clamp/countdown), player
YouTube, hay đọc bài đã sở hữu.
