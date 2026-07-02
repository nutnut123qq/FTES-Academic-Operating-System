# Tasks — admin-moderator-console

## 1. Foundation: model, mock service, session gate, seed, i18n

- [x] 1.1 Create `src/resources/constants/admin.ts`: types (`AdminSection`, `UserStatus`, `AdminUser`, `ReportTarget`, `ReportStatus`, `Report`, `ModerationLogEntry`, `ContentStatus`, `CmsItem`, `AdminStats`) + `SECTION_ACCESS` map (member/moderator/admin/superAdmin → sections) + deterministic seed (users, reports, moderation log, CMS items per domain, stats)
- [x] 1.2 Create `src/services/admin/index.ts`: `AdminService` interface (`listStats`, `listUsers`, `getUser`, `changeUserRole`, `suspendUser`, `banUser`, `resetUserPassword`, `listReports`, `listModerationLog`, `moderateReport`, `listCms`, `toggleCmsStatus`, `setCmsFeatured`, `setCmsPinned`) + `mockAdminService` (reads/writes seed state, simulated delay, error-simulation flag); comment the seam swap to `httpAdminService` (assumed admin endpoints, `data`-nullable envelope — assumption, not existing)
- [x] 1.3 Create `useAdminSession()` hook returning `{ role, isAuthenticated }` from mock auth (auth-flows-mock); document seam to real session
- [x] 1.4 i18n: add `admin.*` sub-namespaces to `src/messages/vi.json` + `en.json` (`admin.shell.*`, `admin.dashboard.*`, `admin.users.*`, `admin.moderation.*`, `admin.cms.*`, forbidden/confirm/toast labels) without breaking existing `admin` keys; JSON valid
- [x] 1.5 Verify foundation: `npx tsc --noEmit` clean (build orchestrator-verified)

## 2. Console shell + section nav + gating

- [x] 2.1 `AdminConsoleShell` layout under `/admin` with `AdminSectionNav` (role-filtered via `SECTION_ACCESS`), `AdminBreadcrumb`, `AdminPageHeader` (title/description/actions slot); nav as `<nav aria-label>` landmark, active by route segment
- [x] 2.2 Entry guard: unauthenticated guest → AdminLogin at `/admin`; member (no access) → redirect; do not mount console or fetch admin data for them
- [x] 2.3 Section guard + `AdminForbidden` (403 surface): section ∉ `SECTION_ACCESS[role]` → redirect to permitted default or render forbidden on direct deep-link
- [x] 2.4 Nav cross-links: Roles → `/admin/roles`, Config → `/admin/config` (superAdmin only), Tools → `/admin/tools/*`; grouped + labeled
- [x] 2.5 Responsive nav (mobile drawer toggle) + verify: `npx tsc --noEmit` clean; moderator sees subset, admin sees all, guest → login, member → redirect (build orchestrator-verified)

## 3. Dashboard overview

- [x] 3.1 Route `/admin` dashboard: `AdminDashboard` → `StatCard` grid via `useQueryAdminStatsSwr` (users, content counts, pending reports); cards link to sections
- [x] 3.2 Role-scoped cards: moderator sees only permitted cards (pending reports); loading skeleton (mirror card layout) + error state
- [x] 3.3 i18n `admin.dashboard.*` + a11y (card accessible labels) + verify `npx tsc --noEmit` clean (build orchestrator-verified)

## 4. User management

- [x] 4.1 Route `/admin/users`: `AdminUsersPage` → `UserFilterBar` (search + role/status filter) + responsive `UsersTable`/`UserCardList` via `useQueryAdminUsersSwr(filter)`; loading skeleton + empty state
- [x] 4.2 Route `/admin/users/[userId]`: `UserDetail` via `useQueryAdminUserSwr(id)` (profile, role, status, metadata) + `UserActionsMenu`
- [x] 4.3 Actions with `ConfirmDialog`: change role, suspend, ban, reset password → mock mutations + success/error toast; cancel leaves state unchanged
- [x] 4.4 i18n `admin.users.*` + a11y (table caption/scoped headers, action labels) + verify `npx tsc --noEmit` clean (build orchestrator-verified)

## 5. Content moderation (Moderator)

- [x] 5.1 Route `/admin/moderation`: `ModerationQueue` → `ReportRow` (target type, reason, reporter, timestamp, excerpt) via `useQueryReportsSwr`; loading skeleton + empty state
- [x] 5.2 `ModerateActions`: approve/reject/remove → mock mutations; remove requires `ConfirmDialog`; success/error toast; resolved report leaves pending queue
- [x] 5.3 `ModerationLog` via `useQueryModerationLogSwr` (actor, action, target, timestamp)
- [x] 5.4 i18n `admin.moderation.*` + a11y + verify `npx tsc --noEmit` clean; non-moderator blocked (build orchestrator-verified)

## 6. Domain CMS

- [x] 6.1 Shared `CmsListPage` parameterized by domain → `CmsRow` (title, `StatusBadge`, featured/pinned) via `useQueryAdminCmsSwr(domain)`; loading skeleton + empty state
- [x] 6.2 Routes `/admin/courses`, `/admin/resources`, `/admin/communities`, `/admin/events` mounting `CmsListPage` with the right domain
- [x] 6.3 Status toggle (`toggleCmsStatus`, archive via `ConfirmDialog`) + feature/pin toggles (`setCmsFeatured`/`setCmsPinned`) → mock mutations + toast
- [x] 6.4 Detail links from each row to existing pages (`/courses/[courseId]`, `/community/[postId]` or `/groups/[groupId]`, `/events`, `/resources`)
- [x] 6.5 i18n `admin.cms.*` + responsive (mobile rows → cards) + a11y + verify `npx tsc --noEmit` clean (build orchestrator-verified)

## 7. Final verification

- [ ] 7.1 Full pass: RBAC gating (moderator vs admin vs superAdmin vs member vs guest), empty/loading/error states, confirm-on-destructive, responsive, i18n vi/en, a11y across all sections
- [ ] 7.2 `npx tsc --noEmit` clean; `openspec validate admin-moderator-console` reports valid (build orchestrator-verified via `npm run build`)
