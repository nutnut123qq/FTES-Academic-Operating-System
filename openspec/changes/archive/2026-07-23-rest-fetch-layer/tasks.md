## 1. Shared REST client infrastructure

- [x] 1.1 Create `src/modules/api/rest/client/types.ts` with `RestApiResponse<T>`, `RestErrorBody`, `RestRequestConfig`, and `createRestClient` params.
- [x] 1.2 Create `src/modules/api/rest/client/client.ts` exporting `restRequest<T>(config)` and `createRestAxiosInstance()` that reads `publicEnv().api.http`, attaches the Keycloak bearer token, unwraps `{code,message,data}`, and maps error envelopes to `Error`.
- [x] 1.3 Add `src/modules/api/rest/client/index.ts` barrel re-exporting public symbols.
- [x] 1.4 Add `src/modules/api/rest/index.ts` barrel re-exporting `client` and `challenges` modules.

## 2. Challenges REST client (pilot)

- [x] 2.1 Create `src/modules/api/rest/challenges/types.ts` with request/response interfaces inferred from backend `ChallengeViews` and `ChallengeController`.
- [x] 2.2 Create `src/modules/api/rest/challenges/challenges.ts` exporting one async function per `/api/v1/challenges/*` endpoint using the shared `restRequest` wrapper.
- [x] 2.3 Add `src/modules/api/rest/challenges/index.ts` barrel re-exporting types and functions.

## 3. SWR wrappers for challenge REST mutations

- [x] 3.1 Create `src/hooks/swr/api/rest/mutations/usePostCreateChallengeSwr.ts`.
- [x] 3.2 Create `src/hooks/swr/api/rest/mutations/usePostPublishChallengeSwr.ts`.
- [x] 3.3 Create `src/hooks/swr/api/rest/mutations/usePostCloseChallengeSwr.ts`.
- [x] 3.4 Create `src/hooks/swr/api/rest/mutations/usePostCreateChallengeTeamSwr.ts`.
- [x] 3.5 Create `src/hooks/swr/api/rest/mutations/usePostJoinChallengeTeamSwr.ts`.
- [x] 3.6 Create `src/hooks/swr/api/rest/mutations/usePostSubmitChallengeSwr.ts`.
- [x] 3.7 Create `src/hooks/swr/api/rest/mutations/usePostApplyChallengeManualScoresSwr.ts`.
- [x] 3.8 Update `src/hooks/swr/api/rest/mutations/index.ts` to re-export the new hooks.

## 4. Verification

- [x] 4.1 Run `npx tsc --noEmit` and fix all type errors.
- [x] 4.2 Run `npm run build` (webpack) and ensure a green build.

## 5. Phase 2+ checklist — remaining REST controllers (do NOT implement in this change)

The following backend controllers were identified in the sibling backend repo. Each needs a typed REST client + SWR wrappers in a future OpenSpec change. Checked items in this list are intentionally blank; this is a roadmap, not a deliverable.

- [ ] `activity/web/ActivityController`
- [ ] `admin/web/AdminAnalyticsProxyController`
- [ ] `admin/web/AdminBulkController`
- [ ] `admin/web/AdminConsoleController`
- [ ] `admin/web/AdminContentPublicController`
- [ ] `ai/web/AdminController`
- [ ] `ai/web/JobController`
- [ ] `ai/web/QuotaController`
- [ ] `ai/web/SessionController`
- [ ] `ai/web/TranscriptController`
- [ ] `analytics/web/DashboardController`
- [ ] `analytics/web/ExportController`
- [ ] `blog/web/BlogCategoryController`
- [ ] `blog/web/BlogEngagementController`
- [ ] `blog/web/BlogPostController`
- [ ] `career/web/CareerController`
- [ ] `career/web/CareerSkillController`
- [ ] `chat/web/ChatController`
- [ ] `commerce/web/CartController`
- [ ] `commerce/web/CommerceAdminController`
- [ ] `commerce/web/OrderController`
- [ ] `commerce/web/ProductController`
- [ ] `commerce/web/WebhookController`
- [ ] `community/web/InteractionController`
- [ ] `community/web/PostController`
- [ ] `course/web/AssessmentController`
- [ ] `course/web/CatalogController`
- [ ] `course/web/CertificateController`
- [ ] `course/web/EnrollmentController`
- [ ] `course/web/FreemiumController`
- [ ] `course/web/LearningController`
- [ ] `event/web/EventAdminController`
- [ ] `event/web/EventController`
- [ ] `gamification/web/GamificationAdminController`
- [ ] `gamification/web/GamificationController`
- [ ] `group/web/GroupController`
- [ ] `group/web/InvitationController`
- [ ] `identity/auth/web/AuthController`
- [ ] `identity/auth/web/MfaController`
- [ ] `identity/auth/web/PasswordController`
- [ ] `identity/auth/web/SessionController`
- [ ] `identity/rbac/web/GrantController`
- [ ] `identity/rbac/web/MePermissionsController`
- [ ] `identity/rbac/web/PermissionCatalogController`
- [ ] `identity/rbac/web/RoleController`
- [ ] `identity/security/web/AdminSecurityController`
- [ ] `identity/security/web/DeviceController`
- [ ] `identity/security/web/LoginHistoryController`
- [ ] `integration/web/ApiKeyController`
- [ ] `integration/web/ConnectionController`
- [ ] `notification/web/NotificationController`
- [ ] `notification/web/NotificationTemplateController`
- [ ] `platform/web/PlatformInfraController`
- [ ] `platform/web/PlatformOpsController`
- [ ] `platform/graphql/resolver/AdminAnalyticsController`
- [ ] `platform/graphql/resolver/FeedController`
- [ ] `platform/graphql/resolver/GamificationController`
- [ ] `platform/graphql/resolver/PersonalizeController`
- [ ] `platform/graphql/resolver/ProfileController`
- [ ] `platform/graphql/resolver/SearchController`
- [ ] `platform/graphql/resolver/SubjectWorkspaceController`
- [ ] `profile/web/MeProfileController`
- [ ] `profile/web/PublicProfileController`
- [ ] `recommendation/web/PersonalizeController`
- [ ] `recommendation/web/RecommendationController`
- [ ] `resource/web/CollectionController`
- [ ] `resource/web/InteractionController`
- [ ] `resource/web/ResourceController`
- [ ] `search/web/AdminReindexController`
- [ ] `search/web/SearchController`
- [ ] `subject/web/MembershipController`
- [ ] `subject/web/StatisticsController`
- [ ] `subject/web/SubjectCatalogController`
- [ ] `subject/web/WorkspaceController`
- [ ] `wallet/web/WalletAdminController`
- [ ] `wallet/web/WalletController`
- [ ] `workflow/web/WorkflowController`
