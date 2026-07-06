/**
 * Request/response DTOs for the workflow REST controller.
 *
 * Mirrors the backend records in `vn.ftes.aos.workflow.web.WorkflowController`
 * and `vn.ftes.aos.workflow.web.dto.WorkflowDtos`.
 *
 * All exported names are prefixed with `Workflow` to avoid collisions in the
 * shared `src/modules/api/rest/index.ts` barrel.
 */

export interface WorkflowCreateDefinitionRequest {
    contentType: string
    states: string
    transitions: string
    slaHours: string
    aiThresholds?: string
}

export interface WorkflowDefinitionResponse {
    id: string
    contentType: string
    version: number
    active: boolean
    states: string
    transitions: string
    slaHours: string
    aiThresholds?: string
}

export interface WorkflowCreateInstanceRequest {
    contentType: string
    contentId: string
    domainScopeType?: string
    domainScopeId?: string
}

export interface WorkflowInstanceResponse {
    id: string
    contentType: string
    contentId: string
    currentState: string
    submitterId: string
    domainScopeType?: string
    domainScopeId?: string
    slaDeadlineAt: string
    active: boolean
    createdAt: string
}

export interface WorkflowTransitionDto {
    fromState: string
    toState: string
    action: string
    actorType: string
    actorId: string
    reason?: string
    occurredAt: string
}

export interface WorkflowInstanceDetail {
    instance: WorkflowInstanceResponse
    history: WorkflowTransitionDto[]
}

export interface WorkflowTransitionRequest {
    action: string
    reason?: string
    metadata?: string
}

export interface WorkflowResubmitRequest {
    note?: string
}

export interface WorkflowQueueItem {
    instanceId: string
    contentType: string
    contentId: string
    currentState: string
    domainScopeType?: string
    domainScopeId?: string
    slaDeadlineAt: string
}

export interface WorkflowQueuePage {
    items: WorkflowQueueItem[]
    nextCursor?: string
}
