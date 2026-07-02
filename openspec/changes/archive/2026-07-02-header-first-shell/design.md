## Layout — header-first shell

Flip the archetype-A decision: global nav no longer lives in a persistent left
rail; it lives in the top bar. The left rail is reserved for in-context nav.

### HeaderNav (desktop, `hidden md:flex`)
- **Direct links:** `subjects`, `courses`, `community` (the 3 core domains).
  Active = `bg-accent/10 text-accent`, else muted → hover foreground (matches the
  old sidebar row style).
- **"Explore" mega-menu:** a HeroUI `Popover` (mirrors `NotificationBell`) with a
  `grid-cols-3` panel. Columns = every `useAppNav` group except `top`, with the 3
  primary keys removed and empty groups dropped: Học(Resources·Challenges) ·
  Cộng đồng(Groups·Events·Chat) · Khám phá(AI·For you·Career·Leaderboard·
  Marketplace·Search) · Cá nhân(Activity·Wallet) · Hệ thống(Analytics·Workflow·
  Integrations·Roles). Row = icon + label, closes on click.
- Trigger label reuses `nav.section.explore`.

### Source of truth
`useAppNav` stays the single nav source — HeaderNav (desktop) + the Navbar mobile
drawer both read it, so they never drift. No data duplication.

### Sidebar
`InnerLayout` renders content full-width (no global rail). The only left rail left
is the subject workspace (`SubjectWorkspaceShell`, its own `CollapsibleSidebar`) —
exactly "sidebar only inside a subject workspace". `AppSidebar` deleted (orphaned).

### Not doing
- No change to the mobile drawer, the account menu, or the notification bell
  (bell dropdown already shipped).
- No route/gating changes; subject workspace rail untouched.
