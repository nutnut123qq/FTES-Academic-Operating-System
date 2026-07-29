# course-hover-preview-height — thẻ hover-preview phải NGANG chiều cao với card khoá học, không tràn cao hơn

## Why

Thẻ hover-preview của khoá học (`CourseHoverPreview`, hiện khi rê chuột lên card trong các shelf/lưới
duyệt khoá) đang **CAO HƠN** chính card mà nó bật ra cạnh — nó tràn cả lên trên lẫn xuống dưới mép
card. Nguyên nhân:

- Panel để chiều cao **tự do theo nội dung** (tiêu đề + chip + dòng "cập nhật" + meta + TOÀN BỘ danh
  sách "Khoá học này bao gồm" + 2 nút CTA). Danh sách includes không giới hạn số dòng → panel dài ra.
- Khi định vị (`useLayoutEffect`), panel được **canh GIỮA theo tâm card** (`centerY - panelHeight/2`).
  Panel cao hơn card → nửa trên trồi lên trên đỉnh card, nửa dưới thò xuống dưới đáy card.

Thầy: *"Hãy sửa UI cái modal bật lên phải ngang với khóa học chứ lớn hơn r"* — panel phải đọc như
**cùng chiều cao** với card, KHÔNG vượt quá mép trên/dưới của card.

## What Changes

- **Giới hạn chiều cao panel = chiều cao card + ghim mép TRÊN của panel vào mép trên card.** Trong
  `useLayoutEffect`, đo `rect` của wrapper (chính là card, vì card `h-full` trong wrapper) → đặt
  `maxHeight = min(cardHeight, viewport - 2·margin)` cho panel (áp qua inline `style.maxHeight`), và
  đổi `top` từ **canh giữa** sang **canh mép trên card** (`top = clamp(rect.top, …)`). Panel giờ mọc
  **xuống dưới** trong phạm vi chiều cao card thay vì trôi lên trên. Mũi tên (caret) GIỮ NGUYÊN — vẫn
  trỏ vào tâm card (`arrowTop = centerY - top`, clamp trong chiều cao panel).
- **Nén nội dung để vừa chiều cao đó + ghim header/CTA, chỉ cho danh sách includes cuộn:**
  - Panel thành `flex flex-col` (giữ nguyên cổng chỉ-desktop: `[@media(hover:hover)_and_(pointer:fine)]:flex`).
  - **Header** (tiêu đề `line-clamp-2`, chip, dòng cập nhật, meta) = `shrink-0` → luôn ghim ở đỉnh.
  - **Includes** = vùng cuộn DUY NHẤT (`min-h-0 … overflow-y-auto`), **cắt còn tối đa 4 bullet**
    (`slice(0,4)`) + mỗi bullet `line-clamp-2` → card điển hình vừa khít KHÔNG cần cuộn; card thấp thì
    chỉ vùng includes cuộn, header/CTA không xê dịch.
  - **CTA** (nút chính Đăng ký/Tiếp tục học + Lưu + Thêm vào giỏ) = `shrink-0` → LUÔN nằm trong phạm
    vi chiều cao card, không bị đẩy ra ngoài.
  - Nén khoảng cách theo thang nhà (2·3·4): header/CTA gom nhóm `gap-2`, giữ `gap-3` giữa các cụm.
- **Responsive, không hardcode px:** chiều cao dẫn xuất TỪ card đo được (`rect.height`), nên đúng cho
  mọi cỡ card (shelf `w-60/sm:w-64`, lưới category, lưới catalog) và mọi breakpoint.

## Impact

- Affected specs: `course-catalog-browse` (ADDED).
- Affected code: `components/features/course/browse/CourseHoverPreview/index.tsx`
  (state `position` thêm `maxHeight`; `useLayoutEffect` canh mép-trên + cap chiều cao; panel thành
  `flex flex-col` + `style.maxHeight`; tách 3 cụm header(ghim)/includes(cuộn, cap 4)/CTA(ghim)).
  Không đổi i18n, không đụng BE, không đổi vị trí ngang / mũi tên.
- **GIỮ NGUYÊN** logic CTA đã-tham-gia ↔ đăng-ký (từ `enrolled-course-continue-cta`): nhánh
  `isEnrolled` → "Tiếp tục học" `/courses/{slug}/learn`, còn lại → "Đăng ký khóa học"
  `/courses/{slug}` — KHÔNG revert.

## Non-goals

- Không đổi vị trí NGANG / cách chọn side (phải/trái) / mũi tên caret — chỉ sửa chiều DỌC.
- Không đổi hành vi mở/đóng (delay, đóng khi scroll/resize) hay portal.
- Không thêm/đổi i18n, không đụng BE, không đổi `CatalogCourseCard`.
