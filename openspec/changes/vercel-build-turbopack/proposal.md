# Lệnh build của deploy trả về Turbopack (webpack thành lối thoát cho máy Windows)

## Why

Production đang kẹt ở một bản build cũ: deployment mới nhất (commit `d37a328`, merge PR #157
`feat/exam-viewer-revamp`) **Build Failed — "did not complete within the maximum of 45min"**, chạy
45m38s rồi bị cắt. Mọi commit đẩy lên `master` từ đó tới nay, kể cả change
`mascot-assistant-floating-hub`, đều không ra được production.

Script build đang là `next build --webpack`. Cờ `--webpack` được thêm vì lý do **máy local**:
turbopack build từng panic trong env này (Windows + đường dẫn có dấu cách) — ghi trong CLAUDE.md.
Nhưng script đó cũng chính là lệnh **Vercel** chạy, mà Vercel là Linux, không dính bug kia; nó chỉ
lãnh nguyên phần chậm của webpack. Next 16 mặc định build bằng Turbopack — quan sát được ngay
trong log của repo: `next dev` in `▲ Next.js 16.1.6 (Turbopack)`, còn `npm run build` in
`▲ Next.js 16.1.6 (webpack)` vì cờ. Một lần build webpack ở máy dev mất 4,1 phút chỉ riêng khâu
compile; trên container build 2 nhân của Vercel thì con số đó nở ra tới trần 45 phút.

## What Changes

- `scripts.build` → `next build` (Turbopack, mặc định Next 16) — đây là lệnh Vercel chạy.
- Thêm `scripts.build:webpack` → `next build --webpack`, giữ nguyên lối cũ cho máy local nếu
  turbopack còn panic ở đó.
- CLAUDE.md: đổi mục Build/run cho khớp, ghi rõ **đừng đổi ngược `build` về webpack** vì Vercel cần
  turbopack, và nếu máy local panic thì verify bằng `build:webpack`.

## Impact

- Affected specs: `web-build-pipeline` (ADDED)
- Affected code: `package.json` (scripts), `CLAUDE.md`
- **Đây là một GIẢ THUYẾT, chỉ deploy mới nghiệm thu được.** Nếu build vẫn vượt 45 phút thì nguyên
  nhân không nằm ở bundler (nghi tiếp: một bước treo cụ thể trong log build, hoặc OOM), và phải đọc
  log Vercel để trị đúng chỗ — đổi bundler không cứu.
- Không đổi hành vi runtime của ứng dụng: cùng một Next.js, chỉ khác bundler dựng bundle.
