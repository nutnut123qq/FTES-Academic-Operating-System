## ADDED Requirements

### Requirement: Profile REST client reuses the shared REST wrapper
The profile REST client SHALL import `restRequest` from `src/modules/api/rest/client/` and SHALL NOT create its own axios instance or envelope handling.

### Requirement: MeProfileController non-GraphQL endpoints are exposed via REST
The profile REST client SHALL expose typed functions for `MeProfileController` endpoints not already covered by GraphQL.

#### Scenario: Upload avatar
- **WHEN** `uploadAvatar(file)` is called
- **THEN** it performs `PUT /api/v1/profiles/me/avatar` as multipart/form-data and returns `SelfProfile`

#### Scenario: Upload cover
- **WHEN** `uploadCover(file)` is called
- **THEN** it performs `PUT /api/v1/profiles/me/cover` as multipart/form-data and returns `SelfProfile`

#### Scenario: Replace social links
- **WHEN** `replaceSocialLinks(request)` is called
- **THEN** it performs `PUT /api/v1/profiles/me/social-links` with `ProfileReplaceSocialLinksRequest` and returns `SelfProfile`

#### Scenario: Get privacy settings
- **WHEN** `getPrivacySettings()` is called
- **THEN** it performs `GET /api/v1/profiles/me/privacy` and returns `ProfilePrivacySettings`

#### Scenario: Update privacy settings
- **WHEN** `updatePrivacySettings(request)` is called
- **THEN** it performs `PUT /api/v1/profiles/me/privacy` with `ProfilePrivacySettings` and returns `ProfilePrivacySettings`

#### Scenario: Create portfolio project
- **WHEN** `createPortfolioProject(request)` is called
- **THEN** it performs `POST /api/v1/profiles/me/portfolio/projects` with `ProfileProjectCreateRequest` and returns `ProjectView`

#### Scenario: Update portfolio project
- **WHEN** `updatePortfolioProject(id, request)` is called
- **THEN** it performs `PATCH /api/v1/profiles/me/portfolio/projects/{id}` with `ProfileProjectRequest` and returns `ProjectView`

#### Scenario: Delete portfolio project
- **WHEN** `deletePortfolioProject(id)` is called
- **THEN** it performs `DELETE /api/v1/profiles/me/portfolio/projects/{id}` and resolves with `void`

#### Scenario: Upload portfolio asset
- **WHEN** `uploadPortfolioAsset(file, type, title)` is called
- **THEN** it performs `POST /api/v1/profiles/me/portfolio/assets` as multipart/form-data and returns `AssetView`

#### Scenario: Delete portfolio asset
- **WHEN** `deletePortfolioAsset(id)` is called
- **THEN** it performs `DELETE /api/v1/profiles/me/portfolio/assets/{id}` and resolves with `void`

#### Scenario: Add achievement
- **WHEN** `addAchievement(request)` is called
- **THEN** it performs `POST /api/v1/profiles/me/achievements` with `ProfileAchievementRequest` and returns `AchievementView`

#### Scenario: Delete achievement
- **WHEN** `deleteAchievement(id)` is called
- **THEN** it performs `DELETE /api/v1/profiles/me/achievements/{id}` and resolves with `void`

### Requirement: PublicProfileController non-GraphQL endpoints are exposed via REST
The profile REST client SHALL expose typed functions for `PublicProfileController` endpoints not already covered by GraphQL.

#### Scenario: Get profile timeline
- **WHEN** `getProfileTimeline(username, params)` is called
- **THEN** it performs `GET /api/v1/profiles/{username}/timeline?cursor=&limit=` and returns `CursorPage<TimelineEntry>`

#### Scenario: Moderate profile
- **WHEN** `moderateProfile(userId, request)` is called
- **THEN** it performs `PATCH /api/v1/profiles/{userId}/moderate` with `ProfileUpdateRequest` and resolves with `void`

### Requirement: SWR mutation wrappers exist for every writing endpoint
For every POST/PUT/PATCH/DELETE profile REST function, a corresponding `usePost*Swr` hook SHALL exist in `src/hooks/swr/api/rest/mutations/` following the existing naming and generic pattern.

#### Scenario: Use upload avatar hook
- **WHEN** a component calls `usePostUploadAvatarSwr().trigger(file)`
- **THEN** the hook invokes `uploadAvatar(file)` through `useSWRMutation`

