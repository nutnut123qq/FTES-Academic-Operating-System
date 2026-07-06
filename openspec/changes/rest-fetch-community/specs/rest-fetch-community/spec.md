## ADDED Requirements

### Requirement: Community REST client reuses the shared REST wrapper
The community REST client SHALL import `restRequest` from `src/modules/api/rest/client/` and SHALL NOT create its own axios instance or envelope handling.

#### Scenario: Update post
- **WHEN** `updatePost(id, request)` is called
- **THEN** it performs `PATCH /api/v1/community/posts/{id}` through `restRequest` and returns `PostResponse`

### Requirement: PostController non-GraphQL endpoints are exposed via REST
The community REST client SHALL expose typed functions for every `PostController` endpoint not already covered by GraphQL.

#### Scenario: Get post detail
- **WHEN** `getPost(id)` is called
- **THEN** it performs `GET /api/v1/community/posts/{id}` and returns `PostResponse`

#### Scenario: Delete post
- **WHEN** `deletePost(id)` is called
- **THEN** it performs `DELETE /api/v1/community/posts/{id}` and resolves with `void`

#### Scenario: Vote poll
- **WHEN** `votePoll(id, request)` is called
- **THEN** it performs `POST /api/v1/community/posts/{id}/poll-votes` and resolves with `void`

#### Scenario: Accept answer
- **WHEN** `acceptAnswer(postId, request)` is called
- **THEN** it performs `POST /api/v1/community/posts/{postId}/accepted-answer` and resolves with `void`

#### Scenario: Get trending posts
- **WHEN** `getTrending(scope, limit)` is called
- **THEN** it performs `GET /api/v1/community/trending?scope=&limit=` and returns `Array<PostResponse>`

### Requirement: InteractionController non-GraphQL endpoints are exposed via REST
The community REST client SHALL expose typed functions for every `InteractionController` endpoint not already covered by GraphQL.

#### Scenario: Vote
- **WHEN** `vote(request)` is called
- **THEN** it performs `PUT /api/v1/community/votes` and resolves with `void`

#### Scenario: Share post
- **WHEN** `sharePost(id, request)` is called
- **THEN** it performs `POST /api/v1/community/posts/{id}/shares` and returns `PostResponse`

#### Scenario: Bookmark post
- **WHEN** `bookmarkPost(postId)` is called
- **THEN** it performs `PUT /api/v1/community/bookmarks/{postId}` and resolves with `void`

#### Scenario: Unbookmark post
- **WHEN** `unbookmarkPost(postId)` is called
- **THEN** it performs `DELETE /api/v1/community/bookmarks/{postId}` and resolves with `void`

#### Scenario: List bookmarks
- **WHEN** `getBookmarks(limit)` is called
- **THEN** it performs `GET /api/v1/community/bookmarks?limit=` and returns `Array<string>`

#### Scenario: Get contributor score
- **WHEN** `getContributorScore(userId)` is called
- **THEN** it performs `GET /api/v1/community/users/{userId}/contributor-score` and returns `ContributorScoreResponse`

#### Scenario: Report content
- **WHEN** `report(request)` is called
- **THEN** it performs `POST /api/v1/community/reports` and returns `string`

#### Scenario: Escalate report
- **WHEN** `escalateReport(id)` is called
- **THEN** it performs `POST /api/v1/community/reports/{id}/escalate` and returns `string`

#### Scenario: Get moderation queue
- **WHEN** `getModerationQueue(status, limit)` is called
- **THEN** it performs `GET /api/v1/community/moderation/queue?status=&limit=` and returns `Array<ModerationQueueResponse>`

#### Scenario: Moderation decision
- **WHEN** `decideModeration(id, request)` is called
- **THEN** it performs `POST /api/v1/community/moderation/queue/{id}/decision` and resolves with `void`

### Requirement: SWR mutation wrappers exist for every writing endpoint
For every POST/PUT/PATCH/DELETE community REST function, a corresponding `usePost*Swr` hook SHALL exist in `src/hooks/swr/api/rest/mutations/` following the existing naming and generic pattern.

#### Scenario: Use update post hook
- **WHEN** a component calls `usePostUpdateCommunityPostSwr().trigger({ id, request })`
- **THEN** the hook invokes `updatePost(id, request)` through `useSWRMutation`

### Requirement: SWR query wrappers exist for non-GraphQL read endpoints
For every GET community REST function we expose, a corresponding `useGet*Swr` hook SHALL exist in `src/hooks/swr/api/rest/queries/`.

#### Scenario: Use trending hook
- **WHEN** a component calls `useGetCommunityTrendingSwr()`
- **THEN** the hook invokes `getTrending()` through `useSWR`

### Requirement: Community module is re-exported from the REST barrel
- **WHEN** `src/modules/api/rest/index.ts` is updated
- **THEN** it adds `export * from "./community"` alongside existing module exports

### Requirement: GraphQL-covered endpoints are documented and skipped
Endpoints already served by GraphQL SHALL NOT receive duplicate REST clients in this change.

#### Scenario: Skip GraphQL feed
- **WHEN** reviewing the community surface
- **THEN** `GET /api/v1/community/feed` is listed as covered by `query-community-feed` and omitted

#### Scenario: Skip GraphQL reactions
- **WHEN** reviewing the interaction surface
- **THEN** `PUT /api/v1/community/reactions` and `DELETE /api/v1/community/reactions` are listed as covered by the `reactToCommunityPost`/`reactToComment` mutations and omitted
