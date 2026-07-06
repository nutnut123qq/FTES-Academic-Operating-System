## Context

The frontend already consumes many backend domains through the shared REST module pattern (`src/modules/api/rest/<domain>/{client.ts,types.ts,index.ts}`) and SWR hooks. The backend Platform module exposes `PlatformInfraController` and `PlatformOpsController` under `/api/v1/platform`, which are not yet wired into the frontend. This change follows the established pattern to add the missing clients and hooks for enterprise infrastructure/ops features.

## Goals / Non-Goals

**Goals:**
- Provide typed REST call functions for every endpoint in `PlatformInfraController` and `PlatformOpsController` under `platform/web`.
- Provide SWR query and mutation hooks for those endpoints.
- Prefix all exported type names with `Platform*` to avoid collisions in the top-level `src/modules/api/rest/index.ts` barrel.
- Keep build green (`npx tsc --noEmit` and `npm run build -- --webpack`).

**Non-Goals:**
- No changes to backend code or GraphQL operations.
- No new runtime dependencies.
- No UI components or pages.
- No implementation for `platform/graphql/resolver/*`; those are GraphQL resolvers and remain out of scope for this REST client change.

## Decisions

- **Single REST module**: Both `PlatformInfraController` and `PlatformOpsController` are implemented in one `platform` REST module because they share the same base path `/api/v1/platform`.
- **Type prefix**: All exported TypeScript types use the `Platform*` prefix (e.g., `PlatformFileView`, `PlatformFeatureFlag`) because the shared barrel flattens many modules.
- **Domain entity mirroring**: Types for `FileObject`, `FeatureFlag`, `Configuration`, `AiProvider`, and `ScheduledJob` are defined as `Platform*` view types matching the backend entity getters exposed through the controllers.
- **Audit/job run rows as `Record<string, unknown>`**: The audit-log and job-run endpoints return raw JDBC `Map<String, Object>` rows; the frontend types them as `Record<string, unknown>[]`.
- **No GraphQL skips**: Existing GraphQL operations (`platform-stats`, `incomplete-jobs`, `ai-models`, etc.) target product-specific features and do not overlap with the generic platform infra/ops REST endpoints (files, feature flags, configurations, AI providers, audit logs, scheduled jobs). Therefore no endpoints are skipped.

## Risks / Trade-offs

- **[Risk] Future backend DTO changes drift from frontend types** → Mitigation: types are colocated in one file and follow the backend record shapes closely.
- **[Risk] Exported type names still collide** → Mitigation: strict `Platform*` prefix enforced for all types; build-time barrel check will catch duplicates.
