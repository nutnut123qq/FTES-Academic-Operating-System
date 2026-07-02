## Layout — archetype A (sidebar rail), applied globally

Reuse the house shell pattern (see `decision/sidebar.md`): a top navbar (4rem) +
sticky left `CollapsibleSidebar`, ONE scroll context (body scrolls, rail sticks
under the navbar). Mirrors `SubjectWorkspaceShell` but at the app level.

### Nav groups (only real, 200-status routes)
| Group | Items | Route |
|-------|-------|-------|
| (top, no label/divider) | Home | `/` |
| Học | Courses · Resources | `/courses` · `/resources` |
| Cộng đồng | Community · Groups | `/community` · `/groups` |

- **Subjects deferred:** `/subjects` has no list page (404) — Subject Workspace is a
  Phase 1 task. Omit from nav rather than ship a dead link.
- **Profile deferred to account menu:** avoids a forbidden 1-item sidebar group
  (`decision/sidebar.md`: no 1-item group). Already lives under the avatar dropdown.
- **Admin deferred:** role-gating is a Phase 0 RBAC task; `/admin` stays reachable
  directly. Don't build role state here.

### Sidebar gating (InnerLayout)
Show `AppSidebar` on app pages; hide when the route is landing/auth/learn or a
subject-workspace detail (its own left rail). Reuse the existing `usePathname`
(locale-included) style already in `InnerLayout` for `showFooter`.

- hide if: root/`/home`, `…/authentication/…`, contains `/learn`, or
  `…/subjects/<id>…`.

### Shared nav source
One `useAppNav()` hook returns the groups (key · label · icon · path · isActive) so
`AppSidebar` (desktop rail) and the Navbar mobile drawer render from the SAME list —
no drift (the skeleton duplicated its list across NavLinks + MobileNavbar + Navbar).

### Blocks / canon
- `CollapsibleSidebar` + `SidebarNavGroup` (divider between groups) + `SidebarNavItem`
  (active = `bg-accent/10 text-accent`, the only filled state). Feature owns
  data/active-route/navigation; blocks own styling (3-tier law).
- `usePathname`/`useRouter` from `@/i18n/navigation` (locale-stripped) → paths built
  locale-less via `pathConfig().locale()`.
- Empty/collapsed/a11y/dark all inherited from the blocks.

### Not doing
- No route-level restructure of existing shells (profile/community/groups keep tabs).
- No new landing/contact pages here (separate task).
