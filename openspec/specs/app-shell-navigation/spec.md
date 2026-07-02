# app-shell-navigation Specification

## Purpose
TBD - created by archiving change app-shell-header-nav. Update Purpose after archive.
## Requirements
### Requirement: Header carries exactly four top-level modules as PLAIN LABEL LINKS

The application header SHALL present exactly four top-level navigation modules, in order: **Home** (`/`), **Workplace** (`/subjects`), **Course** (`/courses`), **Community** (`/community`). Each module SHALL be a **plain label link** that navigates to its module landing route on click. The header SHALL NOT render any dropdown, caret/chevron, hover sub-menu, click sub-menu, or mega-menu for any module (the "Explore" mega-menu is removed, and the previously-designed per-module dropdowns are removed). Nested features are reached from INSIDE each module's own landing page, not from the header.

#### Scenario: Four plain-link modules render on desktop

- **GIVEN** a desktop viewport (≥ md)
- **WHEN** any page renders
- **THEN** the header center shows exactly Home, Workplace, Course, Community in that order as plain label links, with no caret, no dropdown, and no "Explore" item

#### Scenario: Clicking a module navigates to its landing page

- **GIVEN** the user is on any page
- **WHEN** they click the "Workplace" label
- **THEN** the router navigates to `/subjects` (the Workplace landing page)
- **AND** no sub-menu or dropdown opens at any point

#### Scenario: Hover shows nothing beyond the label

- **GIVEN** a desktop pointer user on any page
- **WHEN** they hover any header module (Home, Workplace, Course, or Community)
- **THEN** no dropdown, mega-menu, or sub-menu appears — the module is a plain link only

### Requirement: Nested features live inside each module's page, not the header

