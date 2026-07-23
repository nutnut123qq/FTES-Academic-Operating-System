## Context

The FTES AOS backend exposes domain controllers under `/api/v1/*` with a uniform envelope (`{code,message,data}`). The frontend skeleton, inherited from StarCi Academy, is GraphQL-first: business data flows through Apollo runners in `src/modules/api/graphql/` and SWR hooks in `src/hooks/swr/api/graphql/`. A small number of non-GraphQL endpoints (Keycloak auth, admin presigned URL, admin process video) already live as ad-hoc REST callers in `src/modules/api/rest/`, each creating its own fresh `axios.create(...)` instance.

This change introduces the missing shared REST client infrastructure so future domains can consume REST endpoints on-canon, then validates the design with a pilot implementation for the `challenges` module.

## Goals / Non-Goals

**Goals:**
- Provide one shared REST wrapper that handles base URL, auth header, envelope unwrap, and error mapping.
- Mirror the existing per-call `axios.create(...)` pattern already used by `keycloak-auth` and `admin-presigned-url`.
- Add typed REST clients for **only** the `challenges` module as a pilot.
- Add SWR mutation wrappers that follow the existing `hooks/swr/api/rest/mutations/usePost*Swr` convention.
- Keep all other ~76 REST controllers as a documented checklist for later phases.
- Pass `npm run build` (webpack) and `npx tsc --noEmit`.

**Non-Goals:**
- Do not replace or refactor existing GraphQL operations.
- Do not create REST clients for modules other than `challenges`.
- Do not add new dependencies (`axios` and `swr` are already installed).
- Do not implement UI components, pages, or forms.
- Do not introduce a singleton axios instance or global REST interceptors.

## Decisions

### 1. Use `axios` with a fresh instance per call
**Rationale:** The existing REST callers (`keycloak-auth/login.ts`, `admin-presigned-url/presigned-url.ts`) already use `axios.create(...)` per call. Reusing that pattern keeps the new layer consistent with the codebase and satisfies the canon (SLICE 3.10: "Each REST fn does `axios.create(...)` per call").

**Alternatives considered:**
- `fetch` native — avoids a dependency, but the repo already standardizes on axios for REST; deviating would create a second REST style.
- Singleton axios with interceptors — faster at runtime, but violates the canon and risks cross-request state leakage in SSR/edge contexts.

### 2. Auth header sourced from local storage via `LocalStorageId.KeycloakAccessToken`
**Rationale:** Matches the GraphQL `attach-access-token` link (`src/modules/api/graphql/clients/links/attach-access-token.ts`). The same token storage key is the single source of truth for bearer tokens.

### 3. Envelope shape: `{code,message,data}` with `data` nullable
**Rationale:** Backend contract `vn.ftes.aos.platform.api.ApiResponse<T>` defines exactly this shape. For HTTP 2xx we return `data`. For non-2xx or envelope `code !== 200` we throw an `Error` carrying `message` and, when available, `data.errorCode`.

### 4. REST-only for operations GraphQL does not already cover
**Rationale:** Prevents duplicating logic and confusing future maintainers. The pilot focuses on management/read/participation endpoints declared in `ChallengeController` (e.g., create/publish/close, test-case/rubric management, team management, leaderboard). Challenge submission flow is intentionally skipped because it is already served by existing GraphQL mutations:
- `mutation-submit-challenge-submission`
- `mutation-submit-coding-solution`
- `mutation-submit-eval-challenge`
- `mutation-sync-challenge-submission`
- `mutation-reveal-coding-solution`
- `query-challenge-submission`, `query-challenge-submissions`, `query-my-challenge-submissions`, `query-challenge-submission-progress`, `query-user-solved-challenges`, `query-weekly-challenge`, `query-user-challenge-strength`, `query-my-in-progress-challenges`, `query-challenge-suggestions`.

### 5. Types inferred directly from backend DTOs
**Rationale:** `ChallengeViews` in the backend contract is the source of truth. Request/response interfaces in `src/modules/api/rest/challenges/types.ts` mirror those records (camelCase names, UUID as string, `Instant` as ISO string, JSON fields as `string`).

### 6. No new barrel in `src/modules/api/rest/` until needed
**Rationale:** The existing `src/modules/api/rest/` subfolders are imported by deep path. We add an `index.ts` at `src/modules/api/rest/index.ts` to re-export the new `client` and `challenges` modules, but keep legacy imports untouched.

## Risks / Trade-offs

- **[Risk]** The `challenges` module already has GraphQL coverage for the learner path, so the REST pilot may initially feel duplicative.
  - **Mitigation:** The pilot intentionally targets the *management/participation* surface that GraphQL does not cover (publish/close, test cases, rubrics, teams, manual scoring, leaderboard admin view).
- **[Risk]** Creating a fresh axios instance per call adds minor overhead.
  - **Mitigation:** It is the established repo pattern and keeps request state isolated; negligible for user-facing mutation frequency.
- **[Risk]** Backend errors use `data.errorCode` strings (e.g., `CHALLENGE_UNAUTHENTICATED`) that may not be human-friendly.
  - **Mitigation:** The wrapper throws `message` first and appends `errorCode` so callers can decide whether to map to i18n keys.
- **[Risk]** Local storage access happens synchronously inside each REST call; in SSR the token is unavailable.
  - **Mitigation:** REST clients are intended for client components/hooks only, consistent with existing GraphQL auth link usage. Server-side calls are out of scope.

## Migration Plan

Not applicable. This is a green-field infrastructure addition; existing callers are not migrated.

## Open Questions

- Should a future phase migrate the existing `keycloak-auth` and `admin-presigned-url` callers to use the shared wrapper? (Out of scope for this change.)
- Should the wrapper support request cancellation via `AbortSignal`? GraphQL clients already accept `signal`; REST wrapper can accept an optional `signal` parameter for parity, but it is not required for the pilot.
