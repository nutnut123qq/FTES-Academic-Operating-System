## ADDED Requirements

### Requirement: Resource REST client reuses the shared REST wrapper
The resource REST client SHALL import `restRequest` from `src/modules/api/rest/client/` and SHALL NOT create its own axios instance or envelope handling.

#### Scenario: Create resource
- **WHEN** `createResource(request)` is called
- **THEN** it performs `POST /api/v1/resources` through `restRequest` and returns `ResourceResponse`

### Requirement: ResourceController endpoints are exposed via REST
The resource REST client SHALL expose typed functions for all `ResourceController` endpoints except those already covered by GraphQL.

#### Scenario: List resources
- **WHEN** `listResources(params)` is called
- **THEN** it performs `GET /api/v1/resources?...` and returns `PageResponse<ResourceSummary>`

#### Scenario: Get resource detail
- **WHEN** `getResourceDetail(id)` is called
- **THEN** it performs `GET /api/v1/resources/{id}` and returns `ResourceResponse`

#### Scenario: Update resource
- **WHEN** `updateResource(id, request)` is called
- **THEN** it performs `PATCH /api/v1/resources/{id}` and returns `ResourceResponse`

#### Scenario: Create upload URL
- **WHEN** `createResourceUploadUrl(id, request)` is called
- **THEN** it performs `POST /api/v1/resources/{id}/versions/upload-url` and returns `UploadUrlResponse`

#### Scenario: Complete upload
- **WHEN** `completeResourceUpload(versionId, request)` is called
- **THEN** it performs `POST /api/v1/resources/versions/{versionId}/complete` and returns `VersionResponse`

#### Scenario: Get resource versions
- **WHEN** `getResourceVersions(id)` is called
- **THEN** it performs `GET /api/v1/resources/{id}/versions` and returns `Array<VersionResponse>`

#### Scenario: Submit resource
- **WHEN** `submitResource(id)` is called
- **THEN** it performs `POST /api/v1/resources/{id}/submit` and returns `ResourceResponse`

#### Scenario: Approve resource
- **WHEN** `approveResource(id)` is called
- **THEN** it performs `POST /api/v1/resources/{id}/approve` and returns `ResourceResponse`

#### Scenario: Reject resource
- **WHEN** `rejectResource(id, request)` is called
- **THEN** it performs `POST /api/v1/resources/{id}/reject` and returns `ResourceResponse`

#### Scenario: Archive resource
- **WHEN** `archiveResource(id)` is called
- **THEN** it performs `POST /api/v1/resources/{id}/archive` and returns `ResourceResponse`

#### Scenario: Get download URL
- **WHEN** `getResourceDownloadUrl(id)` is called
- **THEN** it performs `GET /api/v1/resources/{id}/download-url` and returns `DownloadUrlResponse`

#### Scenario: Get related resources
- **WHEN** `getRelatedResources(id)` is called
- **THEN** it performs `GET /api/v1/resources/{id}/related` and returns `Array<ResourceSummary>`

#### Scenario: Get moderation queue
- **WHEN** `getResourceModerationQueue(page, size)` is called
- **THEN** it performs `GET /api/v1/resources/moderation/pending?page=&size=` and returns `PageResponse<ResourceSummary>`

### Requirement: CollectionController endpoints are exposed via REST
The resource REST client SHALL expose typed functions for all `CollectionController` endpoints.

#### Scenario: Create collection
- **WHEN** `createCollection(request)` is called
- **THEN** it performs `POST /api/v1/resources/collections` and returns `CollectionResponse`

#### Scenario: List my collections
- **WHEN** `getMyCollections(page, size)` is called
- **THEN** it performs `GET /api/v1/resources/collections/me?page=&size=` and returns `Array<CollectionResponse>`

#### Scenario: Get collection detail
- **WHEN** `getCollectionDetail(id)` is called
- **THEN** it performs `GET /api/v1/resources/collections/{id}` and returns `CollectionDetailResponse`

#### Scenario: Update collection
- **WHEN** `updateCollection(id, request)` is called
- **THEN** it performs `PATCH /api/v1/resources/collections/{id}` and returns `CollectionResponse`

