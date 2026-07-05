## Why

After establishing the shared REST client infrastructure with the `challenges` pilot, the next logical step is to wire the course domain so the frontend can call backend REST actions (enroll, freemium preview, assessment, certificates, content management) without duplicating the existing GraphQL read surface.

## What Changes

- Reuse `src/modules/api/rest/client/` (`restRequest`, envelope unwrap, auth header) from `rest-fetch-layer`.
- Add a typed REST client for the course cluster under `src/modules/api/rest/course/` covering:
  - `CatalogController` management actions (create/update/publish/archive course, sections, lessons, video upload, stream).
  - `EnrollmentController` packages actions; skip `enroll` already on GraphQL.
  - `LearningController` progress, completion, bookmarks, and notes.
  - `FreemiumController` document content and preview configuration.
  - `AssessmentController` assignments and quizzes.
  - `CertificateController` my certificates and revoke; keep public verify documented but use REST.
- Add `usePost*Swr` mutation hooks in `src/hooks/swr/api/rest/mutations/` for every mutating REST endpoint.
- Update `src/modules/api/rest/index.ts` to re-export `./course`.
- Explicitly document which course endpoints are skipped because they are already served by GraphQL.
- No new dependencies; no changes to backend or other modules.

## Capabilities

### New Capabilities
- `rest-fetch-course`: REST client + SWR wrappers for the course controller cluster.

### Modified Capabilities
- None.

## Impact

- New files in `src/modules/api/rest/course/` and `src/hooks/swr/api/rest/mutations/`.
- One-line change to `src/modules/api/rest/index.ts`.
- No runtime impact until components import the new hooks.
