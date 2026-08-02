# Tasks

- [x] 1. Sinh model từ `greeting.webp` qua Space TRELLIS (Gradio API, miễn phí) → `frostes.glb`.
- [x] 2. `useTexture` + `<sprite>` → `useGLTF` + `<primitive>`; bỏ `POSE_BY_KIND` + 4 texture pose.
- [x] 3. Ép `metalness = 0` / `roughness = 0.85` (glTF mặc định metallic 1.0 → khối đen).
- [x] 4. Chuẩn hoá lúc chạy: đo hộp bao → scale theo `MASCOT_HEIGHT`, chân chạm đất, căn tâm.
- [x] 5. `scripts/shrink-glb-texture.py` — texture 1024 PNG → 512 JPEG, dựng lại buffer:
      2.167 KB → 825 KB. Chụp lại sau khi nén: render y hệt.
- [x] 6. Verify: `tsc --noEmit` sạch · `NEXT_DIST_DIR=.next-verify npm run build` xanh · chụp thật
      3 ga (Trang chủ, Workplace, Thành quả) bằng Playwright + stub `IntersectionObserver`.
- [ ] 7. **Người duyệt**: nhìn light theme; chốt có cần rig để nó bước đi thật không.
