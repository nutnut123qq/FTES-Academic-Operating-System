## Why

The web frontend needs typed REST clients and SWR hooks for the backend Recommendation and Personalize controllers so that UI features (recommendation feeds, personalization context, consent, and admin exports) can fetch data through the shared REST infrastructure instead of ad-hoc calls.

## What Changes

- Add a new REST module `src/modules/api/rest/recommendation` with typed request/response types and call functions for:
  - `RecommendationController` (`/api/v1/recommendations`)
  - `PersonalizeController` (`/api/v1/personalize`)
- Add SWR query hooks in `src/hooks/swr/api/rest/queries/recommendation/` for all read endpoints.
- Add SWR mutation hooks in `src/hooks/swr/api/rest/mutations/recommendation/` for all write endpoints.
- Re-export the new module from `src/modules/api/rest/index.ts`.
- Prefix all exported types with `Recommendation*` to avoid barrel collisions.
- Skip any endpoints already covered by existing GraphQL operations; document skips in `design.md`.

## Capabilities

### New Capabilities

- `recommendation-rest-client`: REST client + SWR hooks for discovery and feedback endpoints under `/api/v1/recommendations`.
- `personalize-rest-client`: REST client + SWR hooks for personalization context, signals, consent, and dataset export endpoints under `/api/v1/personalize`.

### Modified Capabilities

- None (this change only wires new REST consumers; it does not alter existing product requirements).

## Impact

- Affected code: `src/modules/api/rest/recommendation/*`, `src/modules/api/rest/index.ts`, `src/hooks/swr/api/rest/queries/recommendation/*`, `src/hooks/swr/api/rest/mutations/recommendation/*`.
- No new runtime dependencies; reuses `restRequest` and SWR patterns already in the repo.
- No backend changes.
