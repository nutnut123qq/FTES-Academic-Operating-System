## 1. Cap chiều cao panel = chiều cao card + ghim mép trên

- [x] 1.1 `position` state thêm trường `maxHeight: number`.
- [x] 1.2 `useLayoutEffect`: đo `rect` wrapper (= card, do card `h-full`); tính
      `maxHeight = min(rect.height, window.innerHeight - 2·VIEWPORT_MARGIN_PX)`.
- [x] 1.3 Đổi `top` từ canh-giữa-tâm-card (`centerY - panelHeight/2`) sang **canh mép TRÊN card**:
      `top = clamp(rect.top, VIEWPORT_MARGIN_PX, innerHeight - height - VIEWPORT_MARGIN_PX)` với
      `height = min(panelRect.height, maxHeight)`. Panel mọc xuống dưới trong phạm vi card.
- [x] 1.4 Mũi tên GIỮ NGUYÊN ý nghĩa (trỏ tâm card): `arrowTop = clamp(centerY - top, margin, height - margin)`.

## 2. Panel flex-col + ghim header/CTA, includes cuộn

- [x] 2.1 Panel container thành `flex flex-col gap-3` (đổi gate hiển thị `…:block` → `…:flex`, giữ
      `hidden` cho touch/coarse), áp `style.maxHeight = position.maxHeight`.
- [x] 2.2 Tách nội dung 3 cụm: **header** (`shrink-0`) · **includes** (`min-h-0 overflow-y-auto`,
      vùng cuộn duy nhất) · **CTA** (`shrink-0`). Header + CTA luôn trong bounds; chỉ includes cuộn.
- [x] 2.3 Nén includes: `includes.slice(0, 4)` + mỗi bullet `line-clamp-2`; tiêu đề khoá `line-clamp-2`.
      Card điển hình vừa khít không cần cuộn; cuộn chỉ là fallback cho card thấp.

## 3. Giữ nguyên phần không đổi

- [x] 3.1 Không đổi vị trí ngang / chọn side / caret; không đổi delay mở-đóng, đóng-khi-scroll, portal.
- [x] 3.2 GIỮ logic CTA đã-tham-gia ↔ đăng-ký (`enrolled-course-continue-cta`) — không revert.
- [x] 3.3 Không đổi i18n, không đụng BE, không đổi `CatalogCourseCard`.

## 4. Verify

- [x] 4.1 `npx tsc --noEmit`: sạch (exit 0, không dòng nào).
- [ ] 4.2 `npm run build` (webpack): xem báo cáo — env build chậm/có thể timeout cục bộ; nếu không
      xong thì dựa vào tsc sạch + CI/Vercel verify.
- [x] 4.3 Không có unit test cho `CourseHoverPreview` (thư mục chỉ có `index.tsx`) → không có test
      để giữ/sửa.
