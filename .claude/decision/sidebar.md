# Decision — sidebar

When & WHY we choose/shape the **sidebar** block. A decision log: for a given scenario, which component we
picked and the reasoning — so next time we design a sidebar, we reuse the house's logic instead of guessing.
Collapsible nav rail + its groups/items.

**StarCi blocks in this family:** `CollapsibleSidebar`, `SidebarNavGroup`, `SidebarNavItem`

> Grows automatically: at the END of each `/starci-fe-ux-apply`, the decision for this block (scenario →
> choice → why) is appended below. No manual command.

## Design baseline (from rules + design — 2026-06-21)

Distilled from `starci-navigation.md` + `03-layout-archetypes.md`.

**Nav row primitive**
- Each nav/menu/sidebar row = HeroUI `Link` (`onPress` for client-route / `href`) — text-with-action = Link. NEVER wrap each row in a 1-item `ListBox selectionMode="single"` + single `ListBox.Item`.
- Why: `ListBox.Item` carries its own hover/focus/selected grey chrome (`bg-default`); a focused/hovered item shows grey that competes with the accent active highlight → "fake consistency" (looks clean only because nothing is focused yet). Wrong primitive drags its own state chrome along.
- The ONLY filled state = `isActive` → `bg-accent/10 text-accent`. Hover = faint tint `hover:bg-default/40`; focus = ring `focus-visible:outline`, NOT a fill. Don't let the primitive add its own selected/focus fill.
- A real `ListBox` is only for ONE multi-select list → one `ListBox` wraps ALL items (+`Section`); don't split into one-listbox-per-row.
- Block: `blocks/navigation/SidebarNavItem` (Link, only-active-filled).

**Collapsible rail (block `CollapsibleSidebar`)**
- Collapse = ICON-ONLY rail (ALWAYS render nav, never unmount): item drops label, keeps centered icon, `aria-label` keeps a11y. Collapsed item = `p-0!` (override HeroUI `list-box-item` padding recipe so icon sits flush — same specificity needs `!`, Tailwind v4 suffix `!`).
- Collapse state shared down to rows via block-family React context (`CollapsibleSidebar/context` → `useSidebarCollapsed`) — block-internal chrome, NOT a store. Collapsed row → `justify-center gap-0`, drop label.
- Separate groups with FULL-WIDTH `Separator` (`SidebarNavGroup divider`), NOT an uppercase caption group-label as the divider. Group label = optional, hidden when collapsed.
- A 1-item group does NOT get its own divider (looks like crumbs) → merge stray items into one trailing group (e.g. bookmarks + membership).
- Rail width ≥4rem (icon centering); padding shrinks on collapse (`pr-2` vs `pr-6`).
- Collapse/expand animates IN PLACE via framer-motion (NOT a Drawer — Drawer is only for context-separating overlays that cover content); respect `useReducedMotion`; persist to localStorage.

**Shell "sidebar + content" = ONE scroll context, sidebar STICKY**
- One page = one scroll context = body/page. App-shell (`InnerLayout`) already lets the body scroll → do NOT build a viewport-locked region (`h-[calc(100dvh-…)] overflow-hidden`) with an inner `overflow-y-auto` pane. Two nested scroll containers = overscroll-chain / jitter (esp. trackpad); excess body height = stray scrollbar.
- Sidebar = `position: sticky`, NOT own-scroll of the whole region: `shrink-0 md:sticky md:top-16 md:h-[calc(100dvh-4rem)]` (sticks below the 4rem navbar). Content `flex-1` floats in page scroll (no own `overflow`). If the nav itself is longer than the viewport → scroll just the nav internally via `ScrollShadow`, don't lock the whole page. (GitHub/Linear settings pattern.)

