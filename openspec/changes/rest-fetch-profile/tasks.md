## 1. Profile REST types

- [x] 1.1 Create `src/modules/api/rest/profile/types.ts` with request/response interfaces inferred from backend `ProfileViews.java` and request DTOs. Rename colliding `ProgressView` and `CertificateView` to `Profile*`.

## 2. Profile REST client

- [x] 2.1 Create `src/modules/api/rest/profile/profile.ts` exporting REST functions for non-GraphQL endpoints in `MeProfileController` and `PublicProfileController`.
- [x] 2.2 Create `src/modules/api/rest/profile/index.ts` barrel re-exporting types and functions.
- [x] 2.3 Update `src/modules/api/rest/index.ts` to add `export * from "./profile"`.

### Endpoint mapping

**GraphQL-covered — BỎ QUA (ghi trong design.md):**
- `GET /api/v1/profiles/me` → `me`
- `PATCH /api/v1/profiles/me` → `updateProfile`
- `GET /api/v1/profiles/{username}` → `userProfile`
- `GET /api/v1/profiles/{username}/followers` → `userFollowers`
- `GET /api/v1/profiles/{username}/following` → `userFollowing`
- `POST /api/v1/profiles/{username}/follow` / `DELETE /api/v1/profiles/{username}/follow` → `setFollow`

**REST-only — implement in `profile.ts`: Me**
- `uploadAvatar`, `uploadCover`, `replaceSocialLinks`, `getPrivacySettings`, `updatePrivacySettings`, `createPortfolioProject`, `updatePortfolioProject`, `deletePortfolioProject`, `uploadPortfolioAsset`, `deletePortfolioAsset`, `addAchievement`, `deleteAchievement`

**REST-only — implement in `profile.ts`: Public**
- `getProfileTimeline`, `moderateProfile`

## 3. SWR mutation wrappers

- [x] 3.1 Create `usePostUploadAvatarSwr.ts`
- [x] 3.2 Create `usePostUploadCoverSwr.ts`
- [x] 3.3 Create `usePostReplaceSocialLinksSwr.ts`
- [x] 3.4 Create `usePostUpdatePrivacySettingsSwr.ts`
- [x] 3.5 Create `usePostCreatePortfolioProjectSwr.ts`
- [x] 3.6 Create `usePostUpdatePortfolioProjectSwr.ts`
- [x] 3.7 Create `usePostDeletePortfolioProjectSwr.ts`
- [x] 3.8 Create `usePostUploadPortfolioAssetSwr.ts`
- [x] 3.9 Create `usePostDeletePortfolioAssetSwr.ts`
- [x] 3.10 Create `usePostAddAchievementSwr.ts`
- [x] 3.11 Create `usePostDeleteAchievementSwr.ts`
- [x] 3.12 Create `usePostModerateProfileSwr.ts`
- [x] 3.13 Update `src/hooks/swr/api/rest/mutations/index.ts` to re-export all new mutation hooks.

## 4. SWR query wrappers

- [x] 4.1 Create `useGetPrivacySettingsSwr.ts`
- [x] 4.2 Create `useGetProfileTimelineSwr.ts`
- [x] 4.3 Update `src/hooks/swr/api/rest/queries/index.ts` to re-export all new query hooks.

## 5. Verification

- [x] 5.1 Run `npx tsc --noEmit` and fix type errors.
- [x] 5.2 Run `npm run build` (webpack) and ensure a green build.
