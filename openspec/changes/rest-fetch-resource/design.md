## Context

The shared REST client (`restRequest`) already powers `challenges`, `course`, `subject`, `identity`, `commerce`, and `community`. The backend resource domain in `vn.ftes.aos.resource.web` exposes three REST controllers:

- `ResourceController` — `/api/v1/resources/**`
- `CollectionController` — `/api/v1/resources/collections/**`
- `InteractionController` — `/api/v1/resources/**`

The frontend already has generic GraphQL operations for content comments (`createComment`, `updateComment`, `deleteComment`, `contentComments`) and content favorites (`toggleFavourite`). Those generic operations can target any content entity, including resources, so the resource-specific comment and favorite REST endpoints are skipped. Everything else in the resource/collection surface gets REST clients.

## Goals / Non-Goals

**Goals:**
- Add typed REST clients in `src/modules/api/rest/resource/` for resource/collection endpoints not covered by GraphQL.
- Add SWR mutation wrappers for every writing REST endpoint we expose.
- Add SWR query wrappers for read endpoints we expose.
- Update `src/modules/api/rest/index.ts` to re-export `./resource`.
- Document skipped endpoints and the GraphQL operations that cover them.
- Pass `npx tsc --noEmit` and `npm run build` (webpack).

**Non-Goals:**
- Do not recreate the shared REST client; reuse `src/modules/api/rest/client/`.
- Do not add REST clients for resource comments/favorites already covered by generic GraphQL operations.
- Do not add UI components or pages.
- Do not add new dependencies or backend changes.

## Decisions

### 1. Reuse `restRequest` without modification
**Rationale:** The wrapper already handles base URL, bearer token, envelope unwrap, and error mapping. Resource needs no special envelope handling.

### 2. Group clients in `src/modules/api/rest/resource/`
**Rationale:** Mirrors the backend package `resource.web` and keeps the module boundary clear, consistent with previous domains.

### 3. Skip GraphQL-covered interactions
**Rationale:** Avoid duplicate data layers and conflicting cache semantics. Skipped:
- `POST /api/v1/resources/{id}/comments` and `GET /api/v1/resources/{id}/comments` → generic `createComment` / `contentComments` GraphQL
- `DELETE /api/v1/resources/comments/{commentId}` → generic `deleteComment` GraphQL
- `PUT /api/v1/resources/{id}/favorite` and `DELETE /api/v1/resources/{id}/favorite` → generic `toggleFavourite` GraphQL

### 4. Expose all resource/catalog/management endpoints via REST
**Rationale:** No GraphQL operations exist for resource catalog, resource CRUD, upload lifecycle, moderation, collections, ratings, or bookmarks. All of these are implemented.

### 5. Read endpoints get SWR query hooks
**Rationale:** `listResources`, `getResourceDetail`, `getResourceVersions`, `getResourceDownloadUrl`, `getRelatedResources`, `getResourceModerationQueue`, `getMyCollections`, `getCollectionDetail`, `getResourceRatings`, and `getMyBookmarks` are reads with no GraphQL equivalent. They get `useGet*Swr` query hooks.

### 6. Types inferred from `ResourceDtos.java` and `InteractionDtos.java`
**Rationale:** These records are the backend source of truth. We mirror them using TypeScript interfaces, using `string` for UUIDs and ISO timestamps, and `number` for BigDecimal ratings.

## Risks / Trade-offs

- **[Risk]** Skipping resource comments/favorites assumes the generic GraphQL operations are wired to the same backend service. If the resource module has its own comment/favorite storage separate from the generic content service, components may need the REST versions later.
- **[Risk]** `ResourceController` includes moderation/admin actions (`approve`, `reject`, `archive`, `moderationQueue`) mixed with public catalog endpoints. The REST module exposes all of them; callers must ensure admin UIs hold the appropriate permissions.
- **[Trade-off]** `downloadUrl` returns a presigned URL. The REST client exposes it as a query hook, which is fine for SWR caching because the presigned URL has a TTL.

## Affected Files / Modules

- `src/modules/api/rest/resource/types.ts`
- `src/modules/api/rest/resource/resource.ts`
- `src/modules/api/rest/resource/index.ts`
- `src/modules/api/rest/index.ts`
- `src/hooks/swr/api/rest/mutations/usePost*.ts`
- `src/hooks/swr/api/rest/mutations/index.ts`
- `src/hooks/swr/api/rest/queries/useGet*.ts`
- `src/hooks/swr/api/rest/queries/index.ts`
