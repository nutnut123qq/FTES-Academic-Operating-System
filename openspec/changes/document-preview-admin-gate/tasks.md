# Tasks — document-preview-admin-gate (FE)

## 1. Strip link khỏi teaser preview của DOCUMENT
- [x] 1.1 `DocumentReader`: thêm helper `stripPreviewLinks` (markdown link/ảnh, reference link +
  định nghĩa, autolink, URL trần, thẻ `<a>` → giữ chữ, bỏ URL/href)
- [x] 1.2 Dẫn xuất `displayBody = showDocumentPreviewTeaser ? stripPreviewLinks(bodyMd) : bodyMd`
- [x] 1.3 Dùng `displayBody` cho `extractResourceLinks`, `hasWrittenBody`, và `MarkdownContent`
- [x] 1.4 FULL / không-preview vẫn dùng `bodyMd` (link thật cho người đã mua)

## 2. Xác nhận khoá-cứng (accessLevel NONE) đã đúng sẵn
- [x] 2.1 DOCUMENT NONE: `LessonView.locked=true`/`accessLevel=NONE`/`videoRef=null` + content 403 →
  `bodyMd=""` → tường phí cứng (không body, không link) — không cần đổi

## 3. Verify
- [x] 3.1 Test: teaser preview có markdown link + URL trần → render chữ, KHÔNG render URL
- [x] 3.2 `npx tsc --noEmit` (exit 0)
- [x] 3.3 `npm run build` (webpack) compiled successfully
