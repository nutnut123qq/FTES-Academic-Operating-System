# Tasks

- [x] 1. Đèn: `ambientLight` + 2 `directionalLight`; khối chặng đổi `meshBasicMaterial` →
      `meshLambertMaterial`; giảm hack tô 2 tông cứng.
- [x] 2. Tông riêng cho từng chặng (hue offset từ `--accent`, kéo về `--node` cho đỡ gắt);
      active = sáng lên thay vì đổi hẳn sang accent.
- [x] 3. Nắn khối: workplace (bàn + màn hình có cổ + bàn phím), practice (tạ có bánh),
      outcome (cúp: nón cụt loe miệng + 2 quai dựng + đế 2 tầng).
- [x] 4. `STATION_SCALE` 1.35 + `cameraOffset` gần lại một nấc + nâng `LABEL_Y`.
- [x] 5. Bóc viền sticker 4 pose → `public/mascot/plain/*.webp`; script để lại ở
      `scripts/strip-mascot-sticker.py` (có bước loang màu ra mép, không thì GPU lọc bilinear
      trộn với vùng đen → viền tối bám quanh nhân vật).
- [x] 6. Mascot chạy trên đường ray tới ga active, đứng LỆCH sang bên ga, đổi pose theo ga,
      bob khi đứng / nảy nhanh khi đi; bóng ellipse dưới chân. Bỏ 4 chấm chạy.
- [x] 7. Verify: `tsc --noEmit` sạch; chụp thật 5 ga bằng Playwright (phải stub
      `IntersectionObserver` — trong headless nó không bắn nên canvas không mount).
- [ ] 8. `npm run build` (webpack).
- [ ] 9. **Người duyệt**: nhìn light theme + chỉnh cường độ đèn / độ gắt màu nếu chưa ưng
      (headless chỉ chụp được dark theme).
