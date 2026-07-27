# document-preview-admin-gate — DOCUMENT preview không render link ấn được (lớp phòng thủ FE)

## Why
Thầy chốt: với DOCUMENT, khi đang học thử (preview) phải "detect link và không cho ấn". Ranh giới
CHÍNH đã làm ở BE (strip link khỏi teaser preview server-side, + gate DOCUMENT chỉ previewable khi
Admin bật `preview_percent`). Phía FE: `DocumentReader` render teaser preview qua `MarkdownContent`
(markdown `[text](url)` → thẻ `<a>` bấm được). Cần lớp PHÒNG THỦ để dù BE cũ còn trả link thì FE
cũng KHÔNG dựng link ấn được cho bài đang học thử.

DOCUMENT khoá-cứng (accessLevel NONE — Admin chưa bật) đã sẵn đúng: `LessonView.locked=true`,
`accessLevel=NONE`, `videoRef=null`, và endpoint content trả 403 → `bodyMd=""` → `DocumentReader`
dựng tường phí cứng (không body, không link). Change này chỉ thêm phần strip link cho teaser
PREVIEW (Admin có bật).

## What Changes
- **`DocumentReader`**: khi `showDocumentPreviewTeaser` (locked + accessLevel PREVIEW + contentType
  DOCUMENT), dẫn xuất `displayBody = stripPreviewLinks(bodyMd)` và dùng cho cả nhận diện
  `extractResourceLinks`, `hasWrittenBody`, lẫn `MarkdownContent`. `stripPreviewLinks` giữ chữ, bỏ
  URL/href (markdown link/ảnh, reference link + định nghĩa, autolink, URL trần, thẻ `<a>`) — mirror
  `LessonContentTeaserService.stripLinks` ở BE. FULL/không-preview: dùng `bodyMd` nguyên vẹn (link
  thật cho người đã mua).

## Impact
FE-only. Sửa 1 file: `components/features/learn/DocumentReader/index.tsx` (+ test). Không đổi API,
không thêm dep. `npx tsc --noEmit` sạch + `npm run build` (webpack) xanh.
