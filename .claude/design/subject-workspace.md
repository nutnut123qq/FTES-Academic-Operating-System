# Design — Subject Workspace (§3)

Mỗi môn học (vd PRF192) = một workspace độc lập. Route `/[locale]/subjects/[subjectId]`.

## Decision 2026-07-01 — Shell = A · Sidebar rail (brainstorm interactive, thầy chọn A)
- **Scenario:** shell cho 9 mảng (Overview, Learning, Resources, Community, Practice, AI, Members, Statistics, Career Bridge). Cần điều hướng scale tốt + khớp hệ.
- **Chose:** sidebar rail (archetype learn-shell), KHÔNG top-tabs (9 tab chật) / hub-grid (đổi mảng phải về hub).
- **Why:** rail scale khi nhiều mảng, có sẵn block nhà (`CollapsibleSidebar`/`SidebarNavGroup`/`SidebarNavItem`), sticky one-scroll pattern đã chuẩn. Overview dùng lưới lối tắt (hướng C) làm nội dung → được cả 2.
- **Cấu trúc:** 3 cụm separator (Học: Overview·Learning·Resources·Practice·AI | Cộng đồng: Community·Members | Insight: Statistics·Career Bridge). Header = subject identity strip; 3-tier law (breadcrumb→H3→parts p-6); không per-page back.
- **Data:** FE-only, mock `useQuerySubjectSwr` (chưa có BE) — log giả định; contract BE là drop-in sau.

## Backend business
- (chưa có BE trong repo này — FE-only. Khi có, trace resolver→service→entity cho subject/enrollment/progress rồi cập nhật mục này.)
