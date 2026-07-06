## 1. Community REST types

- [x] 1.1 Create `src/modules/api/rest/community/types.ts` with request/response interfaces inferred from backend `CommunityDtos`.

## 2. Community REST client

- [x] 2.1 Create `src/modules/api/rest/community/community.ts` exporting REST functions for non-GraphQL endpoints in `PostController` and `InteractionController`.
- [x] 2.2 Create `src/modules/api/rest/community/index.ts` barrel re-exporting types and functions.
- [x] 2.3 Update `src/modules/api/rest/index.ts` to add `export * from "./community"`.

### Endpoint mapping

**GraphQL-covered — BỎ QUA (ghi trong design.md):**
- `POST /api/v1/community/posts` → `mutation-create-community-post`
- `POST /api/v1/community/posts/{id}/comments` → `mutation-create-community-post-comment`
- `GET /api/v1/community/posts/{id}/comments` → `query-community-post-comments`
- `GET /api/v1/community/feed` → `query-community-feed` / `query-my-feed` / `query-user-feed`
- `PUT /api/v1/community/reactions` and `DELETE /api/v1/community/reactions` → `mutation-react-community-post` / `mutation-react-community-post-comment` / `mutation-react-to-comment`
- `PUT /api/v1/community/follows/{userId}` and `DELETE /api/v1/community/follows/{userId}` → `mutation-set-follow`

**REST-only — implement in `community.ts`:**
- Post: `getPost`, `updatePost`, `deletePost`, `votePoll`, `acceptAnswer`, `getTrending`
- Interaction: `vote`, `sharePost`, `bookmarkPost`, `unbookmarkPost`, `getBookmarks`, `getContributorScore`, `report`, `escalateReport`, `getModerationQueue`, `decideModeration`

## 3. SWR mutation wrappers

- [x] 3.1 Create `usePostUpdateCommunityPostSwr.ts`
- [x] 3.2 Create `usePostDeleteCommunityPostSwr.ts`
- [x] 3.3 Create `usePostVoteCommunityPollSwr.ts`
- [x] 3.4 Create `usePostAcceptCommunityAnswerSwr.ts`
- [x] 3.5 Create `usePostVoteCommunitySwr.ts`
- [x] 3.6 Create `usePostShareCommunityPostSwr.ts`
- [x] 3.7 Create `usePostBookmarkCommunityPostSwr.ts`
- [x] 3.8 Create `usePostUnbookmarkCommunityPostSwr.ts`
- [x] 3.9 Create `usePostReportCommunityContentSwr.ts`
- [x] 3.10 Create `usePostEscalateCommunityReportSwr.ts`
- [x] 3.11 Create `usePostDecideCommunityModerationSwr.ts`
- [x] 3.12 Update `src/hooks/swr/api/rest/mutations/index.ts` to re-export all new mutation hooks.

## 4. SWR query wrappers

- [x] 4.1 Create `useGetCommunityPostSwr.ts`
- [x] 4.2 Create `useGetCommunityTrendingSwr.ts`
- [x] 4.3 Create `useGetCommunityBookmarksSwr.ts`
- [x] 4.4 Create `useGetCommunityContributorScoreSwr.ts`
- [x] 4.5 Create `useGetCommunityModerationQueueSwr.ts`
- [x] 4.6 Update `src/hooks/swr/api/rest/queries/index.ts` to re-export all new query hooks.

## 5. Verification

- [x] 5.1 Run `npx tsc --noEmit` and fix type errors.
- [x] 5.2 Run `npm run build` (webpack) and ensure a green build.
