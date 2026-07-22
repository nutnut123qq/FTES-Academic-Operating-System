## ADDED Requirements

### Requirement: Event REST types mirror backend DTOs
The frontend SHALL provide TypeScript interfaces in `src/modules/api/rest/event/types.ts` that match the request/response records defined in `vn.ftes.aos.event.web.dto.EventViews`.

#### Scenario: Type coverage
- **WHEN** a developer imports from `src/modules/api/rest/event`
- **THEN** they can access typed request/response shapes for events, registrations, QR, certificates, and attendance

### Requirement: Event REST client exposes all endpoints
The frontend SHALL provide a REST client in `src/modules/api/rest/event/event.ts` that calls every endpoint in `EventController` and `EventAdminController`.

#### Scenario: Public event browsing
- **WHEN** a visitor calls list/detail event functions
- **THEN** the corresponding `GET /api/v1/event/events*` endpoints are invoked

#### Scenario: User registration lifecycle
- **WHEN** an authenticated user calls register/cancel/my-registrations/qr functions
- **THEN** the corresponding `/api/v1/event/events*/registrations*` or `/api/v1/event/registrations*` endpoints are invoked

#### Scenario: Check-in and certificates
- **WHEN** a caller invokes scan, my-certificates, or certificate-verify functions
- **THEN** the corresponding `/api/v1/event/checkins/scan`, `/api/v1/event/certificates/me`, or `/api/v1/event/certificates/verify/*` endpoints are invoked

#### Scenario: Event admin management
- **WHEN** an admin with `event.manage` calls create/submit/cancel/recording/attendance/manual-checkin functions
- **THEN** the corresponding `/api/v1/event/admin/events*` endpoints are invoked

### Requirement: Skip GraphQL-duplicated livestream reads
The frontend SHALL NOT expose REST query hooks for course livestream schedules because `queryMyUpcomingLivestreams` and `queryLivestreamSessions` already serve those reads.

#### Scenario: Livestream schedule page
- **WHEN** a page needs upcoming livestreams or course livestream sessions
- **THEN** it uses the existing GraphQL queries, not the event REST client

### Requirement: SWR mutation wrappers for writes
The frontend SHALL provide `usePost*Swr` hooks in `src/hooks/swr/api/rest/mutations/` for every event write endpoint.

#### Scenario: User registers for an event
- **WHEN** a component calls `usePostRegisterEventSwr().trigger(id)`
- **THEN** the hook invokes the register REST function and returns the resulting `EventRegistrationView`

### Requirement: SWR query wrappers for reads
The frontend SHALL provide `useGet*Swr` hooks in `src/hooks/swr/api/rest/queries/` for every event read endpoint.

#### Scenario: Event list
- **WHEN** a component calls `useGetEventsSwr()`
- **THEN** the hook fetches `/api/v1/event/events` via SWR

### Requirement: Root barrel updated
The frontend SHALL update `src/modules/api/rest/index.ts` to re-export `./event`.

#### Scenario: Importing event client
- **WHEN** a developer imports from `@/modules/api/rest`
- **THEN** event types and functions are available
