## Why
The subject-workspace Overview tab was a placeholder shortcut grid. A Subject
Workspace is a community you JOIN (not a course you buy) — the overview should feel
like a hub: recent discussion + entry points to resources and challenges. Rebuild it
per the approved brainstorm direction A.

## What Changes
- New feature `SubjectOverview`; the overview `page.tsx` becomes a thin mount shell.
- Two-column community hub inside the existing shell: a "you've joined" banner, the
  discussion feed (pinned moderator post + recent posts) on the left, and shortcut
  rails (new resources, featured challenges, active members) on the right.
- Mock `useQuerySubjectOverviewSwr` (stats, pinned + recent posts, resources,
  challenges, active members). i18n `subjects.overview.*` (vi/en). AsyncContent + skeleton.

## Capabilities
### New Capabilities
- (none)
### Modified Capabilities
- `subject-workspace-overview`: from a shortcut grid to a community hub.

## Impact
FE only. No BE — mock hook; compose + shortcut rows navigate / are no-ops. Build stays green.
