# Tasks — ai-sse-crlf-block-boundary

## 1. Vá hai nửa

- [x] 1.1 `SSE_BLOCK_SEPARATOR = /\r?\n\r?\n/`; vòng tách dùng `exec` + `sep.index + sep[0].length`
      (độ dài ranh giới đổi 2↔4 nên KHÔNG hardcode `+2`).
- [x] 1.2 `dispatch` strip `\r` cuối mỗi dòng trước khi đọc `event:`/`data:`.
      Nhánh `event:` vốn thoát nhờ `.trim()`, nhưng `data:` thì `line.slice(5)` giữ nguyên `\r`.

## 2. Test

- [x] 2.1 Stream LF: hai delta về riêng, `done` parse đúng.
- [x] 2.2 Stream CRLF: ra đúng cùng kết quả, không `\r` lọt vào nội dung.
- [x] 2.3 Ranh giới bị cắt ngang giữa hai lần đọc (chunk 1 byte, xé cả ký tự tiếng Việt UTF-8):
      event vẫn phát ĐÚNG MỘT lần.
- [x] 2.4 Block có NHIỀU dòng `data:`, cả LF lẫn CRLF.

## 3. Mutation check — và một bài học

- [x] 3.1 Đổi separator về `/\n\n/` ⇒ test CRLF đỏ (`expected [] to have a length of 2`).
- [x] 3.2 Bỏ strip `\r` ⇒ **lượt đầu KHÔNG đỏ**. Bộ tách block nuốt luôn `\r` đứng ngay trước ranh
      giới, nên block chỉ có MỘT dòng `data:` thì dòng đó vốn đã sạch — test 2.1/2.2/2.3 không hề
      chạm tới việc strip. Phải thêm 2.4 (nhiều dòng `data:`) thì gỡ strip mới đỏ đúng chỗ
      (`expected [ 'dòng 1\r\ndòng 2' ] to deeply equal [ 'dòng 1\ndòng 2' ]`).
      ⇒ Nếu bỏ qua mutation check thì đã ship một nửa bản vá không có gì bảo vệ.

## 4. Nghiệm thu

- [x] 4.1 `npx tsc --noEmit` sạch.
- [x] 4.2 `npm run build` xanh (webpack — KHÔNG turbopack, xem CLAUDE.md).
- [x] 4.3 `npx vitest run` xanh toàn bộ — 129 file, 837 test.
- [ ] 4.4 E2E: chưa chạy. Đường Spring hiện ghi `\n\n` nên bản vá không đổi hành vi thấy được —
      chỉ vỡ khi có proxy đổi xuống dòng, mà môi trường hiện tại không có. Không dựng được ca thử
      thật nếu không tự chế một proxy viết lại CRLF.
