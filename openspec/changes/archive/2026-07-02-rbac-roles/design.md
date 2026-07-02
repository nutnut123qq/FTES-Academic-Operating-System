## Layout

`mx-auto max-w-6xl p-6` column, title + subtitle (`rbac.title` / `rbac.subtitle`).
Two stacked sections:

1. **Roles overview** (`rbac.rolesOverview`) — a responsive card grid
   (`sm:grid-cols-2 lg:grid-cols-4`). Each card = house link-card class
   `rounded-large border border-separator p-4`: a shield icon in an accent tint,
   the localized role name, and the rounded member count (`rbac.memberCount`).

2. **Permission matrix** (`rbac.permissionMatrix`) — a real `<table>` wrapped in an
   `overflow-x-auto rounded-large border border-separator` so it scrolls on narrow
   screens. Rows = permissions (`rbac.permissions.<key>`), columns = roles
   (`rbac.roles.<key>`). The corner header cell labels the permission column; each
   body cell renders a `CheckIcon` (granted, `text-success`) or `XIcon`
   (not granted, `text-muted`). Cell borders use `border-separator` tokens only.

## Data

`useQueryRolesSwr` — mock, SWR-shaped. Returns `roles` (~4 `{ id, key, memberCount }`,
key ∈ member|moderator|admin|superAdmin) and a `permissions` matrix: a list of ~6
permission `{ id, key }` plus, per role key, a `Set` of granted permission keys
(`grants: Record<roleKey, Set<permKey>>`). A `ponytail:` note marks the BE swap point;
the hook API (return shape) stays when the real RBAC query lands.

## a11y

- `<table>` has a `<caption>` (`rbac.permissionMatrix`, visually hidden is fine).
- Column headers `<th scope="col">` (role names) and row headers `<th scope="row">`
  (permission names).
- Each grant/deny cell icon carries an `aria-label` of `rbac.granted` /
  `rbac.notGranted` so screen readers announce the state (icons alone are decorative).
- Dark-mode + tokens only; no hardcoded colors.

## Not doing

- No editing/toggling grants (read-only mock) — write path lands with the BE contract.
- No add/remove roles, no per-user assignment, no pagination (4 roles / 6 perms).
