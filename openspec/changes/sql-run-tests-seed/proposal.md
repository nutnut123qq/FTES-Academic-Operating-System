# Nút "Chạy test" bài SQL gửi kèm dữ liệu mẫu của bài

## Why

Với bài có sample test-case, panel ẩn nút "Run" và chỉ để lại "Chạy test" — nên đó là hành động
DUY NHẤT của người học. Bài SQL bấm vào thì nhận `502 Bad Gateway`.

Nguyên nhân nằm ở hai đầu, phần thuộc FE là: `onRunTests` gửi `{code, language, testCases}` và
**không gửi `setupSql`**, dù chính panel này đã có sẵn giá trị đó (nút Run thường vẫn truyền
`setup_sql` cho `/execute-sql`). Không có seed thì câu truy vấn chạy trên một cơ sở dữ liệu rỗng →
mọi case đều trượt, kể cả bài làm đúng.

## What Changes

- `RunTestsRequest` thêm `setupSql?: string`.
- `onRunTests` gửi kèm `setupSql` khi ngôn ngữ là SQL — cùng giá trị nút Run đang truyền.
- Ghi rõ trong type: với bài SQL, `testCases[].input` KHÔNG phải stdin mà là SQL phụ dựng biến thể
  dữ liệu của từng case (SQL không có stdin) — chỗ này rất dễ hiểu nhầm khi đọc contract.

Phụ thuộc BE (đã làm cùng đợt, change `code-run-tests-sql`): endpoint nhận `setupSql` và chuyển
tiếp; bài SQL chạy trên SQL sandbox; sandbox tắt → `AI_SQL_UNAVAILABLE` (panel đã có thông điệp
riêng cho mã này).

## Non-goals

- KHÔNG đổi luật hiện nút: bài có sample test-case vẫn ẩn "Run". Nếu sau này muốn bài SQL có cả
  hai nút thì mở change riêng.
