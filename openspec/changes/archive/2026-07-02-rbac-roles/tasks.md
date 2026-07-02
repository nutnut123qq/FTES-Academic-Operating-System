## 1. Data
- [x] 1.1 `features/rbac/hooks/useQueryRolesSwr` — mock roles list + permission matrix (SWR-shaped, `ponytail:` note)

## 2. Surface
- [x] 2.1 `features/rbac/RolesAdmin` — roles overview cards + permission matrix `<table>` (caption/scope, check/x icons, read-only)
- [x] 2.2 `[locale]/admin/roles/page.tsx` renders `<RolesAdmin />`

## 3. Wiring
- [x] 3.1 i18n `rbac.*` (en/vi): title/subtitle/section labels, role names, permission labels, granted/notGranted

## 4. Verify
- [ ] 4.1 eslint clean + JSON valid (build/tsc skipped per task scope)
