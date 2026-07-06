## Why

After wiring the challenges and course REST clusters, the subject domain is the next core area that needs typed REST clients so the frontend can call catalog management, workspace links, membership actions, and statistics without each feature inventing its own HTTP layer.

## What Changes

- Reuse `src/modules/api/rest/client/` (`restRequest`, envelope unwrap, auth header).
- Add typed REST clients for the subject cluster under `src/modules/api/rest/subject/` covering:
  - `SubjectCatalogController` (create/update/publish/archive, prerequisites, related subjects).
  - `WorkspaceController` (workspace read, curated links CRUD).
  - `MembershipController` (my subjects, join/leave, members list, role change, ban).
  - `StatisticsController` (subject statistics).
- Add `usePost*Swr` mutation hooks for every writing endpoint.
- Update `src/modules/api/rest/index.ts` to re-export `./subject`.
- Document GraphQL overlap: no subject queries/mutations are consumed by the FE GraphQL layer yet, so no endpoints are skipped for that reason.
- No new dependencies; no changes to backend or other modules.

## Capabilities

### New Capabilities
- `rest-fetch-subject`: REST client + SWR wrappers for the subject controller cluster.

### Modified Capabilities
- None.

## Impact

- New files in `src/modules/api/rest/subject/` and `src/hooks/swr/api/rest/mutations/`.
- One-line change to `src/modules/api/rest/index.ts`.
- No runtime impact until components import the new hooks.
