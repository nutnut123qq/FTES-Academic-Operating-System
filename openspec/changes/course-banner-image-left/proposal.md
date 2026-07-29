## Why
Slider banner khóa học (`FeaturedSlide`) đang để ảnh cover bên PHẢI, copy bên TRÁI. Anh muốn ảnh sang TRÁI (rồi tới nội dung), khớp banner FTES legacy.

## What Changes
- `FeaturedSlide`: container `md:flex-row` → `md:flex-row-reverse` → trên desktop ảnh nằm TRÁI, copy nằm PHẢI. Mobile giữ nguyên (flex-col, ảnh ẩn). Không đổi nội dung/hành vi.

## Capabilities
### New Capabilities
- `course-catalog-featured`: bố cục slide banner nổi bật của catalog khóa học.

## Impact
- `src/components/features/course/CourseCatalog/FeaturedSlider/FeaturedSlide/index.tsx` — 1 class + docblock. FE-only, không đổi dữ liệu/i18n.
