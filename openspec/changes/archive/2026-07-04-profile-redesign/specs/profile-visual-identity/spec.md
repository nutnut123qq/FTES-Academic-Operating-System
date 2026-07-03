## ADDED Requirements

### Requirement: Profile page uses a two-column layout with bare identity sidebar
The profile page SHALL render a two-column layout on desktop: a bare (no card) identity sidebar on the left and a content area on the right.

#### Scenario: Desktop viewport
- **WHEN** the user visits `/profile` or any `/profile/*` tab
- **THEN** the identity column is visible as a static sidebar without a card border
- **AND** the active tab content renders in the right column

#### Scenario: Mobile viewport
- **WHEN** the viewport is below the `md` breakpoint
- **THEN** the identity sidebar stacks above the tab bar and content

### Requirement: Identity sidebar displays avatar, name, headline, campus, streak, rank, and bio
The identity sidebar SHALL display the user's avatar with a gradient ring, full name, headline, campus, streak chip, rank chip, and bio.

#### Scenario: Data loaded
- **WHEN** profile and gamification data are available
- **THEN** the avatar renders with a gradient ring around the fallback image
- **AND** name, headline, campus, streak, rank, and bio are displayed

### Requirement: Tab navigation uses an underline tab bar
The profile page SHALL use an underline-style tab bar with a clear active indicator instead of a row of separate buttons.

#### Scenario: Tab selection
- **WHEN** the user selects a tab
- **THEN** the active tab shows an accent underline indicator
- **AND** the browser navigates to the corresponding route

### Requirement: Content sections are rendered as labeled cards
Each profile tab SHALL render its content inside labeled cards with the title outside the card.

#### Scenario: Personal tab
- **WHEN** the user views the Personal tab
- **THEN** "About" and "Social links" each render as a `LabeledCard`

#### Scenario: Academic tab
- **WHEN** the user views the Academic tab
- **THEN** academic fields render as metric tiles inside a `LabeledCard`

#### Scenario: Progress tab
- **WHEN** the user views the Progress tab
- **THEN** XP/level, rank/league, heatmap, badges, and skill graph each render as a `LabeledCard`

### Requirement: Social links display brand icons and hover states
Social links in the Personal tab SHALL show a brand icon for each link type and provide a hover state.

#### Scenario: Hovering a social link
- **WHEN** the user hovers over a social link row
- **THEN** the row background changes to a subtle tint
- **AND** the brand icon remains visible

### Requirement: All data-backed regions handle loading, empty, and error states
Every region fed by an SWR hook SHALL render through `AsyncContent` with a layout-matching skeleton and a decent empty/error state.

#### Scenario: First load
- **WHEN** data is loading
- **THEN** a skeleton mirroring the real layout is shown

#### Scenario: Empty data
- **WHEN** data resolves with no items
- **THEN** an `EmptyContent` block is displayed with a title and optional description/action

#### Scenario: Error
- **WHEN** data fails to load
- **THEN** an error state with retry action is displayed

### Requirement: Visual design uses semantic tokens and spacing scale
All visual styling SHALL use the house semantic tokens (`--accent`, `bg-default`, `text-muted`, `border-separator`, etc.) and the spacing scale `0/2/3/6/8`.

#### Scenario: Dark and light mode
- **WHEN** the theme switches between dark and light
- **THEN** the profile page remains readable and visually consistent without hardcoded colors

### Requirement: All copy is internationalized
All new text introduced by the redesign SHALL be added to `messages/vi.json` and `messages/en.json` and referenced via `next-intl`.

#### Scenario: Locale switch
- **WHEN** the user switches locale
- **THEN** all profile labels, buttons, and empty states update to the selected language
