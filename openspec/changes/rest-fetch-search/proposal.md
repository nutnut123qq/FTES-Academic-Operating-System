## Why

The shared REST client (`restRequest`) already serves `challenges`, `course`, `subject`, `identity`, `commerce`, `community`, `resource`, `gamification`, `notification`, `profile`, `wallet`, `blog`, `career`, and `event`. The search domain exposes two REST controllers in `vn.ftes.aos.search.web` — `SearchController` for global search and query suggestions, and `AdminReindexController` for reindex jobs. The frontend currently has no typed REST layer for search, and the existing GraphQL autocomplete query only covers a shallow global autocomplete, not full search/suggest/reindex.

## What Changes

- Reuse `src/modules/api/rest/client/` (`restRequest`, envelope unwrap, bearer token) from previous changes.
- Add a typed REST client under `src/modules/api/rest/search/` covering:
  - `SearchController` — global search (`GET /api/v1/search`) and query suggestions (`GET /api/v1/search/suggest`).
  - `AdminReindexController` — trigger reindex (`POST /api/v1/admin/search/reindex`) and job status (`GET /api/v1/admin/search/reindex/{jobId}`).
- Add `useGet*Swr` query hooks for the read endpoints.
- Add `usePost*Swr` mutation hooks for the reindex write endpoint.
- Update `src/modules/api/rest/index.ts` to re-export `./search`.
- No new dependencies; no changes to backend or other modules.

## Capabilities

### New Capabilities
- `rest-fetch-search`: REST client + SWR wrappers for the search web controller cluster.

### Modified Capabilities
- None.

## Impact

- New files in `src/modules/api/rest/search/` and `src/hooks/swr/api/rest/mutations/` (plus query hooks in `src/hooks/swr/api/rest/queries/`).
- One-line change to `src/modules/api/rest/index.ts`.
- No runtime impact until components import the new hooks.
