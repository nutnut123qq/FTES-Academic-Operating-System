## Why

§1 Authorization (RBAC) has no admin surface. Operators need a single read-only
place to see the system roles (member/moderator/admin/superAdmin), how many members
each holds, and exactly which permissions each role grants. Today that mapping lives
only in code/BE, invisible to the people who administer access. This ships the
roles & permissions admin view (FE-only mock) so the surface exists and can be wired
to a real RBAC contract later.

## What Changes

- Add `features/rbac/RolesAdmin`: a roles overview (cards: role name + member count)
  plus a permission matrix `<table>` (rows = permissions, columns = roles, each cell
  a check/x icon indicating grant). Read-only mock.
- Add `useQueryRolesSwr` (mock roles list + permission matrix, SWR-shaped) so the
  hook API stays when a real BE lands.
- Add `[locale]/admin/roles/page.tsx` → renders `<RolesAdmin />`.
- Add `rbac.*` i18n (en/vi): title/subtitle/section labels, role names, permission
  labels, granted/notGranted.

## Capabilities

### New Capabilities
- `rbac-roles`: the roles & permissions admin surface at `/admin/roles`.

### Modified Capabilities
- (none)

## Impact
- FE: new `features/rbac/RolesAdmin`, `features/rbac/hooks/useQueryRolesSwr`,
  `[locale]/admin/roles/page.tsx`, `rbac.*` i18n. No BE (mock). No shared-file edits.
