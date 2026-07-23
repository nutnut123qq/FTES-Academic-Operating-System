## Why

Trang blog: card bài viết (`PostRow`) hiện text-only. `BlogPostSummary.thumbnailUrl` đã có sẵn (BE trả)
nhưng không render → danh sách khô. Thêm ảnh bìa cho đẹp + dễ quét như FeaturedPost đã có.

## What Changes

- `PostRow`: bố cục ngang — text (flex-1) bên trái + thumbnail 16:9 (`CoverImage`, primitive nhà) bên
  phải khi có `thumbnailUrl`; không có ảnh → fallback text-only. Ảnh decorative (`alt=""`, title là link text).

## Impact

- `components/layouts/blog/shared/PostRow/index.tsx`. Không đổi API/query/type (`thumbnailUrl` đã có).
