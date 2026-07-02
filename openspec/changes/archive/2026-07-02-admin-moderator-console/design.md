# Design — admin-moderator-console

## Context

- **Khu admin hiện có**: `/admin` (hiện chỉ render `AdminLogin` — form nhập API key), `/admin/roles` (rbac-roles — RolesAdmin, read-only mock), `/admin/tools/*` (ai-balancer, mpeg-dash, upload-video). **Chưa có shell điều hướng khu admin** khi đã xác thực — mỗi trang tự đứng. `/admin/config` là bề mặt của change `config-center` (Super Admin gated, spec riêng).
- **RBAC**: rbac-roles định nghĩa 4 role — `member`, `moderator`, `admin`, `superAdmin` — với ma trận quyền (`manageUsers`, `manageContent`, `moderate`, `viewAnalytics`, `manageRoles`, `publish`). Console tái dùng đúng 4 role này để gate; không định nghĩa role mới.
- **Trang chi tiết domain đã có** để link tới: `/courses/[courseId]`, `/resources` (+ collections/recommended/upload), `/community/[postId]`, `/groups/[groupId]`, `/events`. Có sẵn bề mặt user-facing `/community/moderation` (community-moderation) — **khác** với admin moderation queue của console (console gom report đa loại: post/comment/resource cho toàn hệ).
- **Canon nhà**: FE-only → mock + ghi giả định; envelope BE `data` nullable; SWR (`useQuery*Swr`) cho đọc, mock mutation cho ghi; HeroUI + `next-intl` (vi/en); không emoji trong UI; verify `npx tsc --noEmit` + `npm run build` (webpack) do orchestrator chạy.

## Goals / Non-Goals

**Goals**
- Một **console shell** dưới `/admin` với section nav + breadcrumb + page header, role-gated (moderator = subset; admin/superAdmin = all), guest/unauthorized → redirect.
- **User management**: list/search, detail, đổi role / suspend / ban / reset (mock + confirm).
- **Content moderation** (Moderator): report queue đa loại + approve/reject/remove + moderation log (mock).
- **Domain CMS**: Courses / Resources / Communities-Groups / Events — list + status toggle + feature/pin (mock), link sang detail đã có.
- **Dashboard**: stat card users/content/pending reports (mock), link sang section.
- Trạng thái loading/empty/error, confirm-on-destructive, responsive, i18n `admin.*`, a11y đầy đủ.
- Mock hook/store với **seam swap sang BE admin-service** ghi tường minh.

**Non-Goals**
- KHÔNG dựng BE admin-service thật (contract là assumption).
- KHÔNG spec System Configuration / feature flags ở đây — thuộc `config-center` (chỉ LINK).
- KHÔNG sửa spec `rbac-roles`; console chỉ tham chiếu 4 role + link `/admin/roles`.
- KHÔNG thay bề mặt user-facing `/community/moderation`; admin moderation là hàng đợi toàn hệ riêng.
- KHÔNG §22 phần AI/Marketplace/Workflow/Banner/Analytics-charts sâu (ngoài stat card) — deferred.

## Decisions

### D1 — Route structure dưới `/admin`

```
/admin                      → Dashboard overview (stat cards)
/admin/users                → User list + search/filter
/admin/users/[userId]       → User detail + actions
/admin/moderation           → Report queue + moderation log (Moderator+)
/admin/courses              → Courses CMS list
/admin/resources            → Resources CMS list
/admin/communities          → Communities/Groups CMS list
/admin/events               → Events CMS list
/admin/roles                → (rbac-roles, đã có — link từ nav)
/admin/config               → (config-center, đã có — link từ nav, Super Admin)
/admin/tools/*              → (đã có — link từ nav)
```

- `/admin` (hiện là AdminLogin): guest/chưa xác thực → **AdminLogin**; đã xác thực đủ quyền → **Dashboard**. Guard ở layer layout quyết định render login vs console.
- Chọn **route segment** cho từng section (không phải một trang tab-switch) để deep-link + breadcrumb + code-split. Alternative bị loại: single-page tabs (khó deep-link, không hợp §22 nhiều màn).

### D2 — Console shell + section nav (`admin-console-shell`)

- `AdminConsoleShell` (layout): sidebar/nav bên trái (desktop) hoặc drawer (mobile) + vùng nội dung có **breadcrumb** (`Admin / <Section> / <Subpage>`) + **page header** (tiêu đề + mô tả + actions slot).
- **Section nav** render danh sách section **đã lọc theo role** (xem D3). Item active theo route segment. Nav là `<nav aria-label>` landmark; mỗi item là link.
- Nav gồm cả link **ngoài change** (Roles → `/admin/roles`; Config → `/admin/config`; Tools → `/admin/tools/*`) đánh dấu rõ nhóm; Config item chỉ hiện với `superAdmin`.

### D3 — FE role-gate mechanism

- Nguồn role: **mock session** (auth-flows-mock) qua hook `useAdminSession()` → `{ role, isAuthenticated }`. FE-only; khi có BE, hook đọc từ session thật (seam).
- **Bảng quyền section** (single source):

```ts
type AdminSection = "dashboard" | "users" | "moderation"
  | "courses" | "resources" | "communities" | "events" | "roles" | "config"
// role → sections được vào
const SECTION_ACCESS: Record<Role, AdminSection[]> = {
  member:     [],                                  // → không vào console
  moderator:  ["dashboard", "moderation"],         // subset
  admin:      ["dashboard","users","moderation","courses","resources","communities","events","roles"],
  superAdmin: [/* tất cả, kèm */ "config"],
}
```

