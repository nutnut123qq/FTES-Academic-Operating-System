# Trang `/dashboard` — cockpit 4 tab (Overview · Explore · Courses · Community)

## Why

Người đã đăng nhập hiện chỉ có `/analytics` — một trang 1 tab (Overview) không có lối vào
feed/khoá học/cộng đồng, và `AnalyticsDashboard` tự ghi trong docblock là "Not ported from
StarCI: the Explore/Courses/Community tabs + the navbar bottom-layer tab strip (need FTES
tab-store + navbar infra that isn't present)". Thực tế hạ tầng ĐÃ có nhưng đang là dead code:

- `src/hooks/zustand/dashboardTab/store.ts` (`DashboardTab = overview|explore|courses|community`) — 0 consumer.
- `src/hooks/zustand/navbarBottomLayer/store.ts` + `useRegisterNavbarBottomLayer` — 0 consumer;
  `Navbar` đã render slot bottom-layer và tự sở hữu `sticky` + `border-b` duy nhất.
- `pathConfig().locale(l).dashboard().build()` đã sinh `/${locale}/dashboard` nhưng route chưa tồn tại.
- i18n `dashboard.title` + `dashboard.tabs.{overview,explore,courses,community}` đã có sẵn ở cả vi/en.

Change này dựng KHUNG (P0) để 4 phase sau (P1..P4) chỉ việc điền nội dung từng tab, mỗi widget
tự fetch leaf query của mình.

## What Changes

- **Route mới** `/[locale]/dashboard` render `<Dashboard />` (server page 1 dòng, giống `/analytics`).
- **Khung `features/dashboard/`**: `types.ts` (DASHBOARD_TABS), `hooks/useDashboardTabUrlSync.ts`
  (đồng bộ 2 chiều store ↔ `?tab=`, dùng `router.replace` nên KHÔNG đẻ history entry),
  `DashboardTabsBar/` (ExtendedTabs + icon phosphor, mobile icon-only), `index.tsx` (khung 2 cột
  `max-w-6xl`, chỉ mount panel của tab đang mở).
- **Tab strip nằm ở navbar bottom layer** — `useRegisterNavbarBottomLayer` có consumer đầu tiên.
  Strip KHÔNG mang `border-b`/`sticky`/`z`/`bg` của riêng nó (Navbar `<header>` đã sở hữu).
- **Tái dùng `DashboardIdentity`** của `features/analytics/AnalyticsDashboard/DashboardIdentity`
  bằng import chéo feature (eslint repo không có `no-restricted-imports`), KHÔNG copy file.
- **4 stub rỗng** `OverviewTab / ExploreTab / CoursesTab / CommunityTab` (render `null`) để P1..P4 điền.

Không đụng: `src/messages/*.json` (key đã tồn tại), `AnalyticsDashboard` (giữ nguyên `/analytics`),
`src/proxy.ts` (xem Impact).

## Impact

- Affected specs: `dashboard-ui` (ADDED)
- Affected code: `src/app/[locale]/dashboard/page.tsx` (mới),
  `src/components/features/dashboard/**` (mới), `src/hooks/zustand/{dashboardTab,navbarBottomLayer}`
  (từ dead code → có consumer)
- **Không cần BE**: khung P0 không gọi API nào. Mọi contract dữ liệu thuộc P1..P4.
- **Không đổi `src/proxy.ts`**: `PROTECTED_PATTERNS` hiện chỉ chặn `/admin`; `/analytics` KHÔNG bị
  gate ở edge, nên `/dashboard` giữ cùng chế độ (SPA tự verify session khi mount). Ghi nhận riêng:
  `src/app/robots.ts` đã `disallow "/dashboard"` từ trước — đúng cho trang cá nhân hoá, giữ nguyên.
