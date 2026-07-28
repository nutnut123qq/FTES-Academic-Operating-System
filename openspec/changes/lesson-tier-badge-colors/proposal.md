# lesson-tier-badge-colors — chip gói khoá đổi màu theo gói, cố định toàn hệ

## Why
Góp ý website 2026-07-26: *"Nên để các phần màu của những thông tin này khác nhau để phân
biệt các gói khóa học"*. Hàng chip trong syllabus render cứng `color="accent"` cho MỌI gói →
BASIC, PREMIUM, MASTER và cả gói tên tự do ra cùng một sắc hồng, khác nhau mỗi chữ.

## What Changes
- `tierLabels.ts` thêm `TIER_CHIP_COLOR` + `resolveTierColor(slug)`: màu khoá theo **slug**,
  cố định toàn hệ — cùng một gói ra cùng một màu ở mọi khoá (chủ box chốt hướng này thay vì
  đổ màu theo thứ hạng trong từng khoá, tránh "PREMIUM xám ở khoá A, vàng ở khoá B").
- Thang một chiều rẻ → đắt để màu nói được THỨ BẬC, không chỉ "khác nhau":
  `free → default` · `basic → success` · `premium → accent` · `master → warning`.
  `danger` giữ nguyên nghĩa phá huỷ, không dùng cho tier. Gói tên tự do → `default`.
- Áp ở cả 2 surface đang render chip gói: syllabus `CourseDetail` và CTA nâng cấp
  `ChallengeSubmission`.

## Out of scope
- Không đổi thứ tự chip (đã sort rẻ→đắt sẵn) và không đổi nhãn (`resolveTierLabel` giữ nguyên).
- Không thêm trường màu ở BE — bảng màu là quy ước FE.