**No per-page back arrow when sidebar + breadcrumb exist**
- A page inside a layout WITH sidebar + breadcrumb → do NOT add a per-page back arrow. Header = just title + subtitle (`Typography`). One clear escape beats two duplicates (back "to Profile" ≡ the breadcrumb's "Profile" link).
- Per-page back only fits a linear flow WITHOUT a sidebar (or mobile when sidebar is hidden). If truly needed: `onBack` → a FIXED parent (not `router.back()`) + clear `aria-label`, and drop the breadcrumb to avoid duplication.
- `reuseable/SubPageHeader` = LEGACY broken-rule (`@gravity-ui`, `<div>+text-class`, `gap-1.5`) → replace with a clean block when touched, eventually delete.

**Learn-shell sidebar (archetype B)** — `ListBox` + `ScrollShadow`, active row `text-accent bg-accent/10`; this view often renders dark.

## Decisions (newest first)

### 2026-07-02 — Header-first shell: global nav → top bar; sidebar = context-only (reverses the entry below)
- **Scenario:** the global `AppSidebar` (see next entry) showed on every app page while the header sat
  near-empty. User: sidebar should appear ONLY inside a subject workspace; the header should carry the
  important nav.
- **Chose:** move global nav into the top bar. New `Navbar/HeaderNav` = 3 core links (Subjects · Courses ·
  Community) + one **"Explore" mega-menu** (HeroUI `Popover`, `grid-cols-3`) holding every other domain
  grouped by section, read from the SAME `useAppNav`. `InnerLayout` renders content full-width; the only
  left rail left is the subject workspace's own `SubjectWorkspaceShell`. Deleted the orphaned `AppSidebar`.
- **WHY:** a persistent global rail duplicated the whole nav and ate 16rem on every page; a "space" product
  (subject-first) reads better as GitHub-style — top bar global, left rail only *inside* a space. `useAppNav`
  stays the single source (HeaderNav desktop + mobile drawer) so nothing drifts.
- **Note:** this REVERSES the 2026-07-02 archetype-A decision below (global CollapsibleSidebar as primary
  nav). Keep the mobile hamburger drawer + notification bell dropdown as-is.
- **Files:** NEW `Navbar/HeaderNav/index.tsx`; edited `Navbar/index.tsx`, `app/InnerLayout.tsx`; DELETED
  `features/app-shell/AppSidebar`. OpenSpec `header-first-shell`. tsc/eslint/webpack build green.

### 2026-07-02 — Global app shell = `CollapsibleSidebar` as PRIMARY nav (archetype A), gated per route
- **Scenario:** app chrome was still the stripped skeleton — top bar with 3 center links (Home→`/home`
  404 · Courses · Contact→`/contact` 404); Community/Groups/Resources/Profile were all built (200) but
  unreachable → app looked empty. ROADMAP Phase 0 "App shell mới". User chose direction A (left sidebar +
  top bar) over B (top dropdowns) / C (GitHub hybrid).
- **Chose:** a feature `features/app-shell/AppSidebar` composing the house `CollapsibleSidebar` +
  `SidebarNavGroup` + `SidebarNavItem` as the GLOBAL primary nav, mounted in `InnerLayout` beside content
  (same sticky one-scroll rail as `SubjectWorkspaceShell`). Groups: (top, no label) Home · "Học" Courses·
  Resources · "Cộng đồng" Community·Groups.
- **WHY these rules held:**
  - **Never ship a dead nav row.** Dropped **Subjects** (its `/subjects` list is 404 until Phase 1) and
    **Admin** (needs RBAC role state). Nav only lists routes that return 200.
  - **No 1-item group** ([[sidebar]] baseline) → **Profile stays in the account-menu dropdown**, not a
    lone sidebar group. Home sits alone in the unlabelled top group (no divider → not a "crumb").
  - **No double rail.** `InnerLayout` gates the sidebar OFF on landing/home (marketing+footer), auth,
    learn, and subject-workspace detail (own left rail) — mirrors the existing `showFooter` regex style.
  - **One nav source, not three.** The skeleton duplicated its item list across NavLinks + MobileNavbar +
    Navbar drawer → drift + the 404s lived in all three. Extracted `features/app-shell/useAppNav` (groups:
    key·label·icon·path·isActive) consumed by BOTH `AppSidebar` and the Navbar mobile drawer.
- **Deleted dead** on the way (deletion over addition): `features/navbar/Navbar/{NavLinks,MobileNavbar,types}`
  (NavLinks orphaned once the sidebar owned primary nav; MobileNavbar was already only self-referenced).
  Also noticed `components/layouts/shell/Navbar/*` is a fully-dead duplicate tree — flagged, not deleted
  (out of this change's scope).
- **Files:** NEW `features/app-shell/{useAppNav.tsx,AppSidebar/index.tsx}`; edited `app/InnerLayout.tsx`
  (gate + flex row), `features/navbar/Navbar/index.tsx` (drop NavLinks, drawer→useAppNav),
  `resources/path/index.ts` (`groups`/`resources` builders), `messages/{en,vi}.json`
  (`nav.{groups,resources,section.*}`). OpenSpec `app-shell-nav`. tsc/eslint/webpack-build all green.

### 2026-06-21 — Deleted the "StarCi AI" learn page entirely (meaningless)
- **Scenario:** `/learn/starci-ai` was a nav row + full route, but the page only rendered the **AI
  balancer key-pool health** (per-provider `totalKeys/activeKeys/disabledKeys` from `aiBalancerHealth`) +
  a model-routing card — an **ops/admin** surface with zero value to a learner. Teacher: "resign... vô
  nghĩa quá" → then "xóa luôn đi".
- **Chose:** delete the whole feature, not redesign. Scanned the BE first (rich AI surface exists —
  `myAiQuota` unified credit pool, `myAiSettings`/BYOK, `aiSubscriptionTiers`, AI Lab playground/eval,
  `askContentAi`) and confirmed the *learner-facing* AI value already lives elsewhere (content-AI FAB +
  profile AI settings/credit per [[credit-unified-pool-ui]]). The learn-rail "StarCi AI" was the leftover
  admin view → removed.
- **Blast radius (mapped before deleting):** `git rm` the route folder (`app/.../learn/starci-ai/`) + the
  feature (`features/learn/StarciAi/`); removed `SidebarTab.StarciAi` (sidebar slice), the `starciAi()`
  path builder + its export (`resources/path`), the nav item (`useSidebarNavItems`, dropped now-unused
  `SparkleIcon` import), and the dead `starciAi` i18n blocks (vi+en — JSON re-validated). Verified `grep
  StarciAi src` is code-clean (only a planning .md mentions it); eslint EXIT 0.
- **Regroup gotcha (the [[one-progress-bar-at-a-time]] "no 1-item group" rule again):** the old **`more`**
  cluster was `[Bảng xếp hạng · StarCi AI]`. Removing StarCi AI would leave leaderboard **alone** → a
  forbidden 1-item group. Fix: moved leaderboard into the **`practice`** cluster and dropped `"more"` from
  the `LearnNavGroup` union + `GROUP_ORDER`. Rail is now **2 clusters**: study (mind-map · modules ·
  foundations) · practice (flashcards · luyện · personal-project · leaderboard).
- **Files:** deleted 2 folders; edited `redux/slices/sidebar.ts`, `resources/path/index.ts`,
  `LearnShell/{hooks/useSidebarNavItems.ts,types/index.ts,LearnSidebar/index.tsx}`, `messages/{vi,en}.json`.

### 2026-06-20 — One shared rail block `OutlineRail` (content-map ≡ milestone rail)
- **Scenario:** the personal-project right rail (`MilestoneOutline`) had drifted from the polished lesson
  content-map (`ContentMap`): no progress header / continue, all groups force-expanded, a bespoke verbose
  row dumping a 3-line description per task. Teacher: "render content map **y chang**".
- **Chose (direction #2 — generalize, not just clone):** extract the content-map shell into ONE props-only
  block **`blocks/navigation/OutlineRail`** and render BOTH rails through it. Contract = `{ header?, search,
  groups[{title, progress, collapsedCountLabel, items[ContentMapRow-shaped]}], expandedKeys,
  onExpandedChange, async }`. Rows reuse the existing `ContentMapRow` block. Fully **controlled** (feature
  owns search value + expanded-set + every i18n string); block owns the look.
- **WHY:** two rails that merely *look* alike drift again; one block fed by two data-mappers can't. Future
  rails inherit it free. Header is **optional** so a rail can hide it while loading (content-map does).
- **Migration order = the guardrail:** built the block → migrated `ContentMap` to a thin wrapper FIRST and
  kept it **byte-identical** (regression check the working lesson rail) → only then wrapped `MilestoneOutline`.
- **Milestone mapping:** milestones→groups (progress = tasks done/total), tasks→`ContentMapRow` items
  (`isRead`=completed, `isLocked`=`!isTaskUnlocked`, **descriptions dropped** — they live in the brief),
  header = tasks-done `ProgressMeter` + "Về bài hiện tại" → `currentTask` (hidden when already current).
- **Layout integration gotcha:** `OutlineRail`'s root is unconditionally `flex` → it can't also be the
  `hidden lg:block` visibility element. Fix: the rail's wrapper (here the layout's `milestoneRailClass`,
  changed `lg:block`→`lg:flex lg:flex-col lg:h-[calc(100dvh-4rem)]`) owns visibility+bounded height; the
  block is the `lg:flex-1 min-h-0` child whose internal `ScrollShadow` scrolls — exactly how `ContentMap`
  nests inside `ResizableRail`.
- **Files:** NEW `blocks/navigation/OutlineRail/index.tsx` (+ barrel); `ContentMap/index.tsx` → wrapper;
  `MilestoneOutline/index.tsx` → wrapper (search+controlled-expand added); `learn/layout.tsx`
  (`milestoneRailClass` → flex col). **Deleted dead:** `MilestoneAccordion/` (+`MilestoneTaskRow`),
  `MilestoneTaskSearch/` (fancy Autocomplete typeahead — replaced by the inline content-map filter), and the
  now-orphaned `MilestoneOutline/{map.tsx,enums/,utils/}` status helpers.
- **Verify:** auth+enrollment-gated route → tsc + eslint clean; eyeball both rails (lesson + personal-project)
  on the running server, confirm the lesson rail is unchanged.

### 2026-06-21 — Course-learn rail ("Mục lục khoá học")
- **Scenario:** the left course nav was a **flat list of 9 items** (Sơ đồ tư duy, Học phần, Nền tảng,
  Headhunting, Ôn tập, Luyện thuật toán, Dự án cá nhân, Bảng xếp hạng, StarCi AI) — no visual grouping.
- **Chose (direction A):** group the rows into **3 separator-divided clusters** via `SidebarNavGroup divider`
  (no uppercase caption — the separator IS the divider), and **remove Headhunting** from the course rail
  (it's a career feature, not course-study). Clusters: **study** (Sơ đồ tư duy · Học phần · Nền tảng) ·
  **practice** (Ôn tập · Luyện thuật toán · Dự án cá nhân) · **more** (Bảng xếp hạng · StarCi AI).
- **WHY:** thầy chốt A — gọn, quét nhanh; Headhunting bỏ ra cho rail tập trung vào học. Grounded the rail
  baseline (separator divides groups, never a caption; no 1-item group).
- **Gotcha hit:** dropping Headhunting left "community" as a lone Bảng xếp hạng → would be a **1-item group
  (forbidden)**, so leaderboard + StarCi AI were merged into one trailing `more` cluster.
- **Files:** `LearnShell/types/index.ts` (`LearnNavGroup` + `group` field), `hooks/useSidebarNavItems.ts`
  (removed headhunting, tagged each row with its group), `LearnSidebar/index.tsx` (render `GROUP_ORDER` →
  one `SidebarNavGroup divider={index>0}` per cluster). The grey fill seen on a non-active row is the legit
  HOVER tint (`SidebarNavItem` is already the only-active-filled `Link`) — left as-is, not a bug.
- **⚠️ Flag:** Headhunting route still exists but is now unlinked from this rail — make sure it's reachable
  from the global/account nav so it isn't orphaned.
- **Gotcha (caught live):** when adding a required discriminator (`group`) to a nav-items array that the
  render then `filter`s on, tag **EVERY** item — a missed one becomes `undefined`, matches no group, and the
  row silently **vanishes** (TS didn't catch it: project type-check is relaxed). Verify the rendered count
  equals the item count after a grouping change.

## Gotchas
_(empty)_
