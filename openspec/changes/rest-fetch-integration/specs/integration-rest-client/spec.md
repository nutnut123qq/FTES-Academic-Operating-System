## ADDED Requirements

### Requirement: Frontend can list API keys
The frontend SHALL provide a typed REST call and SWR query hook that returns all API keys.

#### Scenario: List API keys
- **WHEN** a caller with `integration.apikey.manage` authority requests the API key list
- **THEN** the system calls `GET /api/v1/integration/api-keys` and returns `IntegrationApiKeyView[]`

### Requirement: Frontend can create an API key
The frontend SHALL provide a typed REST call and SWR mutation hook that creates a new API key and returns the plaintext key exactly once.

#### Scenario: Create API key
- **WHEN** a caller with `integration.apikey.manage` authority submits an `IntegrationCreateApiKeyRequest`
- **THEN** the system calls `POST /api/v1/integration/api-keys` and returns `IntegrationCreatedKeyView`

### Requirement: Frontend can revoke an API key
The frontend SHALL provide a typed REST call and SWR mutation hook that revokes an API key.

#### Scenario: Revoke API key
- **WHEN** a caller with `integration.apikey.manage` authority revokes an API key id
- **THEN** the system calls `POST /api/v1/integration/api-keys/{id}/revoke` and returns `boolean`

### Requirement: Frontend can list integrations
The frontend SHALL provide a typed REST call and SWR query hook that returns connections, optionally filtered by category and status.

#### Scenario: List connections
- **WHEN** a caller with `integration.connection.read` authority requests connections with optional filters
- **THEN** the system calls `GET /api/v1/integration/connections?category={category}&status={status}` and returns `IntegrationConnectionView[]`

### Requirement: Frontend can read an integration
The frontend SHALL provide a typed REST call and SWR query hook that returns a single connection by id.

#### Scenario: Get connection
- **WHEN** a caller with `integration.connection.read` authority requests a connection id
- **THEN** the system calls `GET /api/v1/integration/connections/{id}` and returns `IntegrationConnectionView`

### Requirement: Frontend can create an integration
The frontend SHALL provide a typed REST call and SWR mutation hook that creates a new connection.

#### Scenario: Create connection
- **WHEN** a caller with `integration.connection.manage` authority submits an `IntegrationCreateConnectionRequest`
- **THEN** the system calls `POST /api/v1/integration/connections` and returns `IntegrationConnectionView`

### Requirement: Frontend can update an integration
The frontend SHALL provide a typed REST call and SWR mutation hook that updates a connection.

#### Scenario: Update connection
- **WHEN** a caller with `integration.connection.manage` authority submits an `IntegrationUpdateConnectionRequest` for a connection id
- **THEN** the system calls `PATCH /api/v1/integration/connections/{id}` and returns `IntegrationConnectionView`

### Requirement: Integration DTOs are typed
The frontend SHALL expose TypeScript types for all request and response shapes, prefixed with `Integration*`.

#### Scenario: Type definitions match backend contract
- **WHEN** a developer imports from the integration REST module
- **THEN** they receive types `IntegrationApiKeyView`, `IntegrationCreatedKeyView`, `IntegrationCreateApiKeyRequest`, `IntegrationConnectionView`, `IntegrationCreateConnectionRequest`, and `IntegrationUpdateConnectionRequest` matching the backend `ApiKeyController` and `ConnectionController` records
