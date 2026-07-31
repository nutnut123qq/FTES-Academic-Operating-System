# ai-fab-bigger-led — Nút trợ lý AI to hơn, dịch trái, viền LED chạy

## Why
Nút FAB trợ lý AI (`ContentAiFab`, mặt cáo FrosTES) đang nhỏ + sát rìa phải (`right-4`),
mascot `size-7`. Thầy muốn to hơn chút, dịch trái tí, và thêm viền LED "chạy chạy".

## What Changes
- **Desktop button**: `right-4`→`right-6` (dịch trái ~8px), thêm `!size-14` (to hơn ~40→56px);
  mascot `size-7`→`size-9`.
- **Viền LED chạy** (`FAB_LED_CLASS`, áp cho cả desktop + mobile FAB): pseudo `::before`
  full-size tô `conic-gradient` (vệt accent) + MASK content-box exclude để chỉ chừa vành
  `p-[3px]` (giữa trong suốt, không che mascot) + `motion-safe:animate-spin` cho vệt sáng quay
  quanh mép. `pointer-events-none` (không chặn click), tôn trọng reduced-motion.

## Capabilities
### Modified Capabilities
- `learn-ai-fab`: nút trợ lý AI to hơn, cách rìa phải hơn, có viền LED động.

## Impact
FE-only, 1 file `ContentAiFab/index.tsx`. Không đổi hành vi drag/popover/drawer. vitest 9 pass.
