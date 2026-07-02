## 1. CameraRig retake + controls target sync

- [x] 1.1 `CameraRig`: effect theo `desired` reset `tookOver.current = false` + `invalidate()` (retake khi trạm active đổi — click lẫn auto-advance)
- [x] 1.2 `CameraRig`: lấy `controls` từ `useThree`; trong `useFrame` lerp `controls.target` về `target` (0.08) rồi `controls.update()` thay cho `camera.lookAt`; giữ ngưỡng dừng invalidate (cộng thêm khoảng cách target nếu cần)
- [x] 1.3 Cập nhật doc-comment của `CameraRig`/`Scene` (takeover chỉ tới lần đổi trạm kế tiếp)

## 2. Verify

- [x] 2.1 `npx tsc --noEmit` sạch
- [x] 2.2 `npm run build` (webpack) xanh
- [x] 2.3 Verify runtime trên dev server: orbit → click stepper → camera tween một bước về trạm; kéo tiếp không snap; đang kéo thì rig không giành
  - Preview headless không chạy được animation (page hidden, rAF chết) — phần React verify bằng preview_eval (aria-selected + label chip đổi theo trạm); phần camera tween **thầy verify tay trên browser thật 2026-07-03: cả 3 điều OK**.
