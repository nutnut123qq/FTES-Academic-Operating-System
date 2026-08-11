## Why

`sendSessionMessageStream` (`src/modules/api/rest/ai/ai.ts`) đọc SSE của trợ giảng AI và tách event
bằng `buffer.indexOf("\n\n")`. Chuỗi `\r\n\r\n` là `\r \n \r \n` — **không có hai `\n` liền nhau** —
nên `indexOf` trượt sạch: cả stream dồn vào `buffer`, vòng `while` không chạy lần nào, tới cuối rơi
vào `if (buffer.trim()) dispatch(buffer)` xử lý TOÀN BỘ payload như MỘT block. `dispatch` khi đó lấy
`event:` **cuối cùng** và ghép mọi dòng `data:` lại ⇒ mất sạch delta, người dùng thấy panel chat đứng
im rồi nhảy ra một cục vô nghĩa.

Ngay dưới đó là comment `// Events are separated by a blank line.` — đúng ý định, sai cài đặt: spec SSE
(WHATWG) cho phép dòng trống viết bằng CRLF.

**Còn một nửa nữa mà bản vá tương ứng bên Admin không có:** `dispatch` tách dòng bằng `block.split("\n")`
và **KHÔNG strip `\r` cuối dòng**. Nhánh `event:` vô tình thoát nhờ `.trim()`, nhưng nhánh `data:` thì
`dataLines.push(line.slice(5))` giữ nguyên `\r` — nên chỉ vá bộ tách block là chưa đủ: mỗi mảnh delta
sẽ dính một `\r` vào cuối, ghép lại thành văn bản rác.

Hiện CHƯA vỡ ngoài đời vì Spring `SseEmitter` ghi `\n\n`; vỡ khi có proxy/gateway đứng giữa đổi xuống
dòng. Đây là bản sao của lỗi đã vá ở `FTES-AOS-Admin` (`sse-crlf-block-boundary`, commit `5c53b40`).

## What Changes

- **Tách block theo dòng trống, không theo `\n\n` cứng**: `BLOCK_SEPARATOR = /\r?\n\r?\n/`, cắt bằng
  `match.index + match[0].length` — độ dài ranh giới đổi 2↔4 nên KHÔNG hardcode `+2`.
- **`dispatch` strip `\r` cuối mỗi dòng** trước khi đọc `event:`/`data:`, cho khớp đúng tập xuống dòng
  mà `BLOCK_SEPARATOR` nhận.
- Test dựng biến thể CRLF NGAY TRONG test (`replace(/\n/g, "\r\n")`) thay vì thêm fixture trên đĩa —
  fixture dễ bị `core.autocrlf` viết lại nên test sẽ phụ thuộc cấu hình git của máy chạy (bài học từ
  chính change bên Admin).

## Impact

- Affected specs: `rest-ai-stream` (ADDED).
- Affected code: `src/modules/api/rest/ai/ai.ts`, `src/modules/api/rest/ai/ai.test.ts`.
- Không đổi hành vi với stream LF (đường Spring hiện tại) — chỉ thêm khả năng chịu CRLF.

## Non-goals

- Không hỗ trợ `\r` đơn (CR kiểu Mac cổ): không server nào dùng, và hỗ trợ nửa vời ở một bên mà không
  bên kia chính là lỗi đang sửa.
- Không refactor `sendSessionMessageStream` thành các hàm thuần tách rời như bên Admin
  (`parseSseBlock`/`dispatchSseBlock`) — đáng làm nhưng là việc riêng, không nhét vào bản vá lỗi.
