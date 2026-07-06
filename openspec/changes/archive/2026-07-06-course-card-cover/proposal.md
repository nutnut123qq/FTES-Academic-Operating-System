# Proposal — course-card-cover

## Why

Checklist STT 25: ảnh bìa course cần hiện rõ ràng / đầy đủ hơn, học theo card của
StarCI (ảnh mẫu image49/image34 — cover lớn, full-bleed, sắc nét). Card hiện đã đúng
khung 16:9 full-bleed object-cover (đúng pattern StarCI) NHƯNG cover mock lấy từ picsum
ở độ phân giải thấp (480×270 cho catalog, 1200×500 cho featured) → nhìn mờ; và
`CourseCard` (GraphQL block) thiếu hover-zoom mà `CatalogCourseCard` đã có.

## What Changes

- **Cover mock resolution:** picsum catalog `480×270 → 960×540`, featured
  `1200×500 → 1600×668` → cover sắc nét trên màn retina, "rõ ràng" như card StarCI.
- **`CourseCard` (block):** thêm hover-zoom cover (`group` + `group-hover:scale-105`,
  `transition-transform`) đồng bộ polish với `CatalogCourseCard`.
- Giữ nguyên khung 16:9 full-bleed + fallback gradient (đã on-pattern). Cover branded
  per-course (như fullstack-mastery.png) cần cover-data BE thật → ngoài phạm vi FE mock,
  ghi làm giả định follow-up.

## Capabilities

### Modified Capabilities

- `course-catalog`: ảnh bìa course hiển thị sắc nét + hover-zoom nhất quán giữa hai
  loại card (catalog & featured).

## Impact

- FE-only. 3 file (`useQueryCoursesSwr`, `useQueryFeaturedCoursesSwr`, `CourseCard`).
  Không BE, không i18n, không dependency.
