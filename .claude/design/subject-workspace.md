# Design — Subject Workspace (§3)

Mỗi môn học (vd PRF192) = một workspace độc lập. Route `/[locale]/subjects/[subjectId]`.

## Decision 2026-07-01 — Shell = A · Sidebar rail (brainstorm interactive, thầy chọn A)
- **Scenario:** shell cho 9 mảng (Overview, Learning, Resources, Community, Practice, AI, Members, Statistics, Career Bridge). Cần điều hướng scale tốt + khớp hệ.
- **Chose:** sidebar rail (archetype learn-shell), KHÔNG top-tabs (9 tab chật) / hub-grid (đổi mảng phải về hub).
- **Why:** rail scale khi nhiều mảng, có sẵn block nhà (`CollapsibleSidebar`/`SidebarNavGroup`/`SidebarNavItem`), sticky one-scroll pattern đã chuẩn. Overview dùng lưới lối tắt (hướng C) làm nội dung → được cả 2.
- **Cấu trúc:** 3 cụm separator (Học: Overview·Learning·Resources·Practice·AI | Cộng đồng: Community·Members | Insight: Statistics·Career Bridge). Header = subject identity strip; 3-tier law (breadcrumb→H3→parts p-6); không per-page back.
- **Data:** FE-only, mock `useQuerySubjectSwr` (chưa có BE) — log giả định; contract BE là drop-in sau.

## Decision 2026-07-02 — Overview tab = A · Hub cộng đồng 2 cột (brainstorm, thầy chọn A)
- **Scenario:** trang chính (Overview) của workspace. Subject = KHÔNG GIAN cộng đồng để JOIN
  (khác Course = mua khóa). Cần "vài post cho đỡ đơn điệu" + lối vào tài liệu + challenge.
- **Chose:** hub cộng đồng 2 cột — banner "đã tham gia" (stats + Đăng bài) → `md:grid-cols-3`:
  feed thảo luận `col-span-2` (post ghim moderator = accent card + post rows) + rail `col-span-1`
  (Tài liệu mới / Challenge nổi bật / Thành viên tích cực, mỗi cụm link sang tab đầy đủ).
  KHÔNG hướng B (dashboard ô-lối-vào) vì thiên tra cứu, mất cảm giác cộng đồng.
- **Why:** khớp mô hình "join như community"; feed làm trang sống động; rail là lối tắt nhanh.
  Feature `SubjectOverview`; `page.tsx` → mount shell mỏng (bỏ logic inline cũ — canon 1.6).
- **Components:** post rows hand-rolled khớp idiom `SubjectCommunity` (cùng domain, 1 look);
  difficulty challenge → chip màu (easy=success/medium=warning/hard=danger). Mock
  `useQuerySubjectOverviewSwr` (1 payload curated) thay vì ghép 4 hook tab.
- **ponytail:** Đăng bài + shortcut rows navigate/no-op; mock data.

## Backend business
- (chưa có BE trong repo này — FE-only. Khi có, trace resolver→service→entity cho subject/enrollment/progress rồi cập nhật mục này.)
