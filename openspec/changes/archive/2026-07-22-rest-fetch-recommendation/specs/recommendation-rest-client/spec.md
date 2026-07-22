## ADDED Requirements

### Requirement: Frontend can list personalized recommendations
The frontend SHALL provide a typed REST call and SWR query hook that returns a list of recommendation items for the authenticated user.

#### Scenario: Fetch recommendations
- **WHEN** the authenticated user requests recommendations with a type and limit
- **THEN** the system calls `GET /api/v1/recommendations?type={type}&limit={limit}` and returns `RecommendationItem[]`

### Requirement: Frontend can submit recommendation feedback
The frontend SHALL provide a typed REST call and SWR mutation hook that submits feedback for a specific recommendation item.

#### Scenario: Submit feedback
- **WHEN** the user submits feedback (action) for a recommendation id
- **THEN** the system calls `POST /api/v1/recommendations/{id}/feedback` with a `RecommendationFeedbackRequest` body and returns void

### Requirement: Recommendation DTOs are typed
The frontend SHALL expose TypeScript types for all recommendation request and response shapes, prefixed with `Recommendation*`.

#### Scenario: Type definitions match backend contract
- **WHEN** a developer imports from the recommendation REST module
- **THEN** they receive types `RecommendationItem`, `RecommendationDisplaySnapshot`, and `RecommendationFeedbackRequest` that match the backend `RecommendationViews` records
