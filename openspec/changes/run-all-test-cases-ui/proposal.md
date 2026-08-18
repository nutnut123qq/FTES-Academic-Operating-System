# Bảng "Chạy test" hiện đủ mọi test case, che dữ liệu case ẩn

## Why

BE change `run-all-test-cases` cho nút "Chạy test" chạy TOÀN BỘ bộ test của đề thay vì mỗi case mẫu.
Kết quả trả về giờ có cả case ẩn: server đã gỡ `input`/`expected`/`actual`/`stderr` và thay tên bằng
nhãn vị trí, kèm cờ `hidden` trên mọi dòng.

Bảng hiện tại render mọi dòng như nhau, nên ba ô dữ liệu của case ẩn sẽ thành **ô trống**. Ô trống
đọc là "case này không có input" — một sự thật khác hẳn, và là sự thật sai.

## What Changes

- Dòng ẩn: ba ô dữ liệu hiện nhãn **"đã ẩn"** kèm icon khoá, số thứ tự kèm chip *Ẩn*.
- Dòng ẩn vẫn hiện **đạt/trượt + verdict + thời gian** — không có phần đó thì chạy đủ bộ test cũng
  không cho học viên biết gì để sửa.
- Cảnh báo riêng khi bộ test bị **trần cắt** (`truncated`/`omitted`) — khác `aborted` (dừng giữa
  chừng): phần bị bỏ chưa từng được gửi đi chạy.
- Thiếu cờ `hidden` (backend cũ) ⇒ đọc như case mẫu, không che nhầm.

## Impact

- Affected specs: `challenge-submission`
- Affected code: `ChallengeView/GradeCodePanel/ExecutionResultTable.tsx`, `modules/api/rest/ai/types.ts`,
  `messages/{vi,en}.json`
