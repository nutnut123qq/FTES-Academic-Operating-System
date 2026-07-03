# Proposal — offers-policy-3d-showcase

## Why

Section "Ưu đãi & chính sách" (`OffersPolicySection`) hiện là tab rail trái + **card
phẳng** phải — trơ so với phần còn lại của landing (hero 3D, honor board). starci-academy
xử lý đúng bài toán này trong `LearnLoopScroll`: panel phải được bọc trong **`ShowcaseMockup`**
(khung "cửa sổ trình duyệt" 3 chấm + address bar + tilt 3D + glow), đọc như ảnh chụp sản
phẩm thật. User chốt 2026-07-03: làm section ưu đãi "3D" tương tự.

Điểm quan trọng: **FTES đã có sẵn block `ShowcaseMockup`** (`blocks/marketing/ShowcaseMockup`,
API y hệt starci) — dùng thẳng, KHÔNG viết 3D mới, KHÔNG thêm dependency.

## What Changes

- **`OffersPolicySection`:** bọc CỘT panel phải (khối chứa 8 tabpanel) vào `ShowcaseMockup`
  (`tilt="left"`, `backdrop="glow"`, `theme={SHOWCASE_THEMES.accent}`, address bar tĩnh
  vd `ftes.edu.vn/uu-dai`). Bỏ `rounded-2xl border bg-surface p-6` hand-rolled ở mỗi
  panel (khung + surface giờ do chrome của mockup lo); nội dung panel giữ nguyên.
- **Giữ SEO invariant:** cả 8 panel VẪN mounted, panel inactive chỉ `hidden` (không
  unmount) — bọc CẢ cột vào 1 mockup, KHÔNG bọc từng panel riêng. Tất cả copy ưu đãi
  vẫn nằm trong HTML server-render (crawlable).
- **Tab rail trái + CTA "Browse courses" giữ nguyên** (khớp bố cục ảnh tham chiếu:
  rail phẳng bên trái, mockup 3D bên phải, CTA dưới).
- **KHÔNG** dùng `aspect="video"` (nội dung ưu đãi cao thấp khác nhau — honor 4 dòng);
  để mockup co theo nội dung, padding qua `contentClassName`.
- Không đổi data (`OFFER_GROUPS`), i18n, hay route.

## Capabilities

### Modified Capabilities

- `home-landing`: requirement "Ưu đãi và chính sách section" — panel chi tiết ưu đãi
  SHALL render bên trong khung showcase 3D (chrome + tilt + glow) đồng bộ hero look,
  trong khi VẪN giữ mọi copy ưu đãi trong DOM server-render (panel inactive hidden,
  không unmount). Nội dung/nhóm/thứ tự không đổi.

## Impact

- FE-only. 1 file sửa (`OffersPolicySection.tsx`) + journal. Reuse block có sẵn
  (`ShowcaseMockup`) — không file mới, không BE, không deps.
