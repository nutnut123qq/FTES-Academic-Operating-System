## Why

The app shell is still the stripped skeleton nav: a top bar with 3 center links
(Home · Courses · Contact) where Home points at `/home` (404) and Contact points
at `/contact` (404). Meanwhile Courses, Community, Groups, Resources, Profile are
all built and return 200 but are unreachable from the chrome — the app looks empty.
ROADMAP Phase 0 calls for a new app shell (navbar + sidebar) for the multi-domain
product. Chosen layout: **A — persistent left sidebar + top bar** (Linear/Notion),
reusing the house `CollapsibleSidebar`.

## What Changes

- Add a global `AppSidebar` (feature) = primary nav via `CollapsibleSidebar`:
  - top: Home
  - "Học": Courses · Resources
  - "Cộng đồng": Community · Groups
- Mount it in `InnerLayout` beside content, gated OFF on: landing/home, auth, learn,
  and subject-workspace detail (own left rail) — no double rail.
- Top bar: drop the broken center `NavLinks`; keep logo · search · language · theme ·
  notifications · account. Profile/settings/logout stay in the account menu.
- Fix mobile drawer nav to the same real sections (kills the 404 Home/Contact links).
- Add `groups`/`resources` path builders; add `nav.{groups,resources}` + section/
  collapse labels (vi/en).

## Capabilities

### New Capabilities
- `app-shell-nav`: the global left-sidebar + top-bar navigation frame surfacing the
  built domains, gated per route mode.

### Modified Capabilities
- (none)

## Impact
- FE: new `features/app-shell/*`, edits to `InnerLayout`, `Navbar`, `resources/path`,
  i18n. Removes reliance on dead `/home` and `/contact` routes. No BE. Build stays green.
