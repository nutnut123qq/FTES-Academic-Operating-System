## 1. Resource REST types

- [x] 1.1 Create `src/modules/api/rest/resource/types.ts` with request/response interfaces inferred from backend `ResourceDtos` and `InteractionDtos`.

## 2. Resource REST client

- [x] 2.1 Create `src/modules/api/rest/resource/resource.ts` exporting REST functions for non-GraphQL endpoints in `ResourceController`, `CollectionController`, and `InteractionController`.
- [x] 2.2 Create `src/modules/api/rest/resource/index.ts` barrel re-exporting types and functions.
- [x] 2.3 Update `src/modules/api/rest/index.ts` to add `export * from "./resource"`.

### Endpoint mapping

**GraphQL-covered — BỎ QUA (ghi trong design.md):**
- `POST /api/v1/resources/{id}/comments` and `GET /api/v1/resources/{id}/comments` → generic `createComment` / `contentComments`
- `DELETE /api/v1/resources/comments/{commentId}` → generic `deleteComment`
- `PUT /api/v1/resources/{id}/favorite` and `DELETE /api/v1/resources/{id}/favorite` → `mutation-toggle-favorite`

**REST-only — implement in `resource.ts`:**
- Resource: `listResources`, `getResourceDetail`, `createResource`, `updateResource`, `createResourceUploadUrl`, `completeResourceUpload`, `getResourceVersions`, `submitResource`, `approveResource`, `rejectResource`, `archiveResource`, `getResourceDownloadUrl`, `getRelatedResources`, `getResourceModerationQueue`
- Collection: `createCollection`, `getMyCollections`, `getCollectionDetail`, `updateCollection`, `deleteCollection`, `hideCollection`, `addCollectionItem`, `removeCollectionItem`, `reorderCollectionItems`
- Interaction: `rateResource`, `getResourceRatings`, `bookmarkResource`, `unbookmarkResource`, `getMyBookmarks`

## 3. SWR mutation wrappers

- [x] 3.1 Create `usePostCreateResourceSwr.ts`
- [x] 3.2 Create `usePostUpdateResourceSwr.ts`
- [x] 3.3 Create `usePostCreateResourceUploadUrlSwr.ts`
- [x] 3.4 Create `usePostCompleteResourceUploadSwr.ts`
- [x] 3.5 Create `usePostSubmitResourceSwr.ts`
- [x] 3.6 Create `usePostApproveResourceSwr.ts`
- [x] 3.7 Create `usePostRejectResourceSwr.ts`
- [x] 3.8 Create `usePostArchiveResourceSwr.ts`
- [x] 3.9 Create `usePostCreateCollectionSwr.ts`
- [x] 3.10 Create `usePostUpdateCollectionSwr.ts`
- [x] 3.11 Create `usePostDeleteCollectionSwr.ts`
- [x] 3.12 Create `usePostHideCollectionSwr.ts`
- [x] 3.13 Create `usePostAddCollectionItemSwr.ts`
- [x] 3.14 Create `usePostRemoveCollectionItemSwr.ts`
- [x] 3.15 Create `usePostReorderCollectionItemsSwr.ts`
- [x] 3.16 Create `usePostRateResourceSwr.ts`
- [x] 3.17 Create `usePostBookmarkResourceSwr.ts`
- [x] 3.18 Create `usePostUnbookmarkResourceSwr.ts`
- [x] 3.19 Update `src/hooks/swr/api/rest/mutations/index.ts` to re-export all new mutation hooks.

## 4. SWR query wrappers

- [x] 4.1 Create `useGetResourcesSwr.ts`
- [x] 4.2 Create `useGetResourceDetailSwr.ts`
- [x] 4.3 Create `useGetResourceVersionsSwr.ts`
- [x] 4.4 Create `useGetResourceDownloadUrlSwr.ts`
- [x] 4.5 Create `useGetRelatedResourcesSwr.ts`
- [x] 4.6 Create `useGetResourceModerationQueueSwr.ts`
- [x] 4.7 Create `useGetMyCollectionsSwr.ts`
- [x] 4.8 Create `useGetCollectionDetailSwr.ts`
- [x] 4.9 Create `useGetResourceRatingsSwr.ts`
- [x] 4.10 Create `useGetMyBookmarksSwr.ts`
- [x] 4.11 Update `src/hooks/swr/api/rest/queries/index.ts` to re-export all new query hooks.

## 5. Verification

- [x] 5.1 Run `npx tsc --noEmit` and fix type errors.
- [x] 5.2 Run `npm run build` (webpack) and ensure a green build.
