# mascot-3d-model — FrosTES trên đường ray thành model 3D thật, thôi làm bìa phẳng

## Why
`journey-scene-legibility-and-mascot` đưa mascot lên đường ray bằng **billboard 2D** (`<sprite>`
+ ảnh render sẵn). Xoay scene thì nhà/bàn/cúp xoay thật, còn mascot cứ chường mặt vào ống kính —
không có bên hông, không có lưng, và không ăn đèn chung với các khối. Sếp yêu cầu dựng hẳn model
3D thay tấm ảnh.

## What Changes
- **Asset mới `public/mascot/frostes.glb`** — sinh từ ảnh pose `greeting` (bản đã bóc viền
  sticker) bằng Space **TRELLIS** trên Hugging Face (gọi qua API Gradio, miễn phí).
  27.450 tam giác, 1 material có texture, **KHÔNG rig**.
- `UserJourneyScene`: `<sprite>` + `useTexture` → `<primitive>` + `useGLTF`. Bỏ bảng
  `POSE_BY_KIND` và 4 texture pose (model chỉ có một dáng).
- **Ép `metalness = 0`, `roughness = 0.85`** khi nạp model.
- **Chuẩn hoá lúc chạy**: đo hộp bao → scale về đúng `MASCOT_HEIGHT`, hạ chân chạm đất, căn tâm.
  Không tin vào scale/pivot của file → đổi model khác vẫn chạy, không phải canh tay.
- `scripts/shrink-glb-texture.py`: hạ texture nhúng (PNG 1024 → JPEG 512) + dựng lại buffer.
  **2.167 KB → 825 KB**.

## Vì sao phải ép metalness
File TRELLIS **không khai báo `metallicFactor`**, mà mặc định của glTF 2.0 là **1.0 = kim loại
đặc**. Scene không có environment map để phản chiếu → vật kim loại render ra khối đen xỉn. Lông
và vải là phi kim nên ép 0 mới đúng vật lý lẫn đúng mắt.

## Đánh đổi (đã báo, người duyệt chấp nhận)
- **Mất 4 pose theo ga** (chào / giảng bài / chỉ tay / ăn mừng) — model không có xương nên cả 5
  ga chung một dáng đứng vẫy tay.
- **Vẫn chưa bước đi thật** — trượt trên ray + nhún, không phải animation bước chân. Muốn có thì
  phải rig, là một vòng riêng.
- **825 KB**, gần hết là hình học (~700 KB). Muốn nhẹ nữa thì gen lại với `mesh_simplify` cao hơn
  chứ nén texture không ăn thua nữa.

## Out of scope
- Rig + animation đi bộ. Đổi 4 file mascot gốc đang dùng ở màn khác. Nén hình học.
