# app-shell-navigation — Delta

## RENAMED Requirements
- FROM: `### Requirement: Header carries exactly four top-level modules as PLAIN LABEL LINKS`
- TO: `### Requirement: Header carries exactly five top-level modules as PLAIN LABEL LINKS`

- FROM: `### Requirement: Mobile drawer mirrors the four plain-link modules`
- TO: `### Requirement: Mobile drawer mirrors the five plain-link modules`

## MODIFIED Requirements

### Requirement: Header carries exactly five top-level modules as PLAIN LABEL LINKS

The application header SHALL present exactly five top-level navigation modules, in order: **Home** (`/`), **Workplace** (`/subjects`), **Course** (`/courses`), **Community** (`/community`), **Blog** (`/blog`). Each module SHALL be a **plain label link** that navigates to its module landing route on click. The header SHALL NOT render any dropdown, caret/chevron, hover sub-menu, click sub-menu, or mega-menu for any module. Nested features are reached from INSIDE each module's own landing page, not from the header.

#### Scenario: Five plain-link modules render on desktop

- **GIVEN** a desktop viewport (≥ md)
- **WHEN** any page renders
- **THEN** the header center shows exactly Home, Workplace, Course, Community, Blog in that order as plain label links, with no caret and no dropdown

#### Scenario: Clicking a module navigates to its landing page

- **GIVEN** the user is on any page
- **WHEN** they click the "Blog" label
- **THEN** the router navigates to `/blog` (the localized blog listing page)
- **AND** no sub-menu or dropdown opens at any point

#### Scenario: Hover shows nothing beyond the label

- **GIVEN** a desktop pointer user on any page
- **WHEN** they hover any header module (Home, Workplace, Course, Community, or Blog)
- **THEN** no dropdown, mega-menu, or sub-menu appears — the module is a plain link only

### Requirement: Mobile drawer mirrors the five plain-link modules

On mobile viewports the drawer SHALL present the same five modules (Home, Workplace, Course, Community, Blog) as **plain link rows** — no accordion groups, no per-module children list. Tapping a module row SHALL navigate to that module's landing route and close the drawer. Language and theme controls SHALL remain in the drawer.

#### Scenario: Drawer shows five plain links

- **GIVEN** a mobile viewport with the drawer open
- **WHEN** the drawer renders
- **THEN** it shows exactly five plain link rows (Home, Workplace, Course, Community, Blog) with no accordion and no nested children
- **AND** tapping "Blog" navigates to `/blog` and closes the drawer
- **AND** the language and theme rows remain present

### Requirement: Single source of truth for navigation data

The desktop header and the mobile drawer SHALL both consume one shared navigation hook (`useAppNav`) as the source of the five modules. Since the header renders plain links, `useAppNav` SHALL expose, for the header, the five modules with `{ key, label, icon, path }` — the header does NOT consume any per-module `children` list. No consumer SHALL hardcode its own module list.

#### Scenario: Desktop and mobile render the same five modules

- **GIVEN** the shared nav source defines the five modules
- **WHEN** both the desktop header and the mobile drawer render
- **THEN** both show the same five modules (Home, Workplace, Course, Community, Blog) with the same labels, paths, and order, as plain links

### Requirement: Active state highlights by route prefix

The header SHALL highlight the module whose subtree contains the current route: a module is active when the pathname equals or is prefixed by its own path (or by a path belonging to a feature that lives inside that module's section). Home SHALL be active only on the exact home path. The Blog module SHALL be active on `/blog` and every route under it (e.g. `/blog/<slug>`).

#### Scenario: Child route lights up its module

- **GIVEN** the user is on `/resources/some-item` (a feature inside the Workplace section)
- **WHEN** the header renders
- **THEN** the Workplace label shows the active style (and Home, Course, Community, Blog do not)

#### Scenario: Blog article lights up the Blog tab

- **GIVEN** the user is reading `/blog/some-article-slug`
- **WHEN** the header renders
- **THEN** the Blog label shows the active style (and Home, Workplace, Course, Community do not)

#### Scenario: Home active only on exact home

- **GIVEN** the user is on `/subjects`
- **WHEN** the header renders
- **THEN** Home is NOT active even though `/` prefixes every path
