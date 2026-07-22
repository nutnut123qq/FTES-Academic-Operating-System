# rest-fetch-career Specification

## Purpose
TBD - created by archiving change rest-fetch-career. Update Purpose after archive.
## Requirements
### Requirement: Career REST types mirror backend contract
The frontend SHALL provide TypeScript interfaces in `src/modules/api/rest/career/types.ts` that match the request/response shapes defined in `CareerController`, `CareerSkillController`, and the `vn.ftes.aos.career.domain` entities they return.

#### Scenario: Type coverage
- **WHEN** a developer imports from `src/modules/api/rest/career`
- **THEN** they can access typed request/response shapes for roadmaps, opportunities, applications, mentorships, recommendations, skills, and assessments

### Requirement: Career REST client exposes all endpoints
The frontend SHALL provide a REST client in `src/modules/api/rest/career/career.ts` that calls every endpoint in `CareerController` and `CareerSkillController`.

#### Scenario: Roadmap lifecycle
- **WHEN** a caller invokes list/detail/create/patch/enroll/my-roadmap functions
- **THEN** the corresponding `/api/v1/career/roadmaps*` or `/api/v1/career/me/roadmaps` endpoints are invoked

#### Scenario: Opportunity lifecycle
- **WHEN** a caller invokes search/create/patch/apply/application-status/withdraw functions
- **THEN** the corresponding `/api/v1/career/opportunities*` or `/api/v1/career/applications*` endpoints are invoked

#### Scenario: Mentorship actions
- **WHEN** a caller invokes request-mentor or mentorship-action functions
- **THEN** the corresponding `/api/v1/career/mentors*/request` or `/api/v1/career/mentorships*` endpoints are invoked

#### Scenario: Recommendations
- **WHEN** a caller invokes my-recommendations
- **THEN** the `/api/v1/career/me/recommendations` endpoint is invoked

#### Scenario: Skills and assessments
- **WHEN** a caller invokes skills/my-skills/create-skill/patch-skill/self-assess/mentor-assess functions
- **THEN** the corresponding `/api/v1/career/skills*` or `/api/v1/career/me/skills*` endpoints are invoked

### Requirement: SWR mutation wrappers for writes
The frontend SHALL provide `usePost*Swr` hooks in `src/hooks/swr/api/rest/mutations/` for every career write endpoint.

#### Scenario: User applies to an opportunity
- **WHEN** a component calls `usePostApplyOpportunitySwr().trigger({ id, request })`
- **THEN** the hook invokes the apply REST function and returns the resulting `OpportunityApplication`

### Requirement: SWR query wrappers for reads
The frontend SHALL provide `useGet*Swr` hooks in `src/hooks/swr/api/rest/queries/` for every career read endpoint.

#### Scenario: Public roadmap list
- **WHEN** a component calls `useGetCareerRoadmapsSwr({ track })`
- **THEN** the hook fetches `/api/v1/career/roadmaps` via SWR

### Requirement: Root barrel updated
The frontend SHALL update `src/modules/api/rest/index.ts` to re-export `./career`.

#### Scenario: Importing career client
- **WHEN** a developer imports from `@/modules/api/rest`
- **THEN** career types and functions are available

