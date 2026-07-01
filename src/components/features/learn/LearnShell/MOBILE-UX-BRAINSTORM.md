# Mobile UX — lesson reader 4-part layout → mobile (2026-06-21)

Trang: `/courses/[id]/learn/modules/[mid]/contents/[cid]` (LearnShell + LessonReader).
Câu hỏi: **layout 4 phần desktop → mobile thế nào?**

## 4 phần desktop
① `LearnSidebar` (nav-khóa: Sơ đồ tư duy / Học phần / Nền tảng / Ôn tập / Luyện thuật toán / Dự án / Bảng xếp hạng / StarCi AI)
② `ContentMap` (mục-lục bài trong module) · ③ `LessonReader` (content — ngôi sao) · ④ `OnThisPage` (TOC "Trên trang này")

## Pain mobile hiện tại
`LearnMobileBar` = top-bar 2 nút drawer (nav-khóa + module-outline). **TOC (④) bị bỏ hẳn**. Content full-width nhưng
2 drawer trên đỉnh không thumb-reach, và thiếu 1 trong 4 phần.

## 3 hướng đã vẽ widget
- **A** Docs-style: 1 drawer gộp nav, TOC = dropdown đầu content (ref Stripe/Mintlify).
- **B** ⭐ **App bottom-tab** (CHỐT): thanh tab đáy đổi giữa Mục-lục / Bài-học / TOC toàn màn (ref Codecademy/Duolingo).
- **C** 2 drawer + sheet TOC (ít sửa nhất).

## ✅ Chốt: Hướng B — App bottom-tab (thumb-first)
Lý do thầy chọn: lesson reader dùng nhiều trên mobile → **thumb-reach** (tab đáy) quan trọng hơn; cảm giác app gốc,
mỗi phần 1 view toàn màn dễ đọc, không drawer chồng.

### IA mobile (lg:hidden)
- **Thanh tab đáy** sticky, 3 tab (icon + label, active = `text-accent` + `border-t-2 border-accent`):
  | Tab | Icon | View toàn màn |
  |---|---|---|
  | **Mục lục** | `ListDashes` | ① nav-khóa (trên, gọn) + ② `ContentMap` lesson-list (dưới) |
  | **Bài học** ◀ default | `FileText` | ③ `LessonReader` (content full-width) |
  | **Trên trang** | `ListBullets` | ④ `OnThisPage` (TOC + ContentActions) |
- **Default = "Bài học"**. Đổi bài (trong tab Mục lục) → tự nhảy về tab "Bài học".
- **Desktop (≥lg) KHÔNG đổi**: vẫn 4 cột, gap-0/divider + content↔TOC `ml-8` (rule vừa chốt). Bottom-tab chỉ `lg:hidden`.
- ① nav-khóa nhét vào đầu tab "Mục lục" (cùng họ "điều hướng" với ②) — không có chỗ riêng trên mobile.

### Component đụng tới (cho /starci-fe-ux-apply)
- `LearnShell/LearnMobileBar` → thay top 2-drawer bằng **bottom tab bar** (`fixed`-style sticky đáy, `lg:hidden`).
- `LearnShell` content column: mobile render **1 view theo tab active** (map/content/toc); desktop render như cũ.
- **State**: `mobileLearnView: "map" | "content" | "toc"` (zustand `sidebar`/learn store), default `"content"`;
  select bài → set `"content"`.
- Reuse nguyên `ContentMap` / `LessonReader` / `OnThisPage` (chỉ đổi nơi mount trên mobile), KHÔNG fork UI.

### State đặc biệt
- empty: module chưa có bài → tab Mục lục hiện empty-state (AsyncContent), tab Trên-trang ẩn nếu content không heading.
- loading: mỗi view tự `AsyncContent` như desktop.
- a11y: tab bar = `role="tablist"`, mỗi tab `aria-selected`; `aria-label` cho icon-only; focus ring; thumb target ≥44px.

### Refs
- Bottom navigation (thumb-reach, 3–5 mục): Material / mobile-app convention.
- Codecademy / Duolingo mobile: mỗi section 1 view toàn màn, bottom-tab chuyển.
- [Mobile navigation patterns](https://www.designstudiouiux.com/blog/mobile-navigation-ux/) · [Drawer vs bottom-nav](https://mobbin.com/glossary/drawer)
