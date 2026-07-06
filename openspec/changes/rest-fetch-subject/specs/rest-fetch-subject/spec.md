## ADDED Requirements

### Requirement: Subject REST client reuses the shared REST wrapper
The subject REST client SHALL import `restRequest` from `src/modules/api/rest/client/` and SHALL NOT create its own axios instance or envelope handling.

#### Scenario: List subjects
- **WHEN** `listSubjects(filters)` is called
- **THEN** it performs `GET /api/v1/subjects` through `restRequest` and returns `PageResponse<SubjectSummary>`

### Requirement: Catalog endpoints are exposed via REST
The subject REST client SHALL expose typed functions for every endpoint in `SubjectCatalogController`.

#### Scenario: Create subject
- **WHEN** `createSubject(request)` is called
- **THEN** it performs `POST /api/v1/subjects` and returns `SubjectDetail`

#### Scenario: Get subject detail
- **WHEN** `getSubjectDetail(code)` is called
- **THEN** it performs `GET /api/v1/subjects/{code}` and returns `SubjectDetail`

#### Scenario: Update subject
- **WHEN** `updateSubject(code, request)` is called
- **THEN** it performs `PATCH /api/v1/subjects/{code}` and returns `SubjectDetail`

#### Scenario: Publish subject
- **WHEN** `publishSubject(code)` is called
- **THEN** it performs `POST /api/v1/subjects/{code}/publish` and returns `SubjectDetail`

#### Scenario: Archive subject
- **WHEN** `archiveSubject(code)` is called
- **THEN** it performs `POST /api/v1/subjects/{code}/archive` and returns `SubjectDetail`

#### Scenario: Replace prerequisites
- **WHEN** `replaceSubjectPrerequisites(code, request)` is called
- **THEN** it performs `PUT /api/v1/subjects/{code}/prerequisites` and returns `Array<PrerequisiteView>`

#### Scenario: Replace related subjects
- **WHEN** `replaceSubjectRelated(code, request)` is called
- **THEN** it performs `PUT /api/v1/subjects/{code}/related` and returns `Array<RelatedView>`

### Requirement: Workspace endpoints are exposed via REST
The subject REST client SHALL expose typed functions for every endpoint in `WorkspaceController`.

#### Scenario: Get workspace
- **WHEN** `getSubjectWorkspace(code)` is called
- **THEN** it performs `GET /api/v1/subjects/{code}/workspace` and returns `WorkspaceView`

#### Scenario: List links
- **WHEN** `getSubjectLinks(code, tab)` is called
- **THEN** it performs `GET /api/v1/subjects/{code}/links` and returns `Array<LinkView>`

#### Scenario: Add link
- **WHEN** `addSubjectLink(code, request)` is called
- **THEN** it performs `POST /api/v1/subjects/{code}/links` and returns `LinkView`

#### Scenario: Update link
- **WHEN** `updateSubjectLink(code, id, request)` is called
- **THEN** it performs `PATCH /api/v1/subjects/{code}/links/{id}` and returns `LinkView`

#### Scenario: Delete link
- **WHEN** `deleteSubjectLink(code, id)` is called
- **THEN** it performs `DELETE /api/v1/subjects/{code}/links/{id}` and resolves with `void`

### Requirement: Membership endpoints are exposed via REST
The subject REST client SHALL expose typed functions for every endpoint in `MembershipController`.

#### Scenario: List my subjects
- **WHEN** `getMySubjects()` is called
- **THEN** it performs `GET /api/v1/subjects/me` and returns `Array<MyMembershipView>`

#### Scenario: Join subject
- **WHEN** `joinSubject(code)` is called
- **THEN** it performs `POST /api/v1/subjects/{code}/join` and returns `JoinResponse`

#### Scenario: Leave subject
- **WHEN** `leaveSubject(code)` is called
- **THEN** it performs `DELETE /api/v1/subjects/{code}/membership` and resolves with `void`

#### Scenario: List members
- **WHEN** `getSubjectMembers(code, role, page, size)` is called
- **THEN** it performs `GET /api/v1/subjects/{code}/members` and returns `PageResponse<MemberView>`

#### Scenario: Change member role
- **WHEN** `changeSubjectMemberRole(code, userId, request)` is called
- **THEN** it performs `PUT /api/v1/subjects/{code}/members/{userId}/role` and resolves with `void`

#### Scenario: Ban member
- **WHEN** `banSubjectMember(code, userId)` is called
- **THEN** it performs `POST /api/v1/subjects/{code}/members/{userId}/ban` and resolves with `void`

### Requirement: Statistics endpoints are exposed via REST
The subject REST client SHALL expose typed functions for every endpoint in `StatisticsController`.

#### Scenario: Get subject statistics
- **WHEN** `getSubjectStatistics(code)` is called
- **THEN** it performs `GET /api/v1/subjects/{code}/statistics` and returns `StatisticsView`

### Requirement: SWR wrappers exist for every writing endpoint
For every POST/PUT/PATCH/DELETE subject REST function, a corresponding `usePost*Swr` hook SHALL exist in `src/hooks/swr/api/rest/mutations/` following the existing naming and generic pattern.

#### Scenario: Use join subject hook
- **WHEN** a component calls `usePostJoinSubjectSwr().trigger(code)`
- **THEN** the hook invokes `joinSubject(code)` through `useSWRMutation`

### Requirement: GraphQL overlap is documented
The design SHALL document that no subject endpoints are skipped due to FE GraphQL coverage because `src/modules/api/graphql/**` contains no subject-specific queries/mutations.

#### Scenario: No GraphQL duplication
- **WHEN** reviewing the subject surface
- **THEN** every endpoint from the four subject controllers is implemented in REST and none is marked GraphQL-covered
