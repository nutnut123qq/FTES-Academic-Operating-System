## Context

The shared REST client (`restRequest`) already powers `challenges`, `course`, `subject`, `identity`, and `commerce`. The backend community domain in `vn.ftes.aos.community.web` exposes two REST controllers:

- `PostController` — `/api/v1/community/posts/**`, `/api/v1/community/feed`, `/api/v1/community/trending`
- `InteractionController` — `/api/v1/community/reactions`, `/api/v1/community/votes`, `/api/v1/community/bookmarks`, `/api/v1/community/follows`, `/api/v1/community/users/{id}/contributor-score`, `/api/v1/community/reports`, `/api/v1/community/moderation/**`

The frontend already has a significant GraphQL community surface: `communityFeed`, `communityPostComments`, `createCommunityPost`, `createCommunityPostComment`, `reactToCommunityPost`, `reactToCommunityPostComment`, `reactToComment`, `setFollow`, `deleteComment`, and `updateComment`. This change adds REST clients only for endpoints not covered by those GraphQL operations.

## Goals / Non-Goals

**Goals:**
- Add typed REST clients in `src/modules/api/rest/community/` for community endpoints that are **not** already covered by GraphQL.
- Add SWR mutation wrappers for every writing REST endpoint we expose.
- Add SWR query wrappers only for read endpoints we expose (i.e., those without GraphQL coverage).
- Update `src/modules/api/rest/index.ts` to re-export `./community`.
- Document skipped endpoints and the GraphQL operations that cover them.
- Pass `npx tsc --noEmit` and `npm run build` (webpack).

**Non-Goals:**
- Do not recreate the shared REST client; reuse `src/modules/api/rest/client/`.
- Do not add REST clients for endpoints already served by GraphQL (feed, post/comment creation, comments list, reactions, follows, comment update/delete).
- Do not edit existing community UI components or the `fix-community-feed-drift` work.
- Do not add new dependencies or backend changes.

## Decisions

### 1. Reuse `restRequest` without modification
**Rationale:** The wrapper already handles base URL, bearer token, envelope unwrap, and error mapping. Community needs no special envelope handling.

### 2. Group clients in `src/modules/api/rest/community/`
**Rationale:** Mirrors the backend package `community.web` and keeps the module boundary clear, consistent with previous domains.

### 3. Skip GraphQL-covered endpoints
**Rationale:** Avoid duplicate data layers and conflicting cache semantics. Skipped:
- `POST /api/v1/community/posts` → `mutation-create-community-post`
- `POST /api/v1/community/posts/{id}/comments` → `mutation-create-community-post-comment`
- `GET /api/v1/community/posts/{id}/comments` → `query-community-post-comments`
- `GET /api/v1/community/feed` → `query-community-feed`, `query-my-feed`, `query-user-feed`
- `PUT /api/v1/community/reactions` and `DELETE /api/v1/community/reactions` → `mutation-react-community-post`, `mutation-react-community-post-comment`, `mutation-react-to-comment` (these GraphQL mutations set/change/remove reactions)
- `PUT /api/v1/community/follows/{userId}` and `DELETE /api/v1/community/follows/{userId}` → `mutation-set-follow`

### 4. Expose reads through SWR query hooks only when no GraphQL equivalent exists
**Rationale:** `getPost`, `getTrending`, `getBookmarks`, `getContributorScore`, and `getModerationQueue` have no matching GraphQL operations, so they get `useGet*Swr` query hooks. All other reads are skipped.

### 5. Types inferred from `CommunityDtos.java`
**Rationale:** `CommunityDtos` is the backend source of truth. We mirror record shapes using TypeScript interfaces, using `string` for UUIDs and ISO timestamps.

### 6. Keep mutation argument shapes close to backend requests
**Rationale:** `vote`, `share`, `report`, etc. reuse the backend request records directly. Composite arguments (e.g., share requires both post id and body) are passed as a single object to the SWR trigger.

## Risks / Trade-offs

- **[Risk]** Some community UIs currently use GraphQL for reactions and follows. Adding REST reaction/follow endpoints is not needed and is skipped. If a team later wants to migrate reactions to REST, a small follow-up change can add them.
- **[Risk]** `GET /api/v1/community/posts/{id}` (post detail) is kept even though `communityFeed` returns a subset of post fields. The REST detail view includes `pollOptions`, `acceptedCommentId`, `myVote`, `bookmarkedByMe`, etc., which the feed query does not select.
- **[Trade-off]** `report` and `moderation` endpoints are added even though no active UI consumes them. They are low-cost to expose and avoid future ad-hoc axios calls.

## Affected Files / Modules

- `src/modules/api/rest/community/types.ts`
- `src/modules/api/rest/community/community.ts`
- `src/modules/api/rest/community/index.ts`
- `src/modules/api/rest/index.ts`
- `src/hooks/swr/api/rest/mutations/usePost*.ts`
- `src/hooks/swr/api/rest/mutations/index.ts`
- `src/hooks/swr/api/rest/queries/useGet*.ts`
- `src/hooks/swr/api/rest/queries/index.ts`
