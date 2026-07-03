# Design — honor-board-redesign

## Hướng đã chốt (brainstorm 2026-07-03)

B (Podium + Grid) + C (Dark Glassmorphism + Gold Glow), quy tắc A (gold là accent).
Nguồn tinh túy web: gold dùng ít mới sang (joekotlan.com), 1 card = 1 focal point +
tiering (halloffamewall.com, digitalwalloffame.com), glass + cursor-glow (dark
glassmorphism 2026), metallic text bằng CSS gradient (speckyboy.com).

## Quyết định kỹ thuật

- **Không block mới** — landing là one-off composition trong feature (tiền lệ
  `design/home-landing.md` 2026-07-02). Sub-components colocate trong file section.
- **Gold = token `warning`** (OKLCH, theme-aware). Gradient metallic/ambient orbs dùng
  `var(--warning)` + `color-mix(... transparent)` trong `style={{}}` (canon 7.3 kênh
  programmatic); tuyệt đối không hex.
- **Tên gradient:** `bg-clip-text text-transparent` + linear-gradient từ
  `color-mix(warning, foreground)` → warning → nhạt — text thật, crawlable, đổi theme sống.
- **Count-up:** parse phần số đầu tiên trong `highlight` ("GPA 9.4" → 9.4, "TOP 100 · 3 kỳ"
  → 100); IntersectionObserver bắn 1 lần + rAF ~900ms; `prefers-reduced-motion` → hiện
  thẳng số cuối. Không lib.
- **Podium order 2-1-3** bằng `lg:order-*`, card giữa `lg:-translate-y-4`. Mobile: dọc
  theo thứ tự data.
- **Ảnh:** poster cũ có chữ nướng sẵn → crop tròn vùng mặt (`aspect-square rounded-full
  object-cover object-[50%_18%]`) để né chữ; `onError` → initials tile. `ponytail:`
  comment trong content.ts đánh dấu chỗ thay URL chân dung sạch.
- **Glass:** `bg-surface/60 backdrop-blur-md`; glow hover = `box-shadow` màu
  `color-mix(var(--warning) ~35%, transparent)` (div thường, không đụng luật no-shadow
  của HeroUI `.card`). Ambient orbs = div `pointer-events-none absolute blur-3xl`
  trong section `relative overflow-hidden`, `aria-hidden`.
- **A11y/SEO:** tên + mọi dòng thành tích là DOM text; ảnh `alt` = tên; orbs decorative.
