# album-folder-upload — Chọn CẢ THƯ MỤC khi đóng góp / bổ sung ảnh bộ đề FE

## Why
Đóng góp một bộ đề FE hiện chỉ có `<input type="file" multiple>`: người đóng góp phải chọn
tay từng ảnh (hoặc bôi cả loạt trong hộp thoại) cho một bộ đề tới 50 trang. Ảnh đề thật nằm
sẵn trong 1 thư mục trên máy (`CSD201/`, thường có cả thư mục con theo kỳ `CSD201/2024/`),
nên đúng thao tác người dùng muốn là **chọn nguyên thư mục** rồi để hệ thống tự lọc ảnh và
xếp thứ tự. Cơ chế chọn thư mục ĐÃ CÓ trong repo (`ChallengeMethodSolver`: đặt
`webkitdirectory`/`directory` bằng ref callback vì React không khai báo 2 prop này) — chỉ
cần dùng lại, không phát minh lại.

Hai điều dễ hỏng nếu làm ẩu, nên phải chốt trong spec: (a) thư mục đề thật LUÔN có rác
(`Thumbs.db`, `.DS_Store`, PDF lạc, thư mục con) → lọc nhưng phải BÁO đã bỏ bao nhiêu, vì
sao; (b) thứ tự chọn CHÍNH LÀ `sortOrder` BE đóng dấu khi ảnh tới → phải sắp **tự nhiên**
(`de1, de2, de10`), không phải sắp chuỗi (`de1, de10, de2`), nếu không thứ tự trang của bộ
đề sai.

## What Changes
- **Helper thuần mới** — `resource/ResourceUpload/albumFolderPick.ts` (cạnh `uploadRules.ts`,
  nơi đã giữ `FE_ALBUM_IMAGE_MIME` / `FE_ALBUM_MAX_IMAGES` / `FE_ALBUM_MAX_IMAGE_MB`):
  - `albumFilePath(file)` — đường dẫn để sắp: `webkitRelativePath` (folder pick) hoặc `name`,
    chuẩn hoá về dấu `/`;
  - `compareNaturalPath(a, b)` — so sánh **theo từng đoạn đường dẫn** bằng
    `Intl.Collator("en", { numeric: true, sensitivity: "base" })` (không tự chế parser số),
    locale ghim để thứ tự album không đổi theo ngôn ngữ người xem; tie → so code point cho
    tổng + xác định;
  - `triageAlbumPick(files, { room, maxImageMb, sortByPath })` → `{ accepted, wrongType,
    tooLarge, droppedOverCap }`. Thứ tự xử lý: **type → size → sort → cap**, để cap giữ N
    trang ĐẦU theo thứ tự album chứ không phải N tệp đầu OS liệt kê. Tệp trình duyệt không
    báo `type` được cứu theo đuôi (.png/.jpg/.jpeg/.webp) và bọc lại `new File(...)` với MIME
    chuẩn — cùng tinh thần fallback của `resolveResourceMimeType`, tránh part multipart bị gửi
    là `application/octet-stream`.
  - Unit test `albumFolderPick.test.ts` (11 case: natural sort, thư mục con, lọc rác, quá cỡ,
    cap + báo thừa, file pick giữ nguyên thứ tự, cứu tệp thiếu MIME).
- **`SubjectPractice/ExamContribute.tsx`** (`AlbumImagePicker`, đóng góp bộ đề MỚI) — thêm nút
  **"Chọn cả thư mục"** CẠNH nút "Thêm ảnh" (không gỡ picker cũ: vẫn có người có ảnh rời) +
  input ẩn thứ hai gắn `webkitdirectory`/`directory` qua ref callback. Nhánh folder chạy
  `triageAlbumPick(..., sortByPath: true)` với `room = FE_ALBUM_MAX_IMAGES - picks.length`,
  toast từng loại bị bỏ (sai định dạng / quá cỡ / vượt cap) + toast thành công kèm số ảnh đã
  thêm. Ảnh vào đúng list `picks` cũ → vẫn upload sau khi resource được tạo, KHÔNG đổi chain.
- **`SubjectFeAlbum/FeAlbumManager.tsx`** (bổ sung ảnh vào bộ đề ĐÃ CÓ) — thêm nút + input
  thư mục tương tự; `onPick(fileList, fromFolder)` nay dùng chung `triageAlbumPick`
  (`room = maxImages(server) - images.length`) thay cho 3 vòng `filter` viết tay — cùng bộ
  message `invalidType` / `tooLargeSkipped` / `overflow` như trước, thêm `folderEmpty` cho
  thư mục rỗng. Đường upload **KHÔNG đổi**: vẫn `useMutateAddFeAlbumImagesSwr` tuần tự, tự
  giãn theo `nextFeImageUploadDelayMs` (10/phút, 60/giờ) + backoff 429, có nút dừng.
- **Thư mục con** — GIỮ ảnh trong thư mục con, sắp theo TOÀN BỘ đường dẫn tương đối (đề thi
  hay nằm `CSD201/2024/…`); chọn thư mục cha vẫn ra 1 bộ đề đúng thứ tự kỳ → tên tệp.
- **i18n** — key mới ở cả `vi.json` + `en.json`:
  `subjects.practice.exam.contribute.{addFolder,folderHint,folderEmpty,folderAdded,folderSkippedType,folderSkippedTooLarge,folderOverflow}`
  và `subjects.practice.fe.manage.{addFolder,folderHint,folderEmpty}`.

## Impact
FE-only, không đụng BE/contract. Thêm: `albumFolderPick.ts` + test. Sửa: `ExamContribute.tsx`,
`FeAlbumManager.tsx`, `messages/{vi,en}.json`. Không thêm đường upload song song/bulk nào —
50 ảnh chọn theo thư mục tự giãn tốc độ y hệt 50 ảnh chọn tay.
