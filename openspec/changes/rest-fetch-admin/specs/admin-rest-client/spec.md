## ADDED Requirements

### Requirement: Admin console banner commands are callable via REST client
The system SHALL provide typed REST functions for banner create, patch, and delete under `/api/v1/admin`.

#### Scenario: Create banner
- **WHEN** the frontend calls `createAdminBanner` with title, image URL, placement, and optional fields
- **THEN** it sends `POST /api/v1/admin/banners` and returns the created banner

#### Scenario: Patch banner
- **WHEN** the frontend calls `patchAdminBanner` with a banner ID and partial fields
- **THEN** it sends `PATCH /api/v1/admin/banners/{id}` and returns the updated banner

#### Scenario: Delete banner
- **WHEN** the frontend calls `deleteAdminBanner` with a banner ID and reason
- **THEN** it sends `DELETE /api/v1/admin/banners/{id}` with a reason body and returns void

### Requirement: Admin console announcement commands are callable via REST client
The system SHALL provide typed REST functions for announcement create, patch, publish, and delete under `/api/v1/admin`.

#### Scenario: Create announcement
- **WHEN** the frontend calls `createAdminAnnouncement` with title, body, severity, audience, channels, and schedule fields
- **THEN** it sends `POST /api/v1/admin/announcements` and returns the created announcement

#### Scenario: Patch announcement
- **WHEN** the frontend calls `patchAdminAnnouncement` with an announcement ID and partial fields
- **THEN** it sends `PATCH /api/v1/admin/announcements/{id}` and returns the updated announcement

#### Scenario: Publish announcement
- **WHEN** the frontend calls `publishAdminAnnouncement` with an announcement ID
- **THEN** it sends `POST /api/v1/admin/announcements/{id}/publish` and returns the published announcement

#### Scenario: Delete announcement
- **WHEN** the frontend calls `deleteAdminAnnouncement` with an announcement ID and reason
- **THEN** it sends `DELETE /api/v1/admin/announcements/{id}` with a reason body and returns void

### Requirement: Admin bulk user lock/unlock is callable via REST client
The system SHALL provide typed REST functions for bulk user lock, unlock, and confirm under `/api/v1/admin`.

#### Scenario: Dry-run bulk lock
- **WHEN** the frontend calls `bulkLockAdminUsers` with target user IDs and params
- **THEN** it sends `POST /api/v1/admin/users/bulk/lock` and returns a dry-run result containing a confirm token

#### Scenario: Dry-run bulk unlock
- **WHEN** the frontend calls `bulkUnlockAdminUsers` with target user IDs and params
- **THEN** it sends `POST /api/v1/admin/users/bulk/unlock` and returns a dry-run result containing a confirm token

#### Scenario: Confirm bulk operation
- **WHEN** the frontend calls `confirmAdminBulkOperation` with a bulk ID and confirm token
- **THEN** it sends `POST /api/v1/admin/bulk/{bulkId}/confirm` and returns the bulk operation

### Requirement: Public admin content is readable via REST client
The system SHALL provide typed REST functions for public banner and active announcement reads under `/api/v1/admin-content`.

#### Scenario: List active banners for placement
- **WHEN** the frontend calls `getAdminPublicBanners` with a placement value
- **THEN** it sends `GET /api/v1/admin-content/banners?placement={placement}` and returns a list of banner views

#### Scenario: List active announcements
- **WHEN** the frontend calls `getAdminPublicAnnouncements`
- **THEN** it sends `GET /api/v1/admin-content/announcements/active` and returns a list of announcement views

### Requirement: Admin analytics proxy is readable via REST client
The system SHALL provide typed REST functions for analytics dashboards under `/api/v1/admin/analytics`.

#### Scenario: List available dashboards
- **WHEN** the frontend calls `getAdminAnalyticsDashboards`
- **THEN** it sends `GET /api/v1/admin/analytics/dashboards` and returns a list of dashboard keys

#### Scenario: Fetch dashboard data
- **WHEN** the frontend calls `getAdminAnalyticsDashboard` with a key and optional date range and filter
- **THEN** it sends `GET /api/v1/admin/analytics/dashboards/{key}?from={from}&to={to}&filter={filter}` and returns dashboard data

### Requirement: Admin REST types avoid barrel collisions
The system SHALL prefix every exported TypeScript type in the admin module with `Admin`.

#### Scenario: Type exports
- **WHEN** a developer imports from `@/modules/api/rest/admin`
- **THEN** every exported type name starts with `Admin`

### Requirement: Admin REST client exposes SWR hooks
The system SHALL provide SWR query hooks for read endpoints and SWR mutation hooks for write endpoints.

#### Scenario: Query hooks
- **WHEN** a component needs public banners, announcements, dashboards, or dashboard data
- **THEN** it uses `useAdminPublicBanners`, `useAdminPublicAnnouncements`, `useAdminAnalyticsDashboards`, or `useAdminAnalyticsDashboard`

#### Scenario: Mutation hooks
- **WHEN** a component performs an admin command or bulk operation
- **THEN** it uses the corresponding `use...Mutation` hook exported from `src/hooks/swr/api/rest/mutations`
