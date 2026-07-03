# Tasks — honor-board-redesign

## 1. Data

- [x] 1.1 `content.ts`: thêm `featured?: boolean` vào `Achiever`, bật cho kimKhoa /
      hoangBlue / hoangDuy; comment đường thay ảnh chân dung sạch.

## 2. Section

- [x] 2.1 `HonorBoardSection`: nền ambient gold orbs + header như cũ; hàng podium
      (2-1-3, giữa nhô cao) card glass lớn: portrait ring → tên gradient gold →
      hero metric count-up → ≤3 dòng thành tích; grid card ngang gọn cho phần còn lại.
- [x] 2.2 Micro-interaction: hover lift + gold glow; count-up IntersectionObserver
      một lần, tôn trọng `prefers-reduced-motion`.
- [x] 2.3 Fallback ảnh: initials tile trong vòng gold, không vỡ layout.

## 3. Verify

- [x] 3.1 `tsc --noEmit` sạch + eslint file đã chạm.
- [x] 3.2 `npm run build` (webpack) xanh.
- [x] 3.3 Preview: screenshot section light + dark, desktop + mobile.

## 4. Journals

- [x] 4.1 Ghi decision vào `design/home-landing.md` + lesson vào `design/CONTENT.md`.
