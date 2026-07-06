## Why

The shared REST client (`restRequest`) already serves `challenges`, `course`, `subject`, `identity`, `commerce`, `community`, `resource`, `gamification`, `notification`, `profile`, and `wallet`. The blog domain exposes three REST controllers in `vn.ftes.aos.blog.web` — `BlogPostController`, `BlogCategoryController`, and `BlogEngagementController` — but the frontend has no typed REST layer for editorial operations, categories, or blog-specific comments/reactions. GraphQL only covers public post listing and detail reads, so editorial writes, category management, and blog engagement are currently unreachable from the frontend.

## What Changes

- Reuse `src/modules/api/rest/client/` (`restRequest`, envelope unwrap, bearer token) from previous changes.
- Add a typed REST client under `src/modules/api/rest/blog/` covering:
  - `BlogPostController` — public list/search/detail and editorial create/update/publish/delete.
  - `BlogCategoryController` — public category list and editorial category create/update/delete.
  - `BlogEngagementController` — blog post comments (list/create/update/delete) and reactions on posts/comments.
- Add `usePost*Swr` mutation hooks for every writing REST endpoint.
- Add `useGet*Swr` query hooks for read endpoints that are not already served by GraphQL.
- Update `src/modules/api/rest/index.ts` to re-export `./blog`.
- No new dependencies; no changes to backend or other modules.

## Capabilities

### New Capabilities
- `rest-fetch-blog`: REST client + SWR wrappers for the blog web controller cluster.

### Modified Capabilities
- None.

## Impact

- New files in `src/modules/api/rest/blog/` and `src/hooks/swr/api/rest/mutations/` (plus query hooks in `src/hooks/swr/api/rest/queries/`).
- One-line change to `src/modules/api/rest/index.ts`.
- No runtime impact until components import the new hooks.
