## Context

The frontend already consumes many backend domains through the shared REST module pattern (`src/modules/api/rest/<domain>/{client.ts,types.ts,index.ts}`) and SWR hooks. The backend Activity module exposes `ActivityController` (`/api/v1/activities`), which is not yet wired into the frontend. This change follows the established pattern to add the missing clients and hooks.

## Goals / Non-Goals

**Goals:**
- Provide typed REST call functions for every endpoint in `ActivityController`.
- Provide SWR query and mutation hooks for those endpoints.
- Prefix all exported type names with `Activity*` to avoid collisions in the top-level `src/modules/api/rest/index.ts` barrel.
- Keep build green (`npx tsc --noEmit` and `npm run build -- --webpack`).

**Non-Goals:**
- No changes to backend code or GraphQL operations.
- No new runtime dependencies.
- No UI components or pages.

## Decisions

- **Single REST module**: All `ActivityController` endpoints are implemented in one `activity` REST module.
- **Type prefix**: All exported TypeScript types use the `Activity*` prefix (e.g., `ActivityView`, `ActivityReplayResult`) because the shared barrel flattens many modules.
- **Date strings as ISO strings**: `Instant` from Java is represented as `string` in TypeScript DTOs, consistent with existing REST modules.
- **`JsonNode` as `unknown`**: `ActivityView.payload` is typed as `unknown` because its shape is type-specific.
- **No GraphQL skips**: Existing GraphQL feed operations (`query-my-feed`, `query-user-feed`, `query-community-feed`) target social/community feeds, not the activity timeline REST contract. `mutation-react-activity` targets post reactions, not the Activity module. No endpoints are skipped.

## Risks / Trade-offs

- **[Risk] Future backend DTO changes drift from frontend types** → Mitigation: types are colocated in one file and follow the backend record shapes closely.
- **[Risk] Exported type names still collide** → Mitigation: strict `Activity*` prefix enforced for all types; build-time barrel check will catch duplicates.
