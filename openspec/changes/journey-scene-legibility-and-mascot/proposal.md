# journey-scene-legibility-and-mascot — scene hành trình đọc được + FrosTES chạy trên đường ray

## Why
Hai góp ý website (2026-07-26) rơi vào **cùng một component** `UserJourneyScene`:

1. *"Icon còn đơn điệu chưa rõ ý nghĩa… phần thành quả có thể để huy chương hoặc chiếc cúp"* —
   thực tế chặng Thành quả ĐÃ là cái cúp, nhưng không ai nhận ra vì mọi mesh dùng
   `meshBasicMaterial` (bỏ qua ánh sáng) → khối 3D mất cạnh, dẹp thành mảng màu; 4/5 chặng
   lại dùng chung tông xám `--default`.
2. *"Thêm con cáo đứng cạnh những phần tử… cho nó chạy trên đường và đứng tại mỗi ô thay vì
   dòng chạy"* — hiện đường ray chỉ có 4 chấm tròn chạy vô nghĩa.

Làm rời nhau thì phải chỉnh scale/camera hai lượt (cáo là vật chuẩn kích thước của cả scene),
lượt sau đạp lượt trước. Nên gộp một change.

## What Changes
**Legibility (góp ý 1)**
- Thêm `ambientLight` + `directionalLight`; `meshBasicMaterial` → `meshLambertMaterial` cho
  khối chặng. Bỏ hack tô 2 tông cứng (`top`/`side`) — ánh sáng lo việc đó.
- Mỗi chặng một tông riêng, dẫn xuất từ `--accent` bằng offset hue (giữ theme-aware, không
  bịa token mới); Thành quả giữ `--success`. Chặng active sáng lên thay vì đổi hẳn màu.
- Nắn 3 khối đang không ra hình: **workplace** (slab+panel → bàn + màn hình),
  **practice** (trụ trơn → tạ có bánh + AI orb), **outcome** (thêm **quai cúp** + đế dày —
  quai là thứ khiến mắt nhận ra "cúp").
- Phóng khối + kéo camera gần một nấc (hình đúng mà 40px thì vẫn là cục).

**Mascot (góp ý 2)**
- Bóc viền sticker trắng khỏi 4 pose → `public/mascot/plain/*.webp` (**file mới**, không đụng
  4 file gốc vì HomeMascotGreeting / mascot-moments / onboarding đang dùng bản có viền).
- FrosTES chạy dọc đường ray tới chặng đang active và **đứng lại tại ga đó**, đổi pose theo ga:
  `greeting` (Trang chủ) · `explain` (Workplace, Khoá học) · `point` (Luyện tập) · `cheer`
  (Thành quả). Bob nhẹ khi đứng.
- **Bỏ 4 chấm chạy** trên đường ray (cáo thay vai trò đó); giữ nét đứt của đường.
- Bóng đổ giả dưới chân (ellipse mờ) để cáo chạm đất thay vì trôi lơ lửng.

## Out of scope
- Không đổi bố cục đường ray, không đụng stepper/auto-advance của caller.
- Không thay 4 file mascot gốc dùng ở nơi khác (đổi đại trà = quyết định thương hiệu, hỏi sau).
- Không có sprite sheet bước chân: cáo là ảnh tĩnh trượt + bob, không phải animation đi bộ.

## Rủi ro
- Đổi sang material nhận đèn làm đổi tông màu TOÀN scene → phải chỉnh cường độ đèn bằng mắt.
- **Không nghiệm thu tự động được**: WebGL không render trong preview headless (canvas đen,
  `requestAnimationFrame` không chạy). Chỉ bảo đảm tsc + build; đẹp/xấu do người xem chốt.
