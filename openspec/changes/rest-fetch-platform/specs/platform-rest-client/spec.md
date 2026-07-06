## ADDED Requirements

### Requirement: Frontend can request a presigned upload URL
The frontend SHALL provide a typed REST call and SWR mutation hook that creates a file object and returns a presigned upload URL.

#### Scenario: Presign upload
- **WHEN** a caller with `platform.files.upload` permission submits a `PlatformPresignUploadRequest`
- **THEN** the system calls `POST /api/v1/platform/files/presign-upload` and returns `PlatformPresignUploadResult`

### Requirement: Frontend can complete a file upload
The frontend SHALL provide a typed REST call and SWR mutation hook that marks a file upload as complete.

#### Scenario: Complete upload
- **WHEN** the file owner submits a `PlatformCompleteFileUploadRequest` for a file id
- **THEN** the system calls `POST /api/v1/platform/files/{fileId}/complete` and returns `PlatformFileObject`

### Requirement: Frontend can read file metadata
The frontend SHALL provide a typed REST call and SWR query hook that returns safe file metadata and an access URL.

#### Scenario: Get file
- **WHEN** the file owner or an authorized caller requests a file id
- **THEN** the system calls `GET /api/v1/platform/files/{fileId}` and returns `PlatformFileView`

### Requirement: Frontend can soft-delete a file
The frontend SHALL provide a typed REST call and SWR mutation hook that soft-deletes a file.

#### Scenario: Delete file
- **WHEN** the file owner or an authorized manager deletes a file id
- **THEN** the system calls `DELETE /api/v1/platform/files/{fileId}` and returns void

### Requirement: Frontend can list feature flags
The frontend SHALL provide a typed REST call and SWR query hook that returns all feature flags.

#### Scenario: List feature flags
- **WHEN** a caller with `platform.flags.read` permission requests feature flags
- **THEN** the system calls `GET /api/v1/platform/feature-flags` and returns `PlatformFeatureFlag[]`

### Requirement: Frontend can evaluate a feature flag
The frontend SHALL provide a typed REST call and SWR query hook that evaluates a feature flag for the current user.

#### Scenario: Evaluate feature flag
- **WHEN** a caller with `platform.flags.read` permission requests a flag key
- **THEN** the system calls `GET /api/v1/platform/feature-flags/{key}` and returns `PlatformFeatureFlagEvaluation`

### Requirement: Frontend can update a feature flag
The frontend SHALL provide a typed REST call and SWR mutation hook that upserts a feature flag.

#### Scenario: Update feature flag
- **WHEN** a caller with `platform.flags.manage` permission submits a `PlatformFeatureFlagRequest`
- **THEN** the system calls `PUT /api/v1/platform/feature-flags/{key}` and returns `PlatformFeatureFlag`

### Requirement: Frontend can list configurations
The frontend SHALL provide a typed REST call and SWR query hook that returns configurations, optionally filtered.

#### Scenario: List configurations
- **WHEN** a caller with `platform.config.read` permission requests configurations with optional scopeType, scopeId, and prefix
- **THEN** the system calls `GET /api/v1/platform/configurations?scopeType={scopeType}&scopeId={scopeId}&prefix={prefix}` and returns `PlatformConfiguration[]`

### Requirement: Frontend can update a configuration
The frontend SHALL provide a typed REST call and SWR mutation hook that upserts a configuration.

#### Scenario: Update configuration
- **WHEN** a caller with `platform.config.manage` permission submits a `PlatformConfigurationRequest`
- **THEN** the system calls `PUT /api/v1/platform/configurations/{key}` and returns `PlatformConfiguration`

### Requirement: Frontend can list AI providers
The frontend SHALL provide a typed REST call and SWR query hook that returns AI providers.

#### Scenario: List AI providers
- **WHEN** a caller with `platform.ai.manage` permission requests AI providers
- **THEN** the system calls `GET /api/v1/platform/ai/providers` and returns `PlatformAiProvider[]`

### Requirement: Frontend can update an AI provider
The frontend SHALL provide a typed REST call and SWR mutation hook that updates an AI provider's priority and enabled state.

#### Scenario: Update AI provider
- **WHEN** a caller with `platform.ai.manage` permission submits a `PlatformAiProviderRequest`
- **THEN** the system calls `PUT /api/v1/platform/ai/providers/{id}` and returns `PlatformAiProvider`

### Requirement: Frontend can query audit logs
The frontend SHALL provide a typed REST call and SWR query hook that returns audit log rows.

#### Scenario: Query audit logs
- **WHEN** a caller with `platform.audit.read` permission requests audit logs with optional filters
- **THEN** the system calls `GET /api/v1/platform/audit-logs?actorId={actorId}&resourceType={resourceType}&resourceId={resourceId}&action={action}&from={from}&to={to}&page={page}` and returns `Record<string, unknown>[]`

### Requirement: Frontend can list scheduled jobs
The frontend SHALL provide a typed REST call and SWR query hook that returns scheduled jobs.

#### Scenario: List scheduled jobs
- **WHEN** a caller with `platform.jobs.manage` permission requests scheduled jobs
- **THEN** the system calls `GET /api/v1/platform/jobs` and returns `PlatformScheduledJob[]`

### Requirement: Frontend can trigger a scheduled job
The frontend SHALL provide a typed REST call and SWR mutation hook that triggers a scheduled job.

#### Scenario: Trigger job
- **WHEN** a caller with `platform.jobs.manage` permission triggers a job key
- **THEN** the system calls `POST /api/v1/platform/jobs/{jobKey}/trigger` and returns `PlatformJobTriggerResult`

### Requirement: Frontend can list job runs
The frontend SHALL provide a typed REST call and SWR query hook that returns job run rows.

#### Scenario: List job runs
- **WHEN** a caller with `platform.jobs.manage` permission requests runs for a job key
- **THEN** the system calls `GET /api/v1/platform/jobs/{jobKey}/runs?page={page}` and returns `Record<string, unknown>[]`

### Requirement: Platform DTOs are typed
The frontend SHALL expose TypeScript types for all request and response shapes, prefixed with `Platform*`.

#### Scenario: Type definitions match backend contract
- **WHEN** a developer imports from the platform REST module
- **THEN** they receive prefixed types such as `PlatformFileObject`, `PlatformFileView`, `PlatformPresignUploadRequest`, `PlatformPresignUploadResult`, `PlatformCompleteFileUploadRequest`, `PlatformFeatureFlag`, `PlatformFeatureFlagRequest`, `PlatformFeatureFlagEvaluation`, `PlatformConfiguration`, `PlatformConfigurationRequest`, `PlatformAiProvider`, `PlatformAiProviderRequest`, `PlatformScheduledJob`, and `PlatformJobTriggerResult` matching the backend `PlatformInfraController`, `PlatformOpsController`, and domain entities
