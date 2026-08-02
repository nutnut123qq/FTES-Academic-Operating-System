# ai-fab-led-css-mask — Viền LED bằng CSS thật (mask chừa vành), không che mascot

## Why
Bản trước (#105) tô conic-gradient PHỦ TRỌN + mask viết bằng Tailwind arbitrary. Mask arbitrary
không đáng tin → không chừa được giữa → vòng màu đặc **che mất mascot**.

## What Changes
- Chuyển viền LED sang **CSS thật** ở `globals.css` (`.ai-fab-led-ring::before`, mirror
  `.rainbow-border-4side` FTES cũ): conic-gradient nhiều màu + `mask` content-box + `mask-composite:
  exclude` (chừa vành 3px, giữa TRONG SUỐT → không che mascot) + `@property --fab-angle` animate góc
  → màu chạy quanh viền. `ContentAiFab`: `FAB_LED_CLASS = "ai-fab-led-ring"` thay cho Tailwind arbitrary.

## Capabilities
### Modified Capabilities
- `learn-ai-fab`: viền LED chạy bằng CSS thật, giữa trong suốt (mascot hiện).

## Impact
FE-only: `globals.css` (+class/@property/@keyframes) + `ContentAiFab` (1 hằng). vitest pass.
