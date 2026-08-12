# Tasks

## 1. Đổi script

- [x] 1.1 `scripts.build` → `next build` (turbopack, mặc định Next 16)
- [x] 1.2 Thêm `scripts.build:webpack` → `next build --webpack` (lối thoát cho máy local)
- [x] 1.3 CLAUDE.md mục Build/run: viết lại cho khớp + ghi rõ đừng đổi ngược `build` về webpack

## 2. Verify

- [x] 2.1 Chạy `npm run build` (turbopack) ở local sau khi `rm -rf .next`: **6m01s, exit 0, KHÔNG
      panic** — ghi chú cũ trong CLAUDE.md đã lỗi thời (nhiều khả năng do `next.config.ts` ghim
      `turbopack.root`). Đã sửa lại CLAUDE.md theo số đo thật
- [~] 2.1b **Biên an toàn CHƯA chắc.** 6m01s turbopack so với webpack (riêng compile đã 4,1 phút,
      chưa tính TypeScript + page data) là nhanh hơn nhưng KHÔNG phải một trời một vực. Nếu Vercel
      đang chậm hơn máy dev ~6 lần (7-9 phút local → vượt 45 phút) thì turbopack rơi vào khoảng
      ~36 phút: qua trần, nhưng sát. Cần log Vercel để biết nó CHẬM ĐỀU hay TREO ở một bước
- [ ] 2.2 **Nghiệm thu thật = deploy Vercel xanh.** Không verify được ở local: trần 45 phút là của
      container Vercel, không tái hiện được ở máy dev
- [ ] 2.3 Nếu vẫn vượt 45 phút → đọc log build Vercel tìm bước treo; giả thuyết bundler bị bác,
      quay lại điều tra (nghi kế: OOM trên container 8GB, hoặc một bước network treo)
