# ai-fab-fixed-not-relative — Sửa nút trợ lý AI biến mất (relative đè fixed)

## Why
Sau khi thêm viền LED (#101), `FAB_LED_CLASS` mở đầu bằng `relative` (để neo pseudo). Nhưng nút
vốn đã `fixed`; Tailwind sinh `.relative` SAU `.fixed` nên `relative` ĐÈ `fixed` → nút rời khỏi
góc phải-dưới = "biến mất".

## What Changes
- Bỏ `relative` khỏi `FAB_LED_CLASS`. Nút `fixed` (desktop) / FloatingActionButton `fixed` (mobile)
  đã là positioning-context cho `::before absolute` — không cần `relative`.

## Capabilities
### Modified Capabilities
- `learn-ai-fab`: nút trợ lý AI trở lại `fixed` góc phải-dưới + vẫn có viền LED.

## Impact
FE-only, 1 dòng. vitest ContentAiFab pass.
