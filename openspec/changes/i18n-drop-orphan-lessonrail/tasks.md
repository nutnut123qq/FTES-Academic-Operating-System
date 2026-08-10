## 1. Đo trước khi xoá

- [x] 1.1 Grep toàn `src/` xác nhận không ai gọi `useTranslations("lessonRail")` (0 hit).
- [x] 1.2 Xác nhận `OnThisPage` dùng namespace `learn` → đọc `learn.lessonRail`.
- [x] 1.3 Kiểm 2 worktree đang mở của session khác: cũng chỉ dùng nhánh `learn`.

## 2. Xoá

- [x] 2.1 Xoá khối `lessonRail` cấp gốc trong `vi.json`.
- [x] 2.2 Xoá khối `lessonRail` cấp gốc trong `en.json`.

## 3. Verify

- [x] 3.1 Parity key vi/en: 5822 = 5822, lệch 0 key cả hai chiều.
- [x] 3.2 JSON parse sạch, chuỗi tiếng Việt còn dấu.
- [x] 3.3 `npx tsc --noEmit` exit 0.
