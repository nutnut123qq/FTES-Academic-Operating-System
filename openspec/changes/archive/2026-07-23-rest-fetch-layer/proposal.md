## Why

Backend FTES AOS exposes ~80 REST controllers under `/api/v1/*` with a standard `{code,message,data}` envelope, but the frontend today only has ad-hoc REST callers for Keycloak auth and a couple admin tools. We need a single, on-canon REST client infrastructure so future domain work can call REST endpoints without each feature inventing its own axios/fetch wrapper, while avoiding overlap with the existing GraphQL layer.

## What Changes

- Add a shared REST client wrapper in `src/modules/api/rest/` that:
  - Reads the HTTP base URL from `publicEnv().api.http`.
  - Attaches the Keycloak access token from local storage (`LocalStorageId.KeycloakAccessToken`).
  - Unwraps the standard backend envelope `{code,message,data}` and maps error bodies to thrown `Error` objects.
  - Creates a fresh axios instance per call (matching existing REST patterns in the repo).
- Implement the **pilot module client** for `challenges` (`/api/v1/challenges/*`) with typed request/response DTOs inferred from `ChallengeController` and `ChallengeViews` in the backend contract.
- Add SWR mutation wrappers (`usePost*Swr`) for the new challenge REST operations, following the existing `hooks/swr/api/rest/mutations/*` convention.
- Leave all other REST controllers as a documented checklist for later phases; **no code is generated for them in this change**.
- Do not add new dependencies; reuse `axios` and `swr` already installed.
- Do not modify existing GraphQL challenge operations (`src/modules/api/graphql/**`); explicitly document which challenge endpoints are already served by GraphQL and therefore skipped for REST.

## Capabilities

### New Capabilities
- `rest-fetch-layer`: Shared REST fetch infrastructure (envelope unwrap, auth header, error mapping) plus the pilot `challenges` REST client and SWR wrappers.

### Modified Capabilities
- None (this is pure infrastructure; no existing spec behavior changes).

## Impact

- New files in `src/modules/api/rest/challenges/`, `src/modules/api/rest/client/`, and `src/hooks/swr/api/rest/mutations/`.
- New barrel exports in `src/modules/api/rest/index.ts` and `src/hooks/swr/api/rest/mutations/index.ts`.
- No changes to backend code.
- No runtime behavior change until a component/feature imports and uses the new pilot client.
