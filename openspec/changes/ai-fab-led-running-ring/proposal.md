# ai-fab-led-running-ring — Viền LED CHẠY quanh viền (không phải vệt quét)

## Why
Viền LED nút AI (#101) dùng conic-gradient "transparent + 1 vệt accent" → khi quay trông như
MỘT VỆT SÁNG QUÉT, không phải đèn LED chạy quanh viền. Thầy muốn giống nút hỏi-đáp AI FTES cũ
(`.rainbow-border-4side`) — vòng NHIỀU MÀU phủ trọn vòng, quay → màu chạy quanh viền.

## What Changes
- `FAB_LED_CLASS`: conic-gradient đổi từ "transparent + 1 arc accent" → **vòng nhiều màu phủ trọn**
  (palette rainbow như FTES cũ: `#ff6b6b,#ffd93d,#6bcb77,#4d96ff,#9b59b6,#ff6b9d`), tốc độ 2s→3s
  cho êm. Mask/pointer-events/motion-safe giữ nguyên.

## Capabilities
### Modified Capabilities
- `learn-ai-fab`: viền là vòng LED nhiều màu chạy quanh, không phải vệt quét.

## Impact
FE-only, 1 dòng gradient + 1 tốc độ. vitest ContentAiFab pass.