The header SHALL NOT enumerate any module's nested features. Each module's landing page SHALL be the entry point for its nested features: Workplace features (Resources `/resources`, Challenges `/challenges`, Leaderboard `/leaderboard`, Workflow `/workflow`, Analytics `/analytics`, Career `/career`) are reached from within the Workplace / subject-workspace pages; Community sub-areas (Groups `/groups`, Events `/events`, Chat `/chat`, plus the feed's own tabs) are reached from within the Community page's own tabs/sub-nav; Course sub-areas (Marketplace `/marketplace`, the catalog itself) are reached from within the Course catalog page. The Account menu SHALL contain the personal/admin destinations Activity (`/activity`), Wallet (`/wallet`), Integrations (`/integrations`), Roles (`/admin/roles`) grouped under labeled sections. Search SHALL remain reachable via the header search trigger and Ctrl/Cmd+K. Every destination present in the previous navigation SHALL remain a valid route reachable from within its section page, the Account menu, the profile/avatar popup, or search (no orphaned route).

#### Scenario: Workplace features reached from inside the Workplace page

- **GIVEN** the header exposes Workplace only as a plain link to `/subjects`
- **WHEN** the user wants Resources, Challenges, Leaderboard, Workflow, Analytics, or Career
- **THEN** those features are reached from within the Workplace / subject-workspace pages, and none of them appears as a header dropdown item

#### Scenario: Community sub-areas reached from inside the Community page

- **GIVEN** the header exposes Community only as a plain link to `/community`
- **WHEN** the user wants Groups, Events, or Chat
- **THEN** they navigate into the Community page and reach Groups (`/groups`), Events (`/events`), and Chat (`/chat`) from that page's own tabs/sub-nav — the header never surfaces them on hover or click

#### Scenario: Migrated destinations still reachable

- **GIVEN** the redesigned plain-link header
- **WHEN** the user looks for Activity, Wallet, Integrations, or Roles
- **THEN** each is available inside the Account menu under a labeled section, navigating to `/activity`, `/wallet`, `/integrations`, `/admin/roles` respectively
- **AND** every former dropdown destination (resources, challenges, leaderboard, workflow, analytics, career, marketplace, groups, events, chat, feed) remains a valid route reachable from inside its section page

### Requirement: Discovery shortcuts are not header modules

Discovery shortcuts — global AI hub (`/ai`), "For You" (community For You feed), Recommendations (`/recommendations`), and Trending (community trending) — SHALL NOT appear as header navigation modules. Because the header has NO dropdowns, they SHALL NOT appear in any header sub-menu either. They SHALL live in the profile/avatar popup, whose ownership belongs to change `profile-avatar-hub`. The routes `/ai` and `/recommendations` SHALL remain valid and reachable ONLY via that popup (and search), so that no route is orphaned by their removal from the header.

#### Scenario: AI and Recommendations absent from the header

- **GIVEN** the amended plain-link header
- **WHEN** the user inspects the header
- **THEN** neither an AI Hub link (`/ai`) nor a Recommendations link (`/recommendations`) appears in the header, and since there are no dropdowns, they cannot appear in any header sub-menu

#### Scenario: Discovery routes remain reachable via the popup

- **GIVEN** `/ai` and `/recommendations` are no longer in the header
- **WHEN** the user needs the AI hub or recommendations
- **THEN** both routes stay valid and are reachable from the profile/avatar popup's "Khám phá" section (owned by change `profile-avatar-hub`)

### Requirement: Single source of truth for navigation data

The desktop header and the mobile drawer SHALL both consume one shared navigation hook (`useAppNav`) as the source of the four modules. Since the header renders plain links, `useAppNav` SHALL expose, for the header, the four modules with `{ key, label, icon, path }` — the header does NOT consume any per-module `children` list. No consumer SHALL hardcode its own module list.

#### Scenario: Desktop and mobile render the same four modules

- **GIVEN** the shared nav source defines the four modules
- **WHEN** both the desktop header and the mobile drawer render
- **THEN** both show the same four modules (Home, Workplace, Course, Community) with the same labels, paths, and order, as plain links

### Requirement: Active state highlights by route prefix

The header SHALL highlight the module whose subtree contains the current route: a module is active when the pathname equals or is prefixed by its own path (or by a path belonging to a feature that lives inside that module's section). Home SHALL be active only on the exact home path.

#### Scenario: Child route lights up its module

- **GIVEN** the user is on `/resources/some-item` (a feature inside the Workplace section)
- **WHEN** the header renders
- **THEN** the Workplace label shows the active style (and Home, Course, Community do not)

#### Scenario: Home active only on exact home

- **GIVEN** the user is on `/subjects`
- **WHEN** the header renders
- **THEN** Home is NOT active even though `/` prefixes every path

### Requirement: Mobile drawer mirrors the four plain-link modules

On mobile viewports the drawer SHALL present the same four modules (Home, Workplace, Course, Community) as **plain link rows** — no accordion groups, no per-module children list. Tapping a module row SHALL navigate to that module's landing route and close the drawer. Language and theme controls SHALL remain in the drawer.

#### Scenario: Drawer shows four plain links

- **GIVEN** a mobile viewport with the drawer open
- **WHEN** the drawer renders
- **THEN** it shows exactly four plain link rows (Home, Workplace, Course, Community) with no accordion and no nested children
- **AND** tapping "Community" navigates to `/community` and closes the drawer
- **AND** the language and theme rows remain present

### Requirement: Navigation accessibility

The header nav SHALL be an `aria-label`ed `nav` landmark whose items are plain links. Because there are no dropdowns, no trigger SHALL expose `aria-haspopup`/`aria-expanded`. Keyboard users SHALL be able to Tab through the four module links and activate each with Enter. All icon-only controls SHALL have accessible names.

#### Scenario: Keyboard-only traversal of plain links

- **GIVEN** a keyboard-only user focused on the header nav
- **WHEN** they Tab across the modules and press Enter on "Course"
- **THEN** focus moves link-to-link (Home → Workplace → Course → Community) and Enter on Course navigates to `/courses`
- **AND** no menu opens because none exists

### Requirement: Navigation labels are localized

All module labels in the header and mobile drawer, and the new Account-menu section labels, SHALL come from the i18n message catalogs with both Vietnamese and English translations. No nav label SHALL be hardcoded.

#### Scenario: Locale switch relabels nav

- **GIVEN** the header renders in Vietnamese
- **WHEN** the user switches the language to English
- **THEN** every module link, drawer row, and account-menu section label renders its English translation

### Requirement: No global left sidebar

The application SHALL NOT render a persistent global left sidebar on any page. The only permitted left rail is the in-context rail owned by `SubjectWorkspaceShell` (subject workspace), which SHALL remain unchanged by this change.

#### Scenario: Pages render without a global sidebar

- **GIVEN** the user visits Home, Course catalog, Community feed, or any non-workspace page
- **WHEN** the page renders
- **THEN** no global left sidebar is present and primary navigation is available only via the header

#### Scenario: Subject workspace keeps its rail

- **GIVEN** the user enters a subject workspace page rendered by `SubjectWorkspaceShell`
- **WHEN** the shell renders
- **THEN** its own left rail renders exactly as before this change

