## Why

The web frontend needs typed REST clients and SWR hooks for the backend Workflow module (`WorkflowController`) so that workflow definitions, instances, moderation queue, and review actions can be built on the shared REST infrastructure.

## What Changes

- Add a new REST module `src/modules/api/rest/workflow` with typed DTOs and call functions for `WorkflowController` (`/api/v1/workflow`).
- Add SWR query hooks in `src/hooks/swr/api/rest/queries/` for read endpoints.
- Add SWR mutation hooks in `src/hooks/swr/api/rest/mutations/` for write endpoints.
- Re-export the new module from `src/modules/api/rest/index.ts`.
- Prefix all exported types with `Workflow*` to avoid collisions in the top-level barrel.
- Skip endpoints already covered by GraphQL operations and document skips in `design.md`.

## Capabilities

### New Capabilities

- `workflow-rest-client`: REST client + SWR hooks for workflow definitions, instances, queue, claims, transitions, and resubmission under `/api/v1/workflow`.

### Modified Capabilities

- None (this change only wires new REST consumers; it does not alter existing product requirements).

## Impact

- Affected code: `src/modules/api/rest/workflow/*`, `src/modules/api/rest/index.ts`, `src/hooks/swr/api/rest/queries/*`, `src/hooks/swr/api/rest/mutations/*`.
- No new runtime dependencies; reuses `restRequest` and SWR patterns already in the repo.
- No backend changes.
