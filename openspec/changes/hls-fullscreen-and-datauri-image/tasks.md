# Tasks — hls-fullscreen-and-datauri-image

## 1. Player self-host dùng fullscreen native (bỏ nút overlay trùng)
- [x] 1.1 `LessonHlsPlayer`: bỏ import + dùng `useElementFullscreen`/`useElementFullscreenSupported`/`LessonFullscreenButton` (và `cn` thừa)
- [x] 1.2 `LessonHlsPlayer`: bỏ `controlsList="nofullscreen"` + container fullscreen div → `<video controls>` giữ nguyên bộ điều khiển native (kể cả nút fullscreen trình duyệt)
- [x] 1.3 `LessonFullscreenButton`: cập nhật doc/copy — overlay phóng to container CHỈ dùng cho YouTube (native fs của iframe đã tắt); self-host không phải consumer
- [x] 1.4 Xác nhận `LessonYouTubePlayer` vẫn dùng `LessonFullscreenButton` + hook fullscreen như cũ (không đổi)

## 2. Render ảnh nhúng data-URI trong markdown
- [x] 2.1 `MarkdownContent`: thêm `urlTransform` giữ `data:image/(png|jpe?g|gif|webp|svg+xml);base64,` cho `img[src]`, còn lại nhường `defaultUrlTransform`
- [x] 2.2 `MarkdownContent`: mở rộng schema `rehype-sanitize` (`defaultSchema` + thêm `data` vào `protocols.src`) cho nhánh `allowHtml`; `protocols.href` giữ nguyên (link vẫn strip `data:`/`javascript:`)
- [x] 2.3 `DocumentReader.stripPreviewLinks`: thêm negative-lookahead `(?!data:)` cho `![alt](url)`/`[text](url)` → giữ ảnh nhúng, vẫn bỏ link http/https ngoài + anchor

## 3. Test
- [x] 3.1 `MarkdownContent` test: `![](data:image/png;base64,…)` render thành `<img>` giữ nguyên `src`; `![x](javascript:…)` bị strip `src` (guard bảo mật)
- [x] 3.2 `DocumentReader` test: teaser học thử giữ nguyên `data:image/…` nhúng, vẫn bỏ URL link ngoài

## 4. Verify
- [x] 4.1 `npx tsc --noEmit` sạch (exit 0)
- [x] 4.2 `npm run build` (webpack) compiled successfully
- [x] 4.3 vitest ảnh hưởng xanh (MarkdownContent, DocumentReader, LessonReader, LessonVideoBlock)