- **Gating 2 tầng**:
  1. **Entry guard** (layout `/admin/*`): `!isAuthenticated || role === "member"` → **redirect** guest sang AdminLogin (`/admin`), member sang trang phù hợp / forbidden. Không mount console cho người không có quyền.
  2. **Section guard** (mỗi section route): nếu `section ∉ SECTION_ACCESS[role]` → **redirect** về section mặc định được phép (moderator → `/admin/moderation` hoặc `/admin`), hoặc render `<AdminForbidden />` (403 surface) nếu deep-link trực tiếp — nói rõ "không đủ quyền", không 404.
- Nav chỉ hiển thị section trong `SECTION_ACCESS[role]` → moderator không thấy link Users/CMS.

### D4 — Data model + mock hooks (seam swap BE admin-service)

```ts
// Users
type UserStatus = "active" | "suspended" | "banned"
interface AdminUser { id; name; email; role: Role; status: UserStatus; joinedAt; lastActiveAt }

// Moderation
type ReportTarget = "post" | "comment" | "resource"
type ReportStatus = "pending" | "approved" | "rejected" | "removed"
interface Report { id; target: ReportTarget; targetId; reason; reportedBy; createdAt; status: ReportStatus; excerpt }
interface ModerationLogEntry { id; reportId; action: "approve"|"reject"|"remove"; by; at }

// Domain CMS
type ContentStatus = "draft" | "published" | "archived"
interface CmsItem { id; title; type: "course"|"resource"|"community"|"event"; status: ContentStatus; featured: boolean; pinned: boolean; detailHref }

// Dashboard
interface AdminStats { totalUsers; totalCourses; totalResources; totalCommunities; totalEvents; pendingReports }
```

- **Đọc** qua SWR hooks: `useQueryAdminStatsSwr`, `useQueryAdminUsersSwr(filter)`, `useQueryAdminUserSwr(id)`, `useQueryReportsSwr`, `useQueryModerationLogSwr`, `useQueryAdminCmsSwr(domain)`. Mock fetcher trả seed deterministic, giả delay để lộ skeleton.
- **Ghi** qua mock mutation (giả delay + cờ mô phỏng lỗi): `changeUserRole`, `suspendUser`, `banUser`, `resetUserPassword`, `moderateReport(action)`, `toggleCmsStatus`, `setCmsFeatured`, `setCmsPinned`. Mutation cập nhật mock state + trả success/error → toast.
- **Seam**: một `adminService` (interface) với `mockAdminService`; comment chỉ rõ chỗ swap sang `httpAdminService` (REST/GraphQL admin endpoints, envelope `data` nullable — **assumption**, chưa tồn tại).

### D5 — Confirm-on-destructive

- Thao tác có hệ quả (đổi role, suspend, ban, reset password, remove report, archive content) mở **confirm dialog** (HeroUI Modal) mô tả hệ quả + nút Hủy/Xác nhận. Hủy → không đổi. Chỉ toggle nhẹ (feature/pin, publish↔draft) có thể không cần confirm (ghi rõ trong spec: destructive cần confirm).

### D6 — Component decomposition

- `AdminConsoleShell` (layout) → `AdminSectionNav`, `AdminBreadcrumb`, `AdminPageHeader`, `AdminForbidden`.
- Users: `AdminUsersPage` → `UserFilterBar`, `UsersTable`/`UserCardList` (responsive), `UserDetail` → `UserActionsMenu` + `ConfirmDialog`.
- Moderation: `ModerationQueue` → `ReportRow` + `ModerateActions` (+ confirm), `ModerationLog`.
- CMS: `CmsListPage` (tham số hoá theo domain) → `CmsRow` (status toggle + feature/pin + link detail).
- Dashboard: `AdminDashboard` → `StatCard` (link section).
- Chung: `AsyncContent` (loading skeleton / empty / error), `ConfirmDialog`, `StatusBadge`.

## Risks / Trade-offs

- [Role từ mock session không phản ánh BE thật] → Gate cả 2 tầng (entry + section) + seam `useAdminSession`; khi BE có, đổi 1 hook. FE gate là UX guard, **không** thay kiểm quyền BE (ghi assumption: BE phải tự enforce).
- [Trùng bề mặt với `/community/moderation`] → Phân định rõ: community-moderation là user-facing của một cộng đồng; admin moderation là hàng đợi report toàn hệ, đa loại. Không rewire cái cũ.
- [Đụng namespace i18n `admin.*` đã tồn tại một phần] → Chỉ **thêm** sub-key (`admin.shell.*`, `admin.users.*`…); không sửa/xoá key cũ.
- [CMS link tới detail có thể lệch route] → detailHref lấy từ mock, khớp route đã liệt kê ở D1; nếu domain chưa có detail (resource) → link tới list `/resources`.

## Migration Plan

- FE-only, không migration dữ liệu. Rollback = revert commit route + component + i18n. Không ảnh hưởng backend.

## Open Questions

- Reset password: chỉ trigger mock "đã gửi email reset" hay cho đặt mật khẩu tạm? → giai đoạn này chỉ mock toast "đã gửi link reset". (spec để mở, hành vi tối thiểu.)
- Moderator có được xem Dashboard đầy đủ hay chỉ card pending-reports? → subset: dashboard hiển thị nhưng chỉ card liên quan quyền `moderate`/`viewAnalytics`. (spec ghi subset theo role.)