#### Scenario: Use upload cover hook
- **WHEN** a component calls `usePostUploadCoverSwr().trigger(file)`
- **THEN** the hook invokes `uploadCover(file)` through `useSWRMutation`

#### Scenario: Use replace social links hook
- **WHEN** a component calls `usePostReplaceSocialLinksSwr().trigger(request)`
- **THEN** the hook invokes `replaceSocialLinks(request)` through `useSWRMutation`

#### Scenario: Use update privacy settings hook
- **WHEN** a component calls `usePostUpdatePrivacySettingsSwr().trigger(request)`
- **THEN** the hook invokes `updatePrivacySettings(request)` through `useSWRMutation`

#### Scenario: Use create portfolio project hook
- **WHEN** a component calls `usePostCreatePortfolioProjectSwr().trigger(request)`
- **THEN** the hook invokes `createPortfolioProject(request)` through `useSWRMutation`

#### Scenario: Use update portfolio project hook
- **WHEN** a component calls `usePostUpdatePortfolioProjectSwr().trigger({ id, request })`
- **THEN** the hook invokes `updatePortfolioProject(id, request)` through `useSWRMutation`

#### Scenario: Use delete portfolio project hook
- **WHEN** a component calls `usePostDeletePortfolioProjectSwr().trigger(id)`
- **THEN** the hook invokes `deletePortfolioProject(id)` through `useSWRMutation`

#### Scenario: Use upload portfolio asset hook
- **WHEN** a component calls `usePostUploadPortfolioAssetSwr().trigger({ file, type, title })`
- **THEN** the hook invokes `uploadPortfolioAsset(file, type, title)` through `useSWRMutation`

#### Scenario: Use delete portfolio asset hook
- **WHEN** a component calls `usePostDeletePortfolioAssetSwr().trigger(id)`
- **THEN** the hook invokes `deletePortfolioAsset(id)` through `useSWRMutation`

#### Scenario: Use add achievement hook
- **WHEN** a component calls `usePostAddAchievementSwr().trigger(request)`
- **THEN** the hook invokes `addAchievement(request)` through `useSWRMutation`

#### Scenario: Use delete achievement hook
- **WHEN** a component calls `usePostDeleteAchievementSwr().trigger(id)`
- **THEN** the hook invokes `deleteAchievement(id)` through `useSWRMutation`

#### Scenario: Use moderate profile hook
- **WHEN** a component calls `usePostModerateProfileSwr().trigger({ userId, request })`
- **THEN** the hook invokes `moderateProfile(userId, request)` through `useSWRMutation`

### Requirement: SWR query wrappers exist for read endpoints
For every GET profile REST function we expose, a corresponding `useGet*Swr` hook SHALL exist in `src/hooks/swr/api/rest/queries/`.

#### Scenario: Use get privacy settings hook
- **WHEN** a component calls `useGetPrivacySettingsSwr()`
- **THEN** the hook invokes `getPrivacySettings()` through `useSWR`

#### Scenario: Use get profile timeline hook
- **WHEN** a component calls `useGetProfileTimelineSwr(username, params)`
- **THEN** the hook invokes `getProfileTimeline(username, params)` through `useSWR`

### Requirement: Profile module is re-exported from the REST barrel
- **WHEN** `src/modules/api/rest/index.ts` is updated
- **THEN** it adds `export * from "./profile"` alongside existing module exports

### Requirement: GraphQL-covered endpoints are documented and skipped
Endpoints already served by GraphQL operations SHALL NOT receive duplicate REST clients in this change.

#### Scenario: Skip GraphQL-covered core profile
- **WHEN** reviewing the profile surface
- **THEN** `GET /api/v1/profiles/me`, `PATCH /api/v1/profiles/me`, `GET /api/v1/profiles/{username}` are listed as covered by `me`, `updateProfile`, `userProfile` and omitted

#### Scenario: Skip GraphQL-covered follow surface
- **WHEN** reviewing the profile surface
- **THEN** `GET /api/v1/profiles/{username}/followers`, `GET /api/v1/profiles/{username}/following`, `POST/DELETE /api/v1/profiles/{username}/follow` are listed as covered by `userFollowers`, `userFollowing`, `setFollow` and omitted
