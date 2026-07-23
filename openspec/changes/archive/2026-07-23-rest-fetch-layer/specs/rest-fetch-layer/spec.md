## ADDED Requirements

### Requirement: Shared REST client wrapper exists
The shared REST client infrastructure SHALL provide a single function that executes an HTTP request against `${publicEnv().api.http}` and returns the unwrapped `data` field of the backend envelope `{code,message,data}`.

#### Scenario: Successful envelope unwrap
- **WHEN** a caller invokes the wrapper for a `GET /api/v1/challenges` request that returns HTTP 200 with body `{"code":200,"message":"OK","data":[{"id":"..."}]}`
- **THEN** the wrapper resolves with the array `[{"id":"..."}]`

#### Scenario: Error envelope mapping
- **WHEN** a caller invokes the wrapper for a request that returns HTTP 400 with body `{"code":400,"message":"Bad request","data":{"errorCode":"CHALLENGE_INVALID_INPUT","traceId":"abc","details":[]}}`
- **THEN** the wrapper rejects with an `Error` whose message is derived from `data.errorCode` and `message`

### Requirement: Authenticated requests attach the Keycloak access token
The shared REST client wrapper SHALL read the Keycloak access token from `LocalStorageId.KeycloakAccessToken` and send it in the `Authorization: Bearer <token>` header for every request that requires authentication.

#### Scenario: Authenticated GET request
- **WHEN** the wrapper is called for an authenticated endpoint and a token exists in local storage
- **THEN** the outgoing request includes `Authorization: Bearer <token>`

#### Scenario: Missing token does not send header
- **WHEN** the wrapper is called and no token exists in local storage
- **THEN** the request is sent without an `Authorization` header

### Requirement: Fresh axios instance per call
Every REST call SHALL create a fresh `axios.create(...)` instance; the project SHALL NOT introduce a singleton axios client or global interceptors for the REST layer.

#### Scenario: Two consecutive calls
- **WHEN** two REST functions run back-to-back
- **THEN** each function creates its own axios instance and does not share instance-level state

### Requirement: Pilot challenges REST client covers the management/read/participation surface
The `challenges` REST client SHALL expose typed async functions for every endpoint declared in `ChallengeController` under `/api/v1/challenges` except those already covered by existing GraphQL operations.

#### Scenario: List public challenges
- **WHEN** `listChallenges()` is called
- **THEN** it performs `GET /api/v1/challenges` and returns `Array<ChallengeView>`

#### Scenario: Create a challenge
- **WHEN** `createChallenge(request)` is called with a `CreateChallengeRequest` body
- **THEN** it performs `POST /api/v1/challenges` and returns `ChallengeView`

#### Scenario: Publish a challenge
- **WHEN** `publishChallenge(id)` is called
- **THEN** it performs `POST /api/v1/challenges/{id}/publish` and returns `ChallengeView`

#### Scenario: Close a challenge
- **WHEN** `closeChallenge(id)` is called
- **THEN** it performs `POST /api/v1/challenges/{id}/close` and resolves with `void`

#### Scenario: Upsert test cases
- **WHEN** `updateChallengeTestCases(id, request)` is called
- **THEN** it performs `PUT /api/v1/challenges/{id}/test-cases` and resolves with `void`

#### Scenario: Upsert rubrics
- **WHEN** `updateChallengeRubrics(id, request)` is called
- **THEN** it performs `PUT /api/v1/challenges/{id}/rubrics` and resolves with `void`

#### Scenario: Get challenge detail by slug
- **WHEN** `getChallengeBySlug(slug)` is called
- **THEN** it performs `GET /api/v1/challenges/{slug}` and returns `ChallengeView`

#### Scenario: Create a team
- **WHEN** `createChallengeTeam(id, request)` is called
- **THEN** it performs `POST /api/v1/challenges/{id}/teams` and returns `TeamView`

#### Scenario: Join a team
- **WHEN** `joinChallengeTeam(id, teamId)` is called
- **THEN** it performs `POST /api/v1/challenges/{id}/teams/{teamId}/join` and resolves with `void`

#### Scenario: Submit a solution
- **WHEN** `submitChallenge(id, request)` is called
- **THEN** it performs `POST /api/v1/challenges/{id}/submissions` and returns `SubmissionView`

#### Scenario: List my submissions
- **WHEN** `getMyChallengeSubmissions(id)` is called
- **THEN** it performs `GET /api/v1/challenges/{id}/submissions/me` and returns `Array<SubmissionView>`

#### Scenario: Get submission results
- **WHEN** `getChallengeSubmissionResults(id, submissionId)` is called
- **THEN** it performs `GET /api/v1/challenges/{id}/submissions/{submissionId}/results` and returns `SubmissionResultsView`

#### Scenario: Apply manual scores
- **WHEN** `applyChallengeManualScores(id, submissionId, scores)` is called
- **THEN** it performs `POST /api/v1/challenges/{id}/submissions/{submissionId}/manual-scores` and resolves with `void`

#### Scenario: Get leaderboard
- **WHEN** `getChallengeLeaderboard(id, limit)` is called
- **THEN** it performs `GET /api/v1/challenges/{id}/leaderboard?limit={limit}` and returns `LeaderboardView`

### Requirement: SWR wrappers for challenge REST mutations
Each mutating challenge REST function SHALL have a corresponding `usePost*Swr` hook in `src/hooks/swr/api/rest/mutations/` that delegates to the raw client function and follows the existing `useSWRMutation` naming and generic signature.

#### Scenario: Use create challenge mutation hook
- **WHEN** a component calls `usePostCreateChallengeSwr().trigger(request)`
- **THEN** the hook invokes `createChallenge(request)` and returns the SWR mutation handle

### Requirement: No overlap with existing GraphQL challenge operations
REST client functions SHALL NOT be created for challenge behavior already exposed through `src/modules/api/graphql/**` challenge queries/mutations; the design SHALL document which endpoints are skipped and why.

#### Scenario: Skipping submission endpoints already on GraphQL
- **WHEN** reviewing the challenge surface
- **THEN** endpoints such as `mutation-submit-challenge-submission`, `mutation-submit-coding-solution`, `mutation-submit-eval-challenge`, and related queries are listed as GraphQL-covered and omitted from the REST pilot
