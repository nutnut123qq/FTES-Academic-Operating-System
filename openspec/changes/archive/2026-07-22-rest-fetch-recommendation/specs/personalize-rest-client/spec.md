## ADDED Requirements

### Requirement: Frontend can read its own personalization context
The frontend SHALL provide a typed REST call and SWR query hook that returns the current user's personalization context.

#### Scenario: Fetch my context
- **WHEN** the authenticated user requests their personalization context with a limit
- **THEN** the system calls `GET /api/v1/personalize/context/me?limit={limit}` and returns `RecommendationPersonalizeContext`

### Requirement: Authorized users can read any user's personalization context
The frontend SHALL provide a typed REST call and SWR query hook that returns another user's personalization context.

#### Scenario: Fetch context of a specific user
- **WHEN** a caller with `personalize.context.read` authority requests context for a user id
- **THEN** the system calls `GET /api/v1/personalize/contexts/{userId}?limit={limit}` and returns `RecommendationPersonalizeContext`

### Requirement: Authorized users can read user signals
The frontend SHALL provide a typed REST call and SWR query hook that returns raw signals for a user with optional filters and cursor pagination.

#### Scenario: Fetch signals
- **WHEN** a caller with `personalize.context.read` authority requests signals for a user id
- **THEN** the system calls `GET /api/v1/personalize/signals/{userId}?windowType={windowType}&signalKey={signalKey}&cursor={cursor}&limit={limit}` and returns `RecommendationSignalPage`

### Requirement: Frontend can read personalization consent
The frontend SHALL provide a typed REST call and SWR query hook that returns the current user's personalization consent.

#### Scenario: Fetch consent
- **WHEN** the authenticated user requests their consent
- **THEN** the system calls `GET /api/v1/personalize/consent/me` and returns `RecommendationConsentView`

### Requirement: Frontend can update personalization consent
The frontend SHALL provide a typed REST call and SWR mutation hook that updates the current user's personalization consent.

#### Scenario: Update consent
- **WHEN** the authenticated user updates consent toggles
- **THEN** the system calls `PUT /api/v1/personalize/consent/me` with a `RecommendationConsentRequest` body and returns `RecommendationConsentView`

### Requirement: Admin can request a dataset export
The frontend SHALL provide a typed REST call and SWR mutation hook that requests an anonymized dataset export for offline training.

#### Scenario: Request export
- **WHEN** a caller with `personalize.export.manage` authority requests an export
- **THEN** the system calls `POST /api/v1/personalize/exports` with a `RecommendationExportRequest` body and returns `RecommendationExportView`

### Requirement: Admin can download a completed export
The frontend SHALL provide a typed REST call and SWR query hook that returns a presigned download URL for a completed export.

#### Scenario: Download export
- **WHEN** a caller with `personalize.export.manage` authority requests a download url for an export id
- **THEN** the system calls `GET /api/v1/personalize/exports/{id}/download` and returns `RecommendationExportDownloadView`

### Requirement: Personalize DTOs are typed
The frontend SHALL expose TypeScript types for all personalize request and response shapes, prefixed with `Recommendation*`.

#### Scenario: Type definitions match backend contract
- **WHEN** a developer imports from the recommendation REST module
- **THEN** they receive types such as `RecommendationPersonalizeContext`, `RecommendationContextItem`, `RecommendationSignalPage`, `RecommendationSignalRow`, `RecommendationConsentView`, `RecommendationConsentRequest`, `RecommendationExportView`, `RecommendationExportRequest`, and `RecommendationExportDownloadView` that match the backend `PersonalizeContextApi` and `PersonalizeController` records