#### Scenario: Delete collection
- **WHEN** `deleteCollection(id)` is called
- **THEN** it performs `DELETE /api/v1/resources/collections/{id}` and resolves with `void`

#### Scenario: Hide collection
- **WHEN** `hideCollection(id)` is called
- **THEN** it performs `POST /api/v1/resources/collections/{id}/hide` and resolves with `void`

#### Scenario: Add collection item
- **WHEN** `addCollectionItem(id, request)` is called
- **THEN** it performs `POST /api/v1/resources/collections/{id}/items` and returns `CollectionItemResponse`

#### Scenario: Remove collection item
- **WHEN** `removeCollectionItem(id, resourceId)` is called
- **THEN** it performs `DELETE /api/v1/resources/collections/{id}/items/{resourceId}` and resolves with `void`

#### Scenario: Reorder collection items
- **WHEN** `reorderCollectionItems(id, request)` is called
- **THEN** it performs `PATCH /api/v1/resources/collections/{id}/items/reorder` and resolves with `void`

### Requirement: InteractionController non-GraphQL endpoints are exposed via REST
The resource REST client SHALL expose typed functions for `InteractionController` endpoints not already covered by GraphQL.

#### Scenario: Rate resource
- **WHEN** `rateResource(id, request)` is called
- **THEN** it performs `POST /api/v1/resources/{id}/ratings` and returns `RatingResponse`

#### Scenario: Get resource ratings
- **WHEN** `getResourceRatings(id, page, size)` is called
- **THEN** it performs `GET /api/v1/resources/{id}/ratings?page=&size=` and returns `RatingSummary`

#### Scenario: Bookmark resource
- **WHEN** `bookmarkResource(id)` is called
- **THEN** it performs `PUT /api/v1/resources/{id}/bookmark` and returns `ToggleResponse`

#### Scenario: Unbookmark resource
- **WHEN** `unbookmarkResource(id)` is called
- **THEN** it performs `DELETE /api/v1/resources/{id}/bookmark` and returns `ToggleResponse`

#### Scenario: List my bookmarks
- **WHEN** `getMyBookmarks(page, size)` is called
- **THEN** it performs `GET /api/v1/resources/me/bookmarks?page=&size=` and returns `Array<string>`

### Requirement: SWR mutation wrappers exist for every writing endpoint
For every POST/PUT/PATCH/DELETE resource/collection/interaction REST function, a corresponding `usePost*Swr` hook SHALL exist in `src/hooks/swr/api/rest/mutations/` following the existing naming and generic pattern.

#### Scenario: Use create resource hook
- **WHEN** a component calls `usePostCreateResourceSwr().trigger(request)`
- **THEN** the hook invokes `createResource(request)` through `useSWRMutation`

### Requirement: SWR query wrappers exist for read endpoints
For every GET resource/collection/interaction REST function we expose, a corresponding `useGet*Swr` hook SHALL exist in `src/hooks/swr/api/rest/queries/`.

#### Scenario: Use list resources hook
- **WHEN** a component calls `useGetResourcesSwr()`
- **THEN** the hook invokes `listResources()` through `useSWR`

### Requirement: Resource module is re-exported from the REST barrel
- **WHEN** `src/modules/api/rest/index.ts` is updated
- **THEN** it adds `export * from "./resource"` alongside existing module exports

### Requirement: GraphQL-covered endpoints are documented and skipped
Endpoints already served by generic GraphQL operations SHALL NOT receive duplicate REST clients in this change.

#### Scenario: Skip GraphQL content comments
- **WHEN** reviewing the resource interaction surface
- **THEN** `POST/GET /api/v1/resources/{id}/comments` and `DELETE /api/v1/resources/comments/{commentId}` are listed as covered by generic `createComment`/`contentComments`/`deleteComment` and omitted

#### Scenario: Skip GraphQL content favorite
- **WHEN** reviewing the resource interaction surface
- **THEN** `PUT/DELETE /api/v1/resources/{id}/favorite` are listed as covered by `mutation-toggle-favorite` and omitted
