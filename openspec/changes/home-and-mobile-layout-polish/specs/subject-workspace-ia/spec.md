# subject-workspace-ia (delta)

## ADDED Requirements

### Requirement: Below `md` the workspace rail becomes a scrolling tab strip

Below the `md` breakpoint the subject workspace rail SHALL be dropped from the layout entirely — not
merely collapsed — so the tab content gets the full phone width. Even collapsed, a rail column keeps
taking horizontal space the content needs.

The same destinations SHALL be reachable from a horizontal tab strip pinned above the content: one
underline tab group laid out at its natural width inside a horizontally scrolling container, so the
labels scroll rather than being squeezed. Labels SHALL stay visible — the strip SHALL NOT use an
icon-only mode, which is exactly what drops labels at this breakpoint.

The strip is a controlled tab group and SHALL derive its selected key from the active route, falling
back to the overview tab when the current page is outside the rail (for example the AI hub).

From `md` upwards the sticky rail SHALL be unchanged.

#### Scenario: Phone viewport

- **GIVEN** a viewport below `md`
- **WHEN** the subject workspace renders
- **THEN** no rail column occupies width, and a horizontally scrolling tab strip with visible labels
  sits above the content

#### Scenario: Selecting a tab on a phone

- **WHEN** the visitor picks a tab in the strip
- **THEN** the workspace navigates to that segment and the strip marks it selected

#### Scenario: Page outside the rail

- **WHEN** the visitor is on a workspace page that no rail row points to
- **THEN** the strip falls back to marking the overview tab rather than rendering with no selection

#### Scenario: Desktop unchanged

- **GIVEN** a viewport at `md` or wider
- **WHEN** the workspace renders
- **THEN** the collapsible sticky rail renders as before and the strip is not shown
