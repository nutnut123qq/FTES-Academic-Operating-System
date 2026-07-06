## Context

The shared REST client (`restRequest`) already powers `challenges`, `course`, `subject`, `identity`, `commerce`, `community`, `resource`, `gamification`, `notification`, `profile`, and `wallet`. The backend blog domain in `vn.ftes.aos.blog.web` exposes three REST controllers under `/api/v1/blog`:

- `BlogPostController` — public reads (`/posts`, `/posts/search`, `/posts/{slug}`) and editorial writes (`/posts`, `/posts/{id}`, `/posts/{id}/publish`, `/posts/{id}` DELETE) requiring `blog.manage`.
- `BlogCategoryController` — public category list and editorial create/update/delete requiring `blog.manage`.
- `BlogEngagementController` — authenticated comment CRUD on posts and authenticated reaction toggles on posts/comments.

The frontend already has GraphQL queries for public blog post listing (`queryBlogPosts`) and detail (`queryBlogPost`). Those fields are editorial/content-oriented and overlap with the public REST reads, so the REST client will skip them to avoid duplication.

## Goals / Non-Goals

**Goals:**
- Add typed REST clients in `src/modules/api/rest/blog/` for all blog web endpoints.
- Add SWR mutation wrappers for every writing REST endpoint.
- Add SWR query wrappers for read endpoints that are not covered by GraphQL.
- Update `src/modules/api/rest/index.ts` to re-export `./blog`.
- Pass `npx tsc --noEmit` and `npm run build` (webpack).

**Non-Goals:**
- Do not recreate the shared REST client; reuse `src/modules/api/rest/client/`.
- Do not add UI components or pages.
- Do not add new dependencies or backend changes.
- Do not duplicate GraphQL-covered public post listing/detail reads.

## Decisions

### 1. Reuse `restRequest` without modification
**Rationale:** The wrapper already handles base URL, bearer token, envelope unwrap (`code === 200`), and error mapping. Blog needs no special envelope handling.

### 2. Group clients in `src/modules/api/rest/blog/`
**Rationale:** Mirrors the backend package `blog.web` and keeps the module boundary clear, consistent with previous domains.

### 3. Skip GraphQL-overlapped reads
**Rationale:** `queryBlogPosts` and `queryBlogPost` already provide published post listing and detail. We therefore skip REST `GET /api/v1/blog/posts`, `GET /api/v1/blog/posts/search`, and `GET /api/v1/blog/posts/{slug}` in the frontend REST client. If a future page needs the raw REST shape (e.g., admin drafts), it can be added then.

### 4. Implement all remaining REST endpoints
**Rationale:** Editorial post/category writes and engagement (comments/reactions) have no GraphQL equivalent, so they are fully exposed via REST.

### 5. Types inferred from `BlogDtos.java`
**Rationale:** These records are the backend source of truth. We mirror them using TypeScript interfaces, using `string` for UUIDs and ISO timestamps. We avoid generic names that collide with other modules (e.g., prefer `BlogPostPage`/`BlogCommentPage` over plain `Page`).

## Risks / Trade-offs

- **[Risk]** Editorial endpoints require `blog.manage`; callers must ensure admin UIs hold the appropriate permission.
- **[Risk]** Engagement endpoints are authenticated; anonymous users cannot comment/react through these hooks.
- **[Trade-off]** Public post reads are implemented only in GraphQL, while writes live only in REST. This splits the blog domain across two data layers, which matches the existing platform convention.

## Affected Files / Modules

- `src/modules/api/rest/blog/types.ts`
- `src/modules/api/rest/blog/blog.ts`
- `src/modules/api/rest/blog/index.ts`
- `src/modules/api/rest/index.ts`
- `src/hooks/swr/api/rest/mutations/usePost*.ts`
- `src/hooks/swr/api/rest/mutations/index.ts`
- `src/hooks/swr/api/rest/queries/useGet*.ts`
- `src/hooks/swr/api/rest/queries/index.ts`
