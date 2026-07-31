# Tasks — ai-fab-bigger-led

## 1. Kích thước + vị trí
- [x] 1.1 Desktop button `right-4`→`right-6`, thêm `!size-14`
- [x] 1.2 Mascot `size-7`→`size-9`

## 2. Viền LED chạy
- [x] 2.1 `FAB_LED_CLASS`: pseudo ::before conic-gradient + mask exclude (vành p-3px) + animate-spin (motion-safe), pointer-events-none
- [x] 2.2 Áp cho cả desktop Button lẫn mobile FloatingActionButton

## 3. Verify
- [x] 3.1 vitest ContentAiFab 9 pass
- [x] 3.2 Type-check + Tailwind JIT qua Vercel build
