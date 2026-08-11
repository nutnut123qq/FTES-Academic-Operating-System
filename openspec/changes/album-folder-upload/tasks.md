# Tasks — album-folder-upload

## 1. Helper thuần + test
- [x] 1.1 `resource/ResourceUpload/albumFolderPick.ts`: `albumFilePath` (webkitRelativePath → POSIX), `compareNaturalPath` (Intl.Collator numeric, so theo từng đoạn `/`, tie → code point), `triageAlbumPick(files, {room, maxImageMb, sortByPath})` → `{accepted, wrongType, tooLarge, droppedOverCap}` theo thứ tự type → size → sort → cap; cứu tệp thiếu `File.type` theo đuôi (.png/.jpg/.jpeg/.webp) bằng `new File(...)` MIME chuẩn
- [x] 1.2 `albumFolderPick.test.ts`: natural sort (`de1 < de2 < de10`), thứ tự theo đường dẫn đầy đủ khi có thư mục con, lọc `Thumbs.db`/`.DS_Store`/PDF (đếm `wrongType`), ảnh quá cỡ (`tooLarge`), cap giữ N đầu ĐÃ SẮP + `droppedOverCap`, file pick giữ nguyên thứ tự, album đầy → `accepted` rỗng, cứu `.webp` thiếu MIME

## 2. Đóng góp bộ đề mới (ExamContribute → AlbumImagePicker)
- [x] 2.1 Thêm input ẩn thứ hai đặt `webkitdirectory`/`directory` **qua ref callback** (mirror `ChallengeMethodSolver`), `aria-label` = nhãn nút, reset `value` sau mỗi lần chọn
- [x] 2.2 Nút "Chọn cả thư mục" (`FolderIcon`, `variant="tertiary"`) CẠNH nút "Thêm ảnh" — KHÔNG gỡ picker tệp; cả hai khoá khi đã đủ `FE_ALBUM_MAX_IMAGES`
- [x] 2.3 `onFolder`: `triageAlbumPick(..., sortByPath: true)`, `room = FE_ALBUM_MAX_IMAGES - picks.length`; toast riêng cho `wrongType` / `tooLarge` / `droppedOverCap`, toast success kèm số ảnh đã thêm, `folderEmpty` khi thư mục không có ảnh nào dùng được
- [x] 2.4 Ảnh chấp nhận đi vào đúng list `picks` cũ (`toPicks` dùng chung) → chain `useMutateCreateFeAlbumSwr` (create → N ảnh tuần tự → submit) KHÔNG đổi

## 3. Bổ sung ảnh vào bộ đề đã có (FeAlbumManager)
- [x] 3.1 Thêm input thư mục (ref callback như trên) + nút "Chọn cả thư mục" cạnh "Thêm ảnh"
- [x] 3.2 `onPick(fileList, fromFolder)` dùng chung `triageAlbumPick` (`room = remaining` từ `maxImages` server), `sortByPath = fromFolder`; giữ nguyên message `full`/`invalidType`/`tooLargeSkipped`/`overflow`, thêm `folderEmpty`
- [x] 3.3 KHÔNG đụng `runAdd`/`useMutateAddFeAlbumImagesSwr`/`feAlbumManage.ts` — upload vẫn tuần tự, tự giãn 10/phút · 60/giờ, backoff 429, nút dừng

## 4. i18n
- [x] 4.1 `vi.json` + `en.json`: `subjects.practice.exam.contribute.{addFolder,folderHint,folderEmpty,folderAdded,folderSkippedType,folderSkippedTooLarge,folderOverflow}`
- [x] 4.2 `vi.json` + `en.json`: `subjects.practice.fe.manage.{addFolder,folderHint,folderEmpty}`

## 5. Verify
- [x] 5.1 `npx tsc --noEmit` → exit 0
- [x] 5.2 `npx eslint` 4 tệp đụng tới → sạch
- [x] 5.3 `npx vitest run src/messages src/components/features/subject src/components/features/resource` → 26 file / 226 test xanh
- [x] 5.4 `NODE_OPTIONS=--max-old-space-size=4096 npm run build` (webpack) → xanh
