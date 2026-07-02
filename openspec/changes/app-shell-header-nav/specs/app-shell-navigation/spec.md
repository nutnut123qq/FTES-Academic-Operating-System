# app-shell-navigation — Delta Spec

## ADDED Requirements

### Requirement: Header carries exactly four top-level modules

The application header SHALL present exactly four top-level navigation modules, in order: **Home** (`/`), **Workplace** (`/subjects`), **Course** (`/courses`), **Community** (`/community`). Home SHALL be a plain link with no dropdown. Workplace, Course, and Community SHALL each be both a navigable link to their module path AND a trigger for a dropdown of nested features. The header SHALL NOT render any other top-level nav item (the "Explore" mega-menu is removed).

#### Scenario: Four modules render on desktop

- **GIVEN** a desktop viewport (≥ md)
- **WHEN** any page renders
- **THEN** the header center shows exactly Home, Workplace, Course, Community in that order, and no "Explore" item exists

#### Scenario: Module label navigates

- **GIVEN** the user is on any page
- **WHEN** they click the "Workplace" label (not the caret)
- **THEN** the router navigates to `/subjects` without requiring the dropdown to open

### Requirement: Module dropdowns nest all remaining features

Each dropdown SHALL contain exactly the following feature links (icon + label): **Workplace ▾** → Subjects (`/subjects`), Resources (`/resources`), Challenges (`/challenges`), Leaderboard (`/leaderboard`), Workflow (`/workflow`), Analytics (`/analytics`), Career (`/career`); **Course ▾** → Catalog (`/courses`), Marketplace (`/marketplace`); **Community ▾** → Feed (`/community`), Groups (`/groups`), Events (`/events`), Chat (`/chat`). The Workplace dropdown SHALL NOT contain an AI Hub item and the Course dropdown SHALL NOT contain a Recommendations item — those discovery shortcuts relocate to the profile/avatar popup (owned by change `profile-avatar-hub`). The Account menu SHALL additionally contain Activity (`/activity`), Wallet (`/wallet`), Integrations (`/integrations`), Roles (`/admin/roles`) grouped under labeled sections. Search SHALL remain reachable via the header search trigger and Ctrl/Cmd+K. Every destination present in the previous navigation SHALL remain reachable from the header or the profile/avatar popup (no orphaned route).

#### Scenario: Workplace dropdown lists its features

- **GIVEN** a desktop viewport
- **WHEN** the user opens the Workplace dropdown
- **THEN** it lists Subjects, Resources, Challenges, Leaderboard, Workflow, Analytics, Career, each navigating to its route and closing the dropdown on selection
- **AND** no AI Hub item is present in the Workplace dropdown

#### Scenario: Community dropdown surfaces Groups and Events on hover

- **GIVEN** a desktop pointer user on any page
- **WHEN** they hover the Community module to open its dropdown
- **THEN** the dropdown reveals Groups and Events (alongside Feed and Chat), each navigating to `/groups` and `/events` respectively and closing the dropdown on selection

#### Scenario: Course dropdown omits Recommendations

- **GIVEN** a desktop viewport
- **WHEN** the user opens the Course dropdown
- **THEN** it lists only Catalog and Marketplace, and no Recommendations item is present

#### Scenario: Former Explore destinations still reachable

- **GIVEN** the redesigned header
- **WHEN** the user looks for Activity, Wallet, Integrations, or Roles
- **THEN** each is available inside the Account menu under a labeled section, navigating to `/activity`, `/wallet`, `/integrations`, `/admin/roles` respectively

### Requirement: Discovery shortcuts are not header modules

Discovery shortcuts — global AI hub (`/ai`), "For You" (community For You feed), Recommendations (`/recommendations`), and Trending (community trending) — SHALL NOT appear as header navigation modules or as items in any header module dropdown. They SHALL relocate to the profile/avatar popup, whose ownership belongs to change `profile-avatar-hub`. The routes `/ai` and `/recommendations` SHALL remain valid and reachable via that popup, so that no route is orphaned by their removal from the header.

#### Scenario: AI and Recommendations absent from header dropdowns

- **GIVEN** the amended header
- **WHEN** the user opens the Workplace or Course dropdown
- **THEN** neither an AI Hub link (`/ai`) nor a Recommendations link (`/recommendations`) appears in any header dropdown

#### Scenario: Discovery routes remain reachable

