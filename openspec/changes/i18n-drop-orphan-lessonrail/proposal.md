## Why

`src/messages/vi.json` và `en.json` có HAI khối tên `lessonRail` ở hai nhánh khác nhau:

- `learn.lessonRail` — khối THẬT. `OnThisPage` gọi `useTranslations("learn")` rồi
  `t("lessonRail.challenges.title")`, nên nó đọc nhánh này.
- `lessonRail` ở CẤP GỐC — **mồ côi**. Grep cả `src/` chỉ có 3 chỗ nhắc `lessonRail`, đều trong
  `OnThisPage/index.tsx` và đều đi qua namespace `learn`. Không nơi nào gọi
  `useTranslations("lessonRail")`. Hai worktree đang mở của session khác cũng chỉ dùng nhánh `learn`.

Hai khối trùng tên khác nhánh là bẫy sửa nhầm chỗ: người sửa nhãn mở đúng chuỗi cần tìm, sửa
khối gốc, build xanh, chạy lên không thấy đổi gì.

Nó cũng là toàn bộ chênh lệch key vi/en của repo: đo trước khi xoá được **đúng 1 key lệch**
(`lessonRail.documents.title` có ở vi, không có ở en) — và key đó nằm trong chính khối mồ côi.

## What Changes

- Xoá khối `lessonRail` ở cấp gốc trong `vi.json` (7 key) và `en.json` (6 key).
- Không đụng `learn.lessonRail` và không đụng `OnThisPage`.

## Impact

- Affected specs: không có (dọn dữ liệu i18n chết, không đổi hành vi).
- Affected code: `src/messages/vi.json`, `src/messages/en.json`.
- Đo sau khi xoá: vi 5822 key = en 5822 key, **0 key lệch hai chiều**; JSON parse sạch; chuỗi
  tiếng Việt còn nguyên dấu (không mojibake). `npx tsc --noEmit` exit 0.
