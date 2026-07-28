# subject-name-locale-and-semester — tên môn theo ngôn ngữ + chip kỳ học

## Why
Góp ý website 2026-07-26 (mục workspace môn học), đối chiếu bằng payload thật của apitest:

```json
{ "code": "CSD201", "name": "Data Structures and Algorithms",
  "nameVi": "Cấu trúc dữ liệu và giải thuật",
  "credits": 3, "recommendedSemester": 3, "thumbnailUrl": null }
```

- **Tên môn không đổi khi bật tiếng Anh.** Người góp ý đoán là "fix cứng" — thực tế BE trả CẢ HAI
  tên, còn FE lấy `nameVi || name` nên luôn ưu tiên tiếng Việt bất kể locale. Bản dịch nằm sẵn
  trong payload mà không dùng.
- **Thiếu thông tin kỳ.** BE đã có `recommendedSemester`; FE chưa map field này vào model nên
  không có gì để hiển thị.

## What Changes
- `pickSubjectName(locale, name, nameVi)`: `vi` → ưu tiên `nameVi`; locale khác → ưu tiên `name`;
  thiếu bên nào rơi về bên kia (không bao giờ trả rỗng). Áp cho cả 2 mapper (catalog summary +
  workspace detail).
- `useQuerySubjectsSwr`: **map ra NGOÀI fetcher**. Để trong fetcher thì bản đã map bị cache theo
  SWR key → đổi ngôn ngữ vẫn ra tên cũ; nhét locale vào key thì lại fetch lại thừa.
- `Subject.recommendedSemester` (number | null) + chip "Kỳ {n}" cạnh số tín chỉ ở card catalog.
  Môn chưa gắn kỳ (`null`) thì ẩn chip, không đoán.
- i18n `subjects.semester` (vi + en).
- Test `useQuerySubjectSwr.test.tsx`: mock `next-intl` bổ sung `useLocale` (hook giờ đọc locale).

## Out of scope / đã ghi nhận riêng
- **Ảnh môn**: FE sẵn sàng cả 2 bề mặt (card 16:9 + cover ở workspace), BE có cột + DTO, nhưng
  `thumbnail_url` NULL toàn bộ VÀ form môn ở `FTES-AOS-Admin` chỉ có `code/name/description/status`
  → **không có đường nhập ảnh qua sản phẩm**. Cần bổ sung field bên Admin trước (repo khác).
- Chip kỳ ở header trang workspace (`SubjectWorkspaceShell`) — làm tiếp ở lượt sau.
