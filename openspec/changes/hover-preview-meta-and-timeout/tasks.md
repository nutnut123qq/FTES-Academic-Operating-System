## 1. Bỏ cấp độ hiển thị 2 lần + số bài học ngang hàng cấp độ

- [x] 1.1 Bỏ chip cấp độ ĐỨNG RIÊNG (`<Chip color="accent">{levels.*}</Chip>`) trong header panel.
- [x] 1.2 Hàng chip trong header chỉ render khi CÓ badge (Bán chạy / Mới); không badge thì không render
      hàng rỗng.
- [x] 1.3 Giữ dòng meta là nơi DUY NHẤT hiện cấp độ, ngay dưới tiêu đề, dạng "{cấp độ} · {N} bài"
      (cấp độ + số bài học trên MỘT hàng) — thoả "đưa số lesson lên ngang với tag Intermediate".

## 2. Thêm 1 hàng chi tiết khoá (ghim trong header, không cuộn)

- [x] 2.1 Thêm hàng: `Course.rating`/`Course.enrollmentCount` có → "⭐ {rating} · {N} học viên"
      (StarIcon warning + `rating.toFixed(1)`; UsersIcon + `t("courses.learners", {count})`), mirror
      `CatalogCourseCard`.
- [x] 2.2 Fallback khi không có rating/learners → một dòng mô tả `line-clamp-1` từ `detail.description`
      (detail đã tải lười), nếu cũng không có thì không render hàng.
- [x] 2.3 Hàng chi tiết đặt trong cụm **header** `shrink-0` (ghim), KHÔNG vào vùng includes cuộn →
      không phá cap chiều cao panel.

## 3. Panel chỉ đóng khi con trỏ rời cả card lẫn panel

- [x] 3.1 Guard bộ lắng nghe `scroll` (capture): bỏ qua sự kiện có `event.target` nằm TRONG panel
      (`panelRef.current?.contains(target)`) → cuộn danh sách includes trong panel không đóng panel;
      scroll trang/khối cha vẫn đóng. `resize` vẫn luôn đóng.
- [x] 3.2 Tăng thời gian ân hạn khi rời `CLOSE_DELAY_MS` 100 → 150ms (đủ đi card↔panel), giữ cơ chế
      vào-lại (card HOẶC panel) HUỶ close đang chờ → không đóng khi con trỏ còn trên card/panel.
- [x] 3.3 Xác nhận KHÔNG có timer "hiện N ms rồi ẩn": chỉ có `openTimer` (mở sau 300ms) và `closeTimer`
      (đóng sau khi rời). Cập nhật chú thích cho rõ open không bị time-box.

## 4. Giữ nguyên phần không đổi

- [x] 4.1 Không đổi vị trí ngang / side / caret / delay mở / portal / cap chiều cao panel
      (`course-hover-preview-height`).
- [x] 4.2 GIỮ nhánh CTA đã-tham-gia ↔ đăng-ký (`enrolled-course-continue-cta`).
- [x] 4.3 Không thêm i18n mới, không đụng BE, không đổi `CatalogCourseCard`.

## 5. Verify

- [x] 5.1 `npx tsc --noEmit`: sạch (exit 0).
- [x] 5.2 Unit test mới `hover-open-close.test.tsx` (4 test): mở sau delay · giữ hover thì KHÔNG tự tắt
      (advance 30s vẫn mở) · rời rồi qua grace mới đóng · vào lại trong grace huỷ close. Tất cả xanh.
      Các test khác của course browse không đổi (không có test cũ cho `CourseHoverPreview`).
- [ ] 5.3 `npm run build` (webpack): xem báo cáo verbatim — env build chậm/có thể không xong cục bộ;
      nếu không xong thì dựa vào tsc sạch + test xanh, CI/Vercel verify.
