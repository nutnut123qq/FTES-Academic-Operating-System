## Context

The frontend already consumes many backend domains through the shared REST module pattern (`src/modules/api/rest/<domain>/{client.ts,types.ts,index.ts}`) and SWR hooks. The backend Workflow module exposes `WorkflowController` (`/api/v1/workflow`), which is not yet wired into the frontend. This change follows the established pattern to add the missing clients and hooks.

## Goals / Non-Goals

**Goals:**
- Provide typed REST call functions for every endpoint in `WorkflowController`.
- Provide SWR query and mutation hooks for those endpoints.
- Prefix all exported type names with `Workflow*` to avoid collisions in the top-level `src/modules/api/rest/index.ts` barrel.
- Keep build green (`npx tsc --noEmit` and `npm run build -- --webpack`).

**Non-Goals:**
- No changes to backend code or GraphQL operations.
- No new runtime dependencies.
- No UI components or pages.

## Decisions

- **Single REST module**: All `WorkflowController` endpoints are implemented in one `workflow` REST module.
- **Type prefix**: All exported TypeScript types use the `Workflow*` prefix (e.g., `WorkflowInstanceResponse`, `WorkflowQueueItem`) because the shared barrel flattens many modules.
- **Date strings as ISO strings**: `Instant` from Java is represented as `string` in TypeScript DTOs, consistent with existing REST modules.
- **No GraphQL skips**: The existing GraphQL operations contain no workflow queries/mutations, so no endpoints are skipped.

## Risks / Trade-offs

- **[Risk] Future backend DTO changes drift from frontend types** → Mitigation: types are colocated in one file and follow the backend record shapes closely.
- **[Risk] Exported type names still collide** → Mitigation: strict `Workflow*` prefix enforced for all types; build-time barrel check will catch duplicates.
