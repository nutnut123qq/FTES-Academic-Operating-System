## ADDED Requirements

### Requirement: Frontend can list workflow definitions
The frontend SHALL provide a typed REST call and SWR query hook that returns all workflow definitions.

#### Scenario: List definitions
- **WHEN** a caller with `workflow.definition.manage` authority requests definitions
- **THEN** the system calls `GET /api/v1/workflow/definitions` and returns `WorkflowDefinitionResponse[]`

### Requirement: Frontend can create a workflow definition
The frontend SHALL provide a typed REST call and SWR mutation hook that creates a new workflow definition version.

#### Scenario: Create definition
- **WHEN** a caller with `workflow.definition.manage` authority submits a `WorkflowCreateDefinitionRequest`
- **THEN** the system calls `POST /api/v1/workflow/definitions` and returns `WorkflowDefinitionResponse`

### Requirement: Frontend can create a workflow instance
The frontend SHALL provide a typed REST call and SWR mutation hook that starts a workflow instance for a content item.

#### Scenario: Create instance
- **WHEN** a caller with `workflow.instance.create` permission submits a `WorkflowCreateInstanceRequest`
- **THEN** the system calls `POST /api/v1/workflow/instances` and returns `WorkflowInstanceResponse`

### Requirement: Frontend can read a workflow instance
The frontend SHALL provide a typed REST call and SWR query hook that returns instance details including transition history.

#### Scenario: Get instance
- **WHEN** the submitter or an authorized reviewer requests an instance id
- **THEN** the system calls `GET /api/v1/workflow/instances/{id}` and returns `WorkflowInstanceDetail`

### Requirement: Frontend can list the moderation queue
The frontend SHALL provide a typed REST call and SWR query hook that returns a cursor-paginated moderation queue.

#### Scenario: Fetch queue
- **WHEN** a caller with `workflow.queue.read` permission requests the queue with optional filters
- **THEN** the system calls `GET /api/v1/workflow/queue?domain={domain}&state={state}&scopeId={scopeId}&cursor={cursor}&limit={limit}` and returns `WorkflowQueuePage`

### Requirement: Frontend can rebuild the queue index
The frontend SHALL provide a typed REST call and SWR mutation hook that rebuilds the queue index from the database.

#### Scenario: Rebuild queue
- **WHEN** a caller with `workflow.definition.manage` authority requests a queue rebuild
- **THEN** the system calls `POST /api/v1/workflow/queue/rebuild` and returns `number`

### Requirement: Frontend can claim a queue item
The frontend SHALL provide a typed REST call and SWR mutation hook that claims a workflow instance for review.

#### Scenario: Claim instance
- **WHEN** a caller with `workflow.review` permission scoped to the instance claims it
- **THEN** the system calls `POST /api/v1/workflow/queue/{instanceId}/claim` and returns void

### Requirement: Frontend can transition a workflow instance
The frontend SHALL provide a typed REST call and SWR mutation hook that performs a workflow transition.

#### Scenario: Transition instance
- **WHEN** a caller with `workflow.review` permission submits a `WorkflowTransitionRequest` for an instance
- **THEN** the system calls `POST /api/v1/workflow/instances/{id}/transitions` and returns `WorkflowInstanceResponse`

### Requirement: Frontend can resubmit a workflow instance
The frontend SHALL provide a typed REST call and SWR mutation hook that resubmits a workflow instance.

#### Scenario: Resubmit instance
- **WHEN** the submitter resubmits an instance with an optional `WorkflowResubmitRequest`
- **THEN** the system calls `POST /api/v1/workflow/instances/{id}/resubmit` and returns `WorkflowInstanceResponse`

### Requirement: Workflow DTOs are typed
The frontend SHALL expose TypeScript types for all request and response shapes, prefixed with `Workflow*`.

#### Scenario: Type definitions match backend contract
- **WHEN** a developer imports from the workflow REST module
- **THEN** they receive types `WorkflowDefinitionResponse`, `WorkflowCreateDefinitionRequest`, `WorkflowInstanceResponse`, `WorkflowInstanceDetail`, `WorkflowTransitionDto`, `WorkflowCreateInstanceRequest`, `WorkflowTransitionRequest`, `WorkflowResubmitRequest`, `WorkflowQueueItem`, and `WorkflowQueuePage` matching the backend `WorkflowController` and `WorkflowDtos` records
