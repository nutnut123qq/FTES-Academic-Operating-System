## Context

The frontend already consumes many backend domains through the shared REST module pattern (`src/modules/api/rest/<domain>/{client.ts,types.ts,index.ts}`) and SWR hooks. The backend Integration module exposes `ApiKeyController` (`/api/v1/integration/api-keys`) and `ConnectionController` (`/api/v1/integration/connections`), which are not yet wired into the frontend. This change follows the established pattern to add the missing clients and hooks for the Integration Hub.

## Goals / Non-Goals

**Goals:**
- Provide typed REST call functions for every endpoint in `ApiKeyController` and `ConnectionController`.
- Provide SWR query and mutation hooks for those endpoints.
- Prefix all exported type names with `Integration*` to avoid collisions in the top-level `src/modules/api/rest/index.ts` barrel.
- Keep build green (`npx tsc --noEmit` and `npm run build -- --webpack`).

**Non-Goals:**
- No changes to backend code or GraphQL operations.
- No new runtime dependencies.
- No UI components or pages.

## Decisions

- **Single REST module**: Both controllers are implemented in one `integration` REST module because they belong to the same backend domain and share the same base path prefix `/api/v1/integration`.
- **Type prefix**: All exported TypeScript types use the `Integration*` prefix (e.g., `IntegrationApiKeyView`, `IntegrationConnectionView`) because the shared barrel flattens many modules.
- **Plaintext key handling**: `CreatedKeyView.plaintext` is typed as `string` and is only available on creation; the listing view `IntegrationApiKeyView` intentionally omits it, matching the backend security design.
- **No GraphQL skips**: The existing GraphQL operations contain no integration, API-key, or connection queries/mutations, so no endpoints are skipped.

## Risks / Trade-offs

- **[Risk] Future backend DTO changes drift from frontend types** → Mitigation: types are colocated in one file and follow the backend record shapes closely.
- **[Risk] Exported type names still collide** → Mitigation: strict `Integration*` prefix enforced for all types; build-time barrel check will catch duplicates.
