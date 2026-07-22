## Context

The frontend already consumes many backend domains through a shared REST module pattern (`src/modules/api/rest/<domain>/{client.ts,types.ts,index.ts}`) and SWR hooks (`src/hooks/swr/api/rest/{queries,mutations}/<domain>/`). The backend Recommendation module exposes two controllers (`RecommendationController` and `PersonalizeController`) that are not yet wired into the frontend. This change follows the established pattern to add the missing clients and hooks.

## Goals / Non-Goals

**Goals:**
- Provide typed REST call functions for every endpoint in `RecommendationController` and `PersonalizeController`.
- Provide SWR query and mutation hooks for those endpoints.
- Keep all exported type names prefixed with `Recommendation*` to avoid collisions in the top-level `src/modules/api/rest/index.ts` barrel.
- Keep build green (`npx tsc --noEmit` and `npm run build -- --webpack`).

**Non-Goals:**
- No changes to backend code or GraphQL operations.
- No new runtime dependencies.
- No UI components or pages.

## Decisions

- **Two REST capability files**: Split recommendation and personalize concerns into two capability specs because they map to two distinct controllers and permission models, but implement them in a single `recommendation` REST module for locality with the backend domain.
- **Type prefix**: All exported TypeScript types use the `Recommendation*` prefix (e.g., `RecommendationItem`, `RecommendationPersonalizeContext`) because the shared barrel flattens many modules and short names like `ConsentView` or `ExportView` collide with other domains.
- **Date strings as ISO strings**: `OffsetDateTime` and `Instant` from Java are represented as `string` in TypeScript DTOs, consistent with existing REST modules.
- **Map fields as `Record<string, unknown>`**: `RecommendationItem.reasons` is `List<Map<String, Object>>`; typed as `Record<string, unknown>[]`.
- **No GraphQL skips**: The existing GraphQL suggestion/recommend queries target domain-specific suggestion features (courses, users, challenges, etc.) and do not overlap with the generic recommendation engine or personalization context endpoints implemented here.

## Risks / Trade-offs

- **[Risk] Future backend DTO changes drift from frontend types** → Mitigation: types are colocated in one file and follow the backend record shapes closely.
- **[Risk] Exported type names still collide** → Mitigation: strict `Recommendation*` prefix enforced for all types; build-time barrel check will catch duplicates.
