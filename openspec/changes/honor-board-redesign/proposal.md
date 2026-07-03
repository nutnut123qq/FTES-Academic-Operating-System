# Proposal — honor-board-redesign

## Why

Bảng vàng FTES hiện tại xấu và rối: mỗi achiever là một poster CDN có tên/laurel/confetti
"nướng" sẵn trong ảnh (mỗi ảnh một font, không đồng nhất, không responsive, không crawlable
đúng nghĩa), gold tràn lan mất điểm nhấn, 3 card đều nhau không có thứ bậc, bullet sao lặp
lại đơn điệu, chip highlight mỗi card một kiểu. User đã chốt hướng qua brainstorm 2026-07-03:
**Podium + Grid** kết hợp **Dark Glassmorphism + Gold Glow** — tách text khỏi ảnh, gold chỉ
làm accent, hierarchy rõ.

## What Changes

- **`Achiever` model (content.ts):** thêm `featured?: boolean` — 3 người đầu (Kim Khoa,
  Hoàng Blue, Hoàng Duy) lên hàng podium; 3 người còn lại xuống grid gọn.
- **`HonorBoardSection`:** dựng lại toàn bộ.
  - Hàng podium: 3 card lớn (2-1-3, card giữa nhô cao ở `lg`), ảnh chân dung tròn trong
    vòng gold, tên = HTML text gradient gold metallic, hero metric (highlight) cỡ lớn có
    count-up phần số khi vào viewport, tối đa 3 dòng thành tích (bỏ icon sao lặp).
  - Grid: card ngang gọn (ảnh nhỏ + tên + highlight chip + 1 dòng đầu).
  - Chất liệu: card glass (`bg-surface/60 backdrop-blur`) trên nền ambient gold orbs
    (radial `var(--warning)` alpha thấp, `blur-3xl`), viền `border-separator`, hover
    lift + glow gold. Token `warning` = gold (theme-aware, chạy cả light/dark).
  - Ảnh: crop tròn vùng mặt từ poster hiện có (`object-cover` + object-position trên);
    lỗi ảnh → fallback initials trong vòng gold. Khi có ảnh chân dung sạch chỉ cần thay URL.
- Không key i18n mới, không route mới, không block mới (landing = one-off composition
  trong feature, theo tiền lệ home-landing 2026-07-02).

## Capabilities

### Modified Capabilities

- `home-landing`: requirement "Bảng vàng FTES honor section" — trình bày phân bậc
  podium + grid, tên/thành tích là DOM text (không phụ thuộc chữ trong ảnh), fallback
  ảnh giữ nguyên hành vi, vẫn ẩn section khi rỗng và link `/leaderboard`.

## Impact

- FE-only, 2 file source (`content.ts`, `HonorBoardSection.tsx`). Không đổi BE, không
  đổi i18n, không thêm dependency.
