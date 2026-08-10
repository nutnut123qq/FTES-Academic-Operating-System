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

## Cập nhật 2026-07-28 — thay bằng model do đội tự dựng + hạ camera về chính diện
Model TRELLIS chỉ là bản tạm để chứng minh đường đi. Đội gửi model dựng riêng
(`frostes1.glb`, Blender, **31,7 MB · 626.780 tam giác · 3 texture**) — đẹp hơn hẳn: nét hơn,
có logo FTES trên áo, tỉ lệ chuẩn, hướng sẵn đúng. Nhưng 31,7 MB thì lần chụp thử đầu tiên
**mascot chưa kịp hiện sau 12 giây** — khách vào trang sẽ thấy scene thiếu nhân vật rồi mới bụp ra.

Nén 2 bước, giữ nguyên file gốc:
- `gltf-transform simplify --error 0.005` (meshoptimizer) → 626.780 tam giác còn **28.745**.
- `scripts/shrink-glb-texture.py … 512 82` → 3 texture về 512, JPEG.
- **31,7 MB → 1,47 MB (−95%)**. So ảnh ở cỡ hiển thị thật (~200px): không phân biệt được. Mốc
  1024 (1,8 MB) cũng không khác gì 512 nên lấy 512.

⚠️ Lệnh gộp `gltf-transform optimize` **chết** ở khâu texture (`colourspace: parameter space not
set`, lỗi vips) → phải tách simplify và nén texture thành hai bước.

**Camera**: `cameraOffset` `[2.6, 4.4, 7.0]` → `[0, 3.0, 7.2]` (camera Canvas khởi đầu chỉnh theo).
Bỏ lệch phải, hạ độ cao. Đã thử cả chính diện thật `y = 2.0`: nhân vật đẹp nhất nhưng nhà tụt
thành ngũ giác phẳng và **đường ray dẹp thành một vạch** — mất luôn ý "hành trình qua 5 ga", tức
mất lý do scene này tồn tại. `y = 3.0` giữ được mái nhà, mặt bàn và độ uốn của đường ray.

`frostes1.glb` 31,7 MB **KHÔNG vào git** — bản đã nén ghi đè `frostes.glb`.
