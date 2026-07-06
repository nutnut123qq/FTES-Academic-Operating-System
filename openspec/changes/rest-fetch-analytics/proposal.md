## Why

The shared REST client rollout continues. The analytics backend exposes two REST controllers (`DashboardController`, `ExportController`) under `/api/v1/analytics`, but the frontend currently has no typed REST coverage for analytics dashboards or CSV exports. This change adds a typed REST client and SWR hooks for those endpoints.

## What Changes

- Add a typed REST module `src/modules/api/rest/analytics/` exposing `DashboardController` and `ExportController`.
- Add SWR query hooks for dashboard list/data, export job status, and export download.
- Add an SWR mutation hook for requesting an analytics export.
- Prefix all exported analytics types with `Analytics` to avoid barrel collisions with other REST modules.
- Export the analytics module from `src/modules/api/rest/index.ts`.

## Capabilities

### New Capabilities
- `rest-fetch-analytics`: Typed REST client + SWR hooks for analytics dashboards and exports.

### Modified Capabilities
- None.

## Impact

- New files in `src/modules/api/rest/analytics/` and `src/hooks/swr/api/rest/{queries,mutations}/`.
- One-line barrel update in `src/modules/api/rest/index.ts`.
- No backend changes, no new dependencies, no changes to existing GraphQL code.
