# dashboard-ui (delta)

## ADDED Requirements

### Requirement: Logged-in dashboard exposes four tabs from the navbar bottom layer

The `/dashboard` route SHALL render a four-tab cockpit — Overview, Explore, Courses, Community —
whose tab strip is registered as the global Navbar's bottom layer rather than drawn inside the page
body. The strip SHALL NOT carry its own bottom border, sticky positioning, z-index or background,
because the Navbar `<header>` already owns the single navbar border and sticky. The registered node
SHALL be referentially stable so it is not re-registered on every render.

#### Scenario: Tab strip renders under the navbar primary row

- **WHEN** the user opens `/dashboard`
- **THEN** the four tabs appear flush under the navbar's primary row with exactly one border below them

#### Scenario: Leaving the dashboard clears the strip

- **WHEN** the user navigates away from `/dashboard`
- **THEN** the navbar bottom layer is cleared and the navbar returns to a single row

### Requirement: Open tab is mirrored to the `?tab=` query without history spam

The dashboard SHALL mirror the open tab into the `tab` query parameter so the view is shareable, and
SHALL adopt a valid `?tab=` value on load and on browser back/forward. Writing the tab back to the
URL SHALL use a replace navigation (no new history entry, no scroll jump), and a URL-driven tab
change SHALL NOT be echoed back to the URL.

#### Scenario: Sharing a deep link opens the right tab

- **WHEN** the user opens `/dashboard?tab=courses`
- **THEN** the Courses tab is selected on first paint

#### Scenario: Switching tabs does not stack history entries

- **WHEN** the user clicks through Overview, Explore and Courses and then presses Back
- **THEN** the browser leaves `/dashboard` instead of stepping back through the visited tabs

#### Scenario: An unknown `?tab=` value is ignored

- **WHEN** the user opens `/dashboard?tab=nonsense`
- **THEN** the default Overview tab stays selected and the query is rewritten to `?tab=overview`

### Requirement: Only the open tab's panel is mounted

The dashboard SHALL mount only the selected tab's panel — closed tabs are unmounted, not hidden with
CSS — so each tab's leaf queries fetch lazily on first open. Each panel SHALL be wrapped in an
element with `role="tabpanel"`, `id="dashboard-panel-<tab>"` and `aria-labelledby="<tab>"` matching
the tab control's id.

#### Scenario: Closed tabs issue no requests

- **WHEN** the user is on Overview and has never opened Community
- **THEN** no Community leaf query has been fetched

### Requirement: Dashboard tabs stay legible and named on mobile

Each dashboard tab SHALL carry a leading icon plus a text label; below the `md` breakpoint the label
SHALL be visually hidden so the strip does not overflow, while the tab SHALL keep its accessible
name for screen readers.

#### Scenario: Narrow viewport shows icons only

- **WHEN** the viewport is narrower than `md`
- **THEN** each tab shows only its icon, and a screen reader still announces the tab's label

### Requirement: Dashboard reuses the existing identity sidebar

The dashboard body SHALL be a centered two-column layout capped at `max-w-6xl` whose left column
reuses the existing `DashboardIdentity` component rather than a duplicated copy, and which collapses
to a single stacked column on mobile.

#### Scenario: Identity persists across tab switches

- **WHEN** the user switches from Overview to Community
- **THEN** the left identity column stays mounted and does not refetch
