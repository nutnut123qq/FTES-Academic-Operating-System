# subject-list-image-and-rounded — ảnh đại diện môn ở list + bo tròn nhất quán

## Why
Góp ý website (2026-07-28), nguyên văn:

> "Ở list subject chưa có ảnh đại diện, sửa cho nó bo tròn 1 tí, bấm vào chi tiết thì
> có rồi mà đang bị vuông, bo tròn 1 tí"

Đối chiếu code thật:

- **List (`/subjects`, `SubjectCatalog`)**: card ĐÃ có sẵn ảnh cover 16:9 (`next/image`,
  `object-cover`) render khi `imageUrl` khác `null`, cùng badge chữ-cái làm mốc nhận diện.
  `useQuerySubjectsSwr → toSubjectFromSummary` map `imageUrl: summary.imageUrl ||
  summary.thumbnailUrl || null` → **hook đã mang `imageUrl`** (kèm fallback `thumbnailUrl`),
  không cần đổi query/DTO. Người dùng chưa thấy ảnh vì DỮ LIỆU rỗng: `thumbnail_url` NULL
  toàn bộ và form môn ở `FTES-AOS-Admin` chưa có đường nhập ảnh (repo khác — đã ghi ở
  `subject-name-locale-and-semester`). Cái người dùng thấy là badge chữ-cái, đang bo
  `rounded-large` (khiêm tốn) → cảm giác "chưa có ảnh / vuông".
- **Detail (`SubjectWorkspaceShell` header)**: badge nhận diện `size-11` (ảnh cover khi có,
  fallback chữ-cái) đang bo `rounded-large` → người dùng thấy "vuông", muốn bo tròn thêm 1 tí.
- **Không nhất quán**: khung card list bo `rounded-2xl`, block cover chung của nhà
  (`blocks/media/CoverImage`) cũng `rounded-2xl`, nhưng các badge nhận diện lại `rounded-large`.

## What Changes
Chuẩn hoá bán kính bo của MỌI bề mặt ảnh/nhận diện môn về `rounded-2xl` (bo nhẹ, vuông-tròn,
KHÔNG phải hình tròn `rounded-full`), khớp khung card list + block `CoverImage` của nhà:

- `SubjectCatalog` (list):
  - badge chữ-cái trong hàng nhận diện: `rounded-large` → `rounded-2xl`.
  - `SubjectCardSkeleton` badge: `rounded-large` → `rounded-2xl` (skeleton soi đúng card).
  - Ảnh cover 16:9 GIỮ NGUYÊN — vẫn bo `rounded-2xl` nhờ khung `overflow-hidden rounded-2xl`.
- `SubjectWorkspaceShell` (detail header):
  - slot ảnh cover `size-11`: `rounded-large` → `rounded-2xl`.
  - badge chữ-cái fallback `size-11`: `rounded-large` → `rounded-2xl`.

Chỉ đổi className bo góc; không đụng data/logic/hook → test cũ xanh nguyên.

## Out of scope / đã ghi nhận riêng
- **Không refactor card sang block `CoverImage`**: card hiện dùng `next/image` KÈM xử lý
  ảnh-hỏng → fallback badge (`onError`) và KHÔNG hiện ô rỗng khi `imageUrl` null. `CoverImage`
  bọc `<img>` thô, không có `onError` và luôn hiện ô `bg-surface-secondary` rỗng khi thiếu ảnh
  → đổi sang sẽ REGRESS (mọi card hiện ô xám rỗng vì data đang NULL toàn bộ, và mất fallback
  ảnh-hỏng). Giữ implement hiện tại; bán kính đã trùng `rounded-2xl` của `CoverImage`.
- **Nhập ảnh môn qua sản phẩm**: cần thêm field ảnh ở form môn `FTES-AOS-Admin` (repo khác) +
  seed `thumbnail_url`/`imageUrl` để ảnh thực sự hiện. Ngoài phạm vi FE-only lượt này.
