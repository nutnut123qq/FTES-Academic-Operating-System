# Design — dashboard cockpit tabs

## Context

Port từ `starci-academy/src/components/features/dashboard/` (index.tsx, DashboardTabsBar,
hooks/useDashboardTabUrlSync.ts, types.ts). Khác biệt bắt buộc so với bản gốc được liệt ở
"Deviations" bên dưới — bản gốc dùng vài primitive FTES không có.

## Goals / Non-Goals

- **Goals**: khung điều hướng 4 tab ổn định, shareable qua `?tab=`, mount lười từng panel, tái
  dùng `DashboardIdentity` sẵn có, không thêm i18n key mới.
- **Non-Goals**: nội dung 4 tab (P1..P4), sửa `/analytics`, thêm endpoint BE, mock dữ liệu.

## Decisions

### 1. Tab state ở zustand store, KHÔNG useState

`useDashboardTabStore` đã tồn tại và đúng union. Bắt buộc dùng store (không phải state cục bộ) vì
tab strip render TRONG cây `Navbar` (mount ở `InnerLayout`), tức là **anh em** chứ không phải con
của trang — không thể prop-drill. Store là kênh duy nhất nối strip ↔ panel.

### 2. `?tab=` sync 2 chiều + `fromUrlRef` chống echo

Chép nguyên logic Starci:
- URL → store: effect deps `[queryTab]`, adopt khi `isDashboardTab(queryTab) && queryTab !== tab`,
  set cờ `fromUrlRef` trước khi `setTab`.
- store → URL: effect deps `[tab]`, nếu `fromUrlRef` thì nhả cờ và return (không echo ngược);
  ngược lại `router.replace(pathname?tab=..., { scroll: false })`.

`router.replace` (KHÔNG `push`) → đổi tab không đẻ history entry mới, nút Back vẫn rời khỏi
`/dashboard` thay vì lùi qua từng tab. Deps cố tình chỉ có `[queryTab]` / `[tab]` — đây chính là
bẫy đã ghi ở `src/hooks/effects/useSetTabQuery.ts` (thêm store tab vào deps của effect URL→store
sẽ tạo frame reset về default trong lúc `router.replace` chưa settle). `react-hooks/exhaustive-deps`
đã tắt ở `eslint.config.mjs` nên không cần disable-comment.

### 3. Tab strip = navbar bottom layer, node phải STABLE

`useRegisterNavbarBottomLayer(node)` để `node` trong deps của `useEffect` → JSX inline sẽ đăng ký
lại mỗi render. Dùng `useMemo(() => <DashboardTabsBar />, [])` (deps rỗng — `DashboardTabsBar` tự
đọc store, không nhận prop). Hook tự clear khi unmount → rời `/dashboard` là strip biến mất.

Strip chỉ mang padding ngang (`px-6`, khớp body `px-6`) — KHÔNG `border-b`, `sticky`, `z-*`, `bg-*`:
`Navbar` `<header>` đã có `sticky top-0 z-50 border-b border-separator bg-background`, thêm nữa là
double rule.

### 4. Panel mount có điều kiện, KHÔNG `hidden`

`{tab === "overview" ? <OverviewTab/> : null}` — mỗi panel bọc `div role="tabpanel"`
`id="dashboard-panel-<tab>"` `aria-labelledby="<tab>"` (khớp `Tabs.Tab id={tab}` +
`aria-controls={"dashboard-panel-"+tab}`). Mount lười là yêu cầu chức năng: mỗi widget P1..P4 tự
fetch leaf query của nó; `hidden` sẽ khiến 4 tab bắn hết query ngay lần đầu.

### 5. Mobile icon-only

Theo luật nhà (`.claude/rules/drafts/tabs-icon-label-hide-label-on-mobile.md`): tab có CẢ icon lẫn
label → mobile ẩn label. Label bọc `<span className="hidden md:inline">`, icon `aria-hidden`, và
`Tabs.Tab` nhận `textValue={label}` để screen reader vẫn đọc được tên tab khi label bị ẩn về mặt
thị giác (`hidden` = `display:none`, mất khỏi accessibility tree).

## Deviations so với bản Starci

| Starci | FTES | Lý do |
|---|---|---|
| `<Tabs.Indicator />` trong `Tabs.Tab` | bỏ | `ExtendedTabs` của FTES bake `variant="secondary"` (underline + accent sẵn); thêm Indicator là gạch đôi |
| `@app-md:` container query | `md:` | repo FTES không dùng container-query prefix ở đâu cả |
| `gap-8` ngoài / `gap-4` aside | `gap-6` / `gap-4` | khớp `AnalyticsDashboard/index.tsx` (2-col shell hiện hành) |
| `DashboardIdentity` cùng thư mục | import từ `features/analytics/AnalyticsDashboard/DashboardIdentity` | không copy file; eslint repo không cấm import chéo feature |
| `t("dashboard.title")` qua `useTranslations()` root | giữ nguyên | key đã tồn tại ở vi/en |

## Risks

- **Chưa từng có ai render navbar bottom layer** → phải xác minh bằng mắt (đây là consumer đầu tiên).
- Trang nào dùng `md:sticky md:top-20` (vd `ProfileShell`) sẽ lệch offset nếu navbar cao thêm 1
  tầng — nhưng strip chỉ tồn tại khi `/dashboard` mounted, nên không ảnh hưởng trang khác.
- `robots.ts` đã disallow `/dashboard` (đúng cho trang cá nhân hoá) — không đổi trong change này.
