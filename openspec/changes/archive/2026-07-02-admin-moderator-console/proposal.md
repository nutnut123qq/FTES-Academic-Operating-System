# admin-moderator-console — Admin & Moderator Console: khu vận hành CMS (role-gated, FE mock)

## Why

Thầy chốt: **"Trang admin/moderator cũng làm luôn đi. Admin sẽ có admin this admin that."** — FTES AOS đã có `/admin/roles` (rbac-roles) và vài công cụ admin rời (ai-balancer, mpeg-dash, upload-video) nhưng **chưa có một console vận hành thống nhất**. `ftes.txt` §22 (Admin CMS) liệt kê một loạt bề mặt quản trị: User Management, Course/Resource/Community/Event Management, Roles & Permissions, Analytics, Audit Log, Feature Toggle, System Configuration. Hiện mỗi domain có trang chi tiết cho người dùng cuối, nhưng người điều hành không có nơi tập trung để **quản người, kiểm duyệt nội dung, bật/tắt và ghim nội dung domain, và xem tổng quan số liệu**.

**Console-as-a-surface**: admin console phải là một *khu vực* có shell riêng, nav theo section, breadcrumb, page header, và **phân quyền vào cửa** (role-gated) — Moderator chỉ thấy phần kiểm duyệt (subset), Admin/Super Admin thấy tất cả. Đây là bề mặt gom §22 lại thành một trải nghiệm mạch lạc, đặt cạnh `/admin/roles` (rbac-roles) và trỏ sang `config-center` cho phần System Configuration (không spec config ở đây).

FE-only giai đoạn này: mọi mutation (đổi role, suspend/ban, approve/reject, toggle status, feature/pin) là **mock** (mock hook + confirm dialog); contract BE là **giả định tường minh** (assumption), không bịa API đã tồn tại.

## What Changes

- **Console shell + section nav** tại `/admin` — layout khu admin dùng chung: sidebar/nav theo section, breadcrumb, page header. **Role-gated entry**: đọc role từ mock session; `moderator` thấy **subset** (Dashboard + Moderation); `admin`/`superAdmin` thấy **toàn bộ** section (Dashboard, Users, Moderation, Courses, Resources, Communities/Groups, Events, + link sang Roles và Config Center). Guest/không đủ quyền → **redirect** (guest → trang đăng nhập admin; role không đủ → forbidden/redirect về section được phép).
- **User management** (`/admin/users`) — list + search/filter user (tên, email, role, trạng thái); trang chi tiết user; hành động **đổi role**, **suspend / ban / reset password** — tất cả là **mock mutation** kèm **confirm dialog** trước thao tác có hệ quả.
- **Content moderation** (`/admin/moderation`, Moderator có quyền) — **hàng đợi report** cho posts / comments / resources; hành động **approve / reject / remove**; **moderation log** (ai xử gì, khi nào) — mock. Empty state khi hàng đợi rỗng.
- **Domain CMS** (`/admin/courses`, `/admin/resources`, `/admin/communities`, `/admin/events`) — mỗi domain: **list + status toggle** (draft/published/archived) + **feature/pin** — mock; mỗi hàng **link sang trang chi tiết đã có** (`/courses/[courseId]`, `/resources`, `/community/[postId]` hoặc `/groups/[groupId]`, `/events`).
- **Dashboard overview** (`/admin`) — **stat card** admin: tổng số user, tổng nội dung (courses/resources/communities/events), số report đang chờ — mock; các card link sang section tương ứng.
- **Cross-reference config-center**: section "System Configuration" chỉ là **link** sang change `config-center` (`/admin/config`, Super Admin gated). **KHÔNG** spec config ở change này.
- **Trạng thái + responsive + i18n + a11y**: loading skeleton (mirror layout list/table), empty state (danh sách rỗng), error state (load/mutation hỏng), confirm-on-destructive (đổi role / ban / remove / archive); responsive (mobile: nav collapse thành drawer, table → card/stacked); i18n vi/en dưới namespace `admin.*`; a11y (nav landmark, table caption + header scope, dialog focus-trap, action button có nhãn).

## Capabilities

### New Capabilities

- `admin-console-shell`: shell khu admin dưới `/admin` — section nav + breadcrumb + page header, role-gated entry (moderator = subset; admin/superAdmin = all), guest/unauthorized → redirect; responsive nav, i18n `admin.shell.*`, a11y landmark; link sang rbac-roles và config-center.
- `admin-user-management`: quản người dùng — list/search/filter, trang chi tiết, đổi role / suspend / ban / reset password (mock mutation + confirm dialog), trạng thái loading/empty/error, i18n `admin.users.*`.
- `admin-content-moderation`: kiểm duyệt nội dung cho Moderator — report queue (posts/comments/resources), approve/reject/remove, moderation log (mock); empty/loading/error, i18n `admin.moderation.*`.
- `admin-domain-cms`: CMS domain — quản Courses / Resources / Communities-Groups / Events (list + status toggle + feature/pin, mock), link sang trang chi tiết đã có, i18n `admin.cms.*`.
- `admin-dashboard-overview`: tổng quan dashboard — stat card (users, content, pending reports) mock, link sang section; loading/error, i18n `admin.dashboard.*`.

### Modified Capabilities

<!-- Không sửa spec hiện hữu. rbac-roles (/admin/roles) là bề mặt admin láng giềng độc lập — console chỉ THAM CHIẾU 4 role (member/moderator/admin/superAdmin) để gate và LINK sang nó, không sửa spec. config-center được TRỎ SANG (link), không spec ở đây. -->

## Impact

- **Route mới** dưới `/admin`: `/admin` (dashboard), `/admin/users`, `/admin/users/[userId]`, `/admin/moderation`, `/admin/courses`, `/admin/resources`, `/admin/communities`, `/admin/events` — sống cạnh `/admin/roles` (rbac-roles) và `/admin/config` (config-center) và `/admin/tools/*` (đã có).
- **Shell mới** `src/components/layouts/admin/AdminConsole*` (shell + section nav) — layout khu admin dùng chung; hiện `/admin` chỉ là AdminLogin, change này thêm shell điều hướng khi đã xác thực.
- **Gating**: đọc role từ mock session (auth-flows-mock); `moderator` → subset section; `admin`/`superAdmin` → all; guest → redirect login; role không đủ cho một section → forbidden/redirect. Tái dùng 4 role của rbac-roles.
- **Mock store/hook mới** `src/components/features/admin/**` (hoặc `src/hooks/**`): `useQueryAdminUsersSwr`, `useQueryReportsSwr`, `useQueryAdminCms*Swr`, `useQueryAdminStatsSwr` + mock mutation (đổi role, suspend/ban/reset, approve/reject/remove, toggle status, feature/pin). **Giả định**: BE cung cấp các endpoint quản trị tương ứng với envelope `data` nullable (canon nhà) — chưa tồn tại, là assumption.
- **i18n** `src/messages/vi.json` + `en.json`: cụm `admin.*` (`admin.shell.*`, `admin.dashboard.*`, `admin.users.*`, `admin.moderation.*`, `admin.cms.*`, forbidden/confirm/toast). Namespace `admin` đã tồn tại một phần — bổ sung, không phá key cũ.
- Không đụng backend thật; FE-only. Không sửa spec `rbac-roles` / `config-center`.