- **GIVEN** `/ai` and `/recommendations` are no longer in the header
- **WHEN** the user needs the AI hub or recommendations
- **THEN** both routes stay valid and are reachable from the profile/avatar popup's "Khám phá" section (owned by change `profile-avatar-hub`)

### Requirement: Single source of truth for navigation data

The desktop header, its dropdowns, and the mobile drawer SHALL all consume one shared navigation hook (`useAppNav`) returning a two-level module structure (module → children). No consumer SHALL hardcode its own nav item list.

#### Scenario: Desktop and mobile render the same IA

- **GIVEN** the shared nav source defines the four modules and their children
- **WHEN** both the desktop header and the mobile drawer render
- **THEN** both show the same modules with the same children, labels, paths, and order

### Requirement: Desktop dropdown open and close behavior

A module dropdown SHALL open on trigger click, Enter/Space on the trigger, or pointer hover over the module cluster (with a short close delay to prevent flicker). It SHALL close when: an item is selected, ESC is pressed, focus leaves the menu (blur), the user clicks outside, or another module dropdown opens. At most one dropdown SHALL be open at a time.

#### Scenario: Hover opens, moving away closes

- **GIVEN** a desktop pointer user
- **WHEN** they hover the Course module then move the pointer fully away from trigger and panel
- **THEN** the dropdown opens on hover and closes after the short delay

#### Scenario: ESC closes and restores focus

- **GIVEN** the Community dropdown is open with an item focused
- **WHEN** the user presses ESC
- **THEN** the dropdown closes and focus returns to the Community trigger

#### Scenario: Opening one menu closes another

- **GIVEN** the Workplace dropdown is open
- **WHEN** the user opens the Course dropdown
- **THEN** the Workplace dropdown closes and only the Course dropdown remains open

### Requirement: Active state highlights by route prefix

The header SHALL highlight the module whose subtree contains the current route: a module is active when the pathname equals or is prefixed by its own path or any of its children's paths (Home is active only on the exact home path). Inside an open dropdown, the child matching the current route prefix SHALL also be visually marked active.

#### Scenario: Child route lights up its module

- **GIVEN** the user is on `/resources/some-item`
- **WHEN** the header renders
- **THEN** Workplace shows the active style (and Home, Course, Community do not), and opening Workplace ▾ shows Resources marked active

#### Scenario: Home active only on exact home

- **GIVEN** the user is on `/subjects`
- **WHEN** the header renders
- **THEN** Home is NOT active even though `/` prefixes every path

### Requirement: Mobile drawer mirrors the four module groups

On mobile viewports the drawer SHALL present: a Home link row, then three accordion groups (Workplace, Course, Community). Each group SHALL expand to its module's main link plus its nested children; the group containing the active route SHALL be expanded by default. Selecting any item SHALL navigate and close the drawer. Language and theme controls SHALL remain in the drawer.

#### Scenario: Drawer accordion groups

- **GIVEN** a mobile viewport with the drawer open while on `/groups`
- **WHEN** the drawer renders
- **THEN** it shows Home + three accordion groups, the Community group is pre-expanded with Groups marked active, and tapping Events navigates to `/events` and closes the drawer

### Requirement: Navigation accessibility

The header nav SHALL be an `aria-label`ed `nav` landmark. Each dropdown trigger SHALL expose `aria-expanded` and `aria-haspopup`. Keyboard users SHALL be able to: Tab through module links and triggers, open a menu with Enter/Space, move between items with ArrowUp/ArrowDown, activate with Enter, and dismiss with ESC. All icon-only controls SHALL have accessible names.

#### Scenario: Keyboard-only traversal

- **GIVEN** a keyboard-only user focused on the Workplace dropdown trigger
- **WHEN** they press Enter, then ArrowDown twice, then Enter
- **THEN** the menu opens, focus moves to the second item, and activating it navigates and closes the menu

### Requirement: Navigation labels are localized

All module and feature labels in the header, dropdowns, mobile drawer, and the new Account-menu sections SHALL come from the i18n message catalogs with both Vietnamese and English translations. No nav label SHALL be hardcoded.

#### Scenario: Locale switch relabels nav

- **GIVEN** the header renders in Vietnamese
- **WHEN** the user switches the language to English
- **THEN** every module, dropdown item, drawer group, and account-menu section label renders its English translation

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
