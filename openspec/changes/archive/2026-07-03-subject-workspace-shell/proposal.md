## Why

Subject Workspace (§3) is the core domain and has no FE yet. This ships the SHELL —
the navigation frame every subject area lives in — using the chosen layout
(A · sidebar rail). FE-only with mocked subject data until the BE contract lands.

## What Changes

- Add route `/[locale]/subjects/[subjectId]` + layout mounting a sidebar-rail shell.
- Left `CollapsibleSidebar`: 9 areas in 3 separator-divided clusters (Học · Cộng đồng · Insight).
- Content region: subject identity header (code · name · credits · difficulty · progress) + active tab.
- Overview tab = hub grid of shortcuts (direction C); other 8 areas = navigable placeholders.
- Mock `useQuerySubjectSwr`; i18n `subjects.*` (vi/en).

## Capabilities

### New Capabilities
- `subject-workspace-shell`: the sidebar-rail navigation frame + subject header for a subject workspace.

### Modified Capabilities
- (none)

## Impact
- FE: new `features/subject/*`, route tree under `app/[locale]/subjects`, i18n. No BE. Build stays green.
