## Why

The shared REST client (`restRequest`) already serves `challenges`, `course`, `subject`, `identity`, and `commerce`. The community domain exposes REST controllers for posts and interactions, but the frontend currently has no typed REST layer for them. Because several community reads are already served by GraphQL, this change only adds REST clients for the actions and reads that GraphQL does not cover.

## What Changes

- Reuse `src/modules/api/rest/client/` (`restRequest`, envelope unwrap, bearer token) from previous changes.
- Add a typed REST client for the community controller cluster under `src/modules/api/rest/community/` covering:
  - `PostController` actions/reads not on GraphQL: update/delete post, poll vote, accept answer, post detail, trending.
  - `InteractionController` actions/reads not on GraphQL: vote, share, bookmark/unbookmark, list bookmarks, contributor score, report, escalate, moderation queue, moderation decision.
- Add `usePost*Swr` mutation hooks for every writing REST endpoint.
- Add `useGet*Swr` query hooks only for read endpoints without GraphQL coverage.
- Update `src/modules/api/rest/index.ts` to re-export `./community`.
- Explicitly document community endpoints already covered by GraphQL and skipped.
- No new dependencies; no changes to backend or other modules; no edits to existing community UI components.

## Capabilities

### New Capabilities
- `rest-fetch-community`: REST client + SWR wrappers for the community controller cluster, deduplicated against existing GraphQL.

### Modified Capabilities
- None.

## Impact

- New files in `src/modules/api/rest/community/` and `src/hooks/swr/api/rest/mutations/` (plus a small number of query hooks in `src/hooks/swr/api/rest/queries/`).
- One-line change to `src/modules/api/rest/index.ts`.
- No runtime impact until components import the new hooks.
