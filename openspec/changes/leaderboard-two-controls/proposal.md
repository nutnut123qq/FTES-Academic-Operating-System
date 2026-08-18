# Dựng lại trang xếp hạng: hai nút điều khiển, mùa giải, tích luỹ, khung viền

## Vì sao

Chủ dự án: *"trang leaderboard làm chưa đẹp lắm, lên kế hoạch làm cho nó đàng hoàng"* và
*"làm cái các option đơn giản thôi, hiện tại quá phức tạp và nhiều nút"*.

Đếm thật trên trang cũ: **12 nút** — 3 nút kỳ hạn mục tiêu, 3 nút chỉ số, ô nhập, nút Lưu,
2 tab, ô chọn khoá, link mở bảng khoá. Tám nút đầu thuộc khối "đặt mục tiêu", vốn không
liên quan đua hạng, và chúng đẩy chính cái bảng xuống dưới màn hình đầu tiên.

Ngoài số nút, ba cơ chế đã chốt không hiện được lên trang:
- **khung viền avatar** (V341/V353) chưa từng được vẽ ở bất kỳ màn hình FE nào;
- **kỳ nào / còn bao lâu** — dải mùa in thẳng `seasonCode`, người dùng thấy `T-SU26-bfd6f768`;
- **xem kỳ cũ và xem tích luỹ** — không có đường vào.

## Thay đổi

- **Hai nút, cố định**: ô CHỌN MÙA (kỳ đang chạy · kỳ đã đóng · Tích luỹ) + thanh CHỌN BẢNG
  (Tổng · Khoá học · Cộng đồng & Workplace).
- **Tích luỹ nằm trong ô chọn mùa**, không phải nút riêng: nó trả lời câu hỏi *đếm trong
  khoảng thời gian nào*, cùng trục với ô đó — khác hẳn câu hỏi *đếm nguồn EXP nào* của thanh
  chọn bảng.
- **Ô chọn khoá chỉ hiện khi chọn lát cắt "Khoá học"** ⇒ không còn nút thứ ba thường trực.
  Bảng khoá vẫn đi qua GraphQL `courseLeaderboard` (backend từ chối `board=course` có chủ đích).
- **Dải mùa giải**: tên kỳ đọc được + đếm ngược + hạng/EXP của người xem. Đếm ngược tính ở
  client sau khi mount để không lệch hydrate.
- **Danh tính + khung viền** trên mọi dòng và bục top 3.
- **Khối mục tiêu** chuyển sang `/profile/progress`.

## Phụ thuộc

Backend PR #151 (V354). Chưa deploy thì các trường mới về `null`/`false` và trang rơi về
đúng hành vi cũ — không vỡ.

## Không làm

- Không dựng lại bảng khoá học (đã có, công thức riêng).
- Không đổi quyền, không đổi cách tính điểm.
