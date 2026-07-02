# Design — journey-camera-retake-on-stage-change

## Context

`UserJourneyScene` (landing hero) có `CameraRig` tween camera về trạm active bằng
`camera.position.lerp(desired, 0.08)` mỗi frame (frameloop `demand`). OrbitControls
cho kéo xoay tự do; `onStart` set `userTookOver.current = true` để rig không giành
camera lại khi đang kéo. Cờ này **không bao giờ reset** → sau lần orbit đầu tiên,
click stepper đổi `activeIndex`/`desired` nhưng rig đã chết hẳn.

Ngoài ra rig chỉ gọi `camera.lookAt(target)`; `OrbitControls.target` vẫn ở điểm cũ
(mặc định gốc toạ độ), nên sau khi rig lái camera đi, lần kéo tiếp theo controls
snap camera về hướng target riêng của nó — giật.

## Goals / Non-Goals

**Goals:**
- Đổi trạm active (click stepper hoặc auto-advance) → camera tween mượt MỘT bước
  từ pose hiện tại (kể cả pose người dùng vừa xoay) về pose chuẩn của trạm.
- Kéo xoay sau khi camera đã dời trạm không bị snap (controls pivot đúng trạm active).

**Non-Goals:**
- Không làm animation 2 pha "quay về pose cũ rồi mới bay" (đã bàn, chậm hơn và giật).
- Không phân biệt click-tay vs auto-advance (đã chốt: auto-advance cũng lấy lại camera;
  hover canvas/stepper đã pause auto-advance sẵn nên không bị yank khi đang kéo).
- Không đổi props/API, không đụng `JourneyHero`, `scene.json`, i18n.

## Decisions

1. **Reset takeover trong `CameraRig` theo `desired` đổi**, không thêm prop mới:
   effect `[desired]` sẵn có đổi thành `tookOver.current = false; invalidate()`.
   Alternative bị loại: prop `manualNonce` từ caller để chỉ click-tay mới retake —
   thêm API cho một phân biệt không cần (auto-advance retake là đúng ý đồ guided tour).
2. **Lerp `controls.target` thay cho `camera.lookAt`**: lấy `controls` từ
   `useThree`, mỗi frame rig chạy `controls.target.lerp(target, 0.08)` rồi
   `controls.update()` (update tự lookAt). Một nguồn sự thật cho hướng nhìn —
   hết cảnh rig và controls giữ hai target lệch nhau.
3. **Giữ nguyên tween lerp 0.08 + ngưỡng dừng `distanceToSquared > 0.0004`** —
   đường bay từ pose người dùng về pose chuẩn tự nó là "quay về mượt mà" mà thầy
   muốn, không cần easing/timeline mới.

## Risks / Trade-offs

- [Kéo xoay ĐANG lúc tween] → `onStart` set lại `tookOver = true` như cũ, rig nhả
  ngay giữa chừng — người dùng luôn thắng khi đang chạm.
- [Auto-advance giành camera khi người dùng vừa xoay xong và rời chuột] → chấp nhận
  (đã chốt); hover đã pause nên chỉ xảy ra sau khi rời hẳn scene/stepper.
- [`controls.update()` trong useFrame + enableDamping] → damping của drei tự
  invalidate khi có tương tác; rig chỉ update thêm khi đang tween, không tạo vòng
  render vô hạn vì có ngưỡng dừng.
