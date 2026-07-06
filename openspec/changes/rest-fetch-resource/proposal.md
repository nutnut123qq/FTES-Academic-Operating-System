## Why

The shared REST client (`restRequest`) already serves `challenges`, `course`, `subject`, `identity`, `commerce`, and `community`. The resource domain exposes REST controllers for resources, collections, and interactions, but the frontend currently has no typed REST layer for them. A few generic interactions (content comments, content favorites) are already covered by GraphQL; this change focuses on the resource-specific surface that GraphQL does not serve.

## What Changes

- Reuse `src/modules/api/rest/client/` (`restRequest`, envelope unwrap, bearer token) from previous changes.
- Add a typed REST client for the resource controller cluster under `src/modules/api/rest/resource/` covering:
  - `ResourceController` — catalog, CRUD, upload lifecycle, moderation queue.
  - `CollectionController` — collection CRUD and item management.
  - `InteractionController` — ratings and bookmarks (comments and favorites are skipped because GraphQL already covers them).
- Add `usePost*Swr` mutation hooks for every writing REST endpoint.
- Add `useGet*Swr` query hooks for read endpoints without GraphQL coverage.
- Update `src/modules/api/rest/index.ts` to re-export `./resource`.
- Explicitly document resource/collection endpoints and which GraphQL operations cause skips.
- No new dependencies; no changes to backend or other modules.

## Capabilities

### New Capabilities
- `rest-fetch-resource`: REST client + SWR wrappers for the resource controller cluster, deduplicated against existing GraphQL.

### Modified Capabilities
- None.

## Impact

- New files in `src/modules/api/rest/resource/` and `src/hooks/swr/api/rest/mutations/` (plus query hooks in `src/hooks/swr/api/rest/queries/`).
- One-line change to `src/modules/api/rest/index.ts`.
- No runtime impact until components import the new hooks.
