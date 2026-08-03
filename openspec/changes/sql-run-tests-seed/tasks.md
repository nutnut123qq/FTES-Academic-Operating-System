# Tasks — sql-run-tests-seed

## 1. Wiring

- [x] 1.1 `RunTestsRequest` thêm `setupSql?: string` + ghi rõ ý nghĩa `input` khác nhau giữa bài
      code (stdin) và bài SQL (SQL phụ của case).
- [x] 1.2 `onRunTests` gửi kèm `setupSql` khi `isSqlLanguage` — cùng giá trị nút Run đang truyền
      cho `/execute-sql`.

## 2. Verify

- [x] 2.1 `npx tsc --noEmit` sạch.
- [ ] 2.2 `npm run build` (webpack) — CHƯA chạy được: trên box này `next.config.ts` không nạp
      được vì thiếu native binary `@parcel/watcher-linux-x64-glibc`. Hỏng do môi trường, không
      liên quan thay đổi này (FE vốn chỉ chạy ở máy local). Phải chạy lại ở máy local trước commit.
- [ ] 2.3 Bấm thử "Chạy test" trên bài `019fc1c9-…` (DBI202 SQL Server) sau khi BE + ai-service
      lên apitest: sample case Accepted, bảng kết quả hiện đủ cột.

## 3. Hiện lý do case chết (phát sinh khi nghiệm thu)

- [x] 3.1 `ExecutionResultTable` render `result.stderr` dưới ô Actual. Trước đó bảng bỏ đi hoàn
      toàn: một case `Runtime Error` chỉ còn Actual trống, người học không có gì để sửa — chính
      chỗ này làm ca "Invalid object name 'sinh_vien'." trông như lỗi bí ẩn.
- [x] 3.2 `ExecutionCaseResult` thêm `stderr?: string` (sandbox vốn vẫn trả, chỉ thiếu ở type).
