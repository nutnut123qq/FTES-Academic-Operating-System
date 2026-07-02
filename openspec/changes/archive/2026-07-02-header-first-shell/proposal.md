## Why

The global left sidebar (`AppSidebar`) showed on every app page, but the header
was near-empty and the sidebar duplicated the whole nav. Decision: make the shell
**header-first** — global nav lives in the top bar; the left sidebar is reserved
for in-context navigation (the subject workspace rail). Frees content width and
matches the GitHub-style pattern (top bar global · sidebar only inside a space).

## What Changes

- New `Navbar/HeaderNav` (desktop): 3 core links (Subjects · Courses · Community)
  + a single "Explore" mega-menu (Popover, 3-col) holding every other domain
  grouped by section (Học · Cộng đồng · Khám phá · Cá nhân · Hệ thống). Reads the
  shared `useAppNav`.
- `InnerLayout`: remove the global sidebar branch — content renders full-width.
  The subject workspace keeps its own rail (`SubjectWorkspaceShell`), unchanged.
- Delete the now-orphaned `features/app-shell/AppSidebar`.
- Notifications already live as a header bell dropdown (`NotificationBell`) and
  are no longer a sidebar row — no change needed here.
- Mobile: the hamburger drawer (same `useAppNav` source) is unchanged.

## Capabilities

### New Capabilities
- (none — restructures the existing app-shell nav)

### Modified Capabilities
- `app-shell-nav`: primary nav moves from a global left rail to a header
  (links + Explore mega-menu); sidebar becomes context-only.

## Impact
- FE: new `Navbar/HeaderNav`, edits to `Navbar`, `InnerLayout`; delete `AppSidebar`.
  `useAppNav` unchanged (still the single source for HeaderNav + mobile drawer).
  No BE. tsc/eslint/webpack build green.
