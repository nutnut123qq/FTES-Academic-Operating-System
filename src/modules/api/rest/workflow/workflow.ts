import { restRequest } from "@/modules/api/rest/client"
import type {
    WorkflowCreateDefinitionRequest,
    WorkflowCreateInstanceRequest,
    WorkflowDefinitionResponse,
    WorkflowInstanceDetail,
    WorkflowInstanceResponse,
    WorkflowQueuePage,
    WorkflowResubmitRequest,
    WorkflowTransitionRequest,
} from "./types"

export const listWorkflowDefinitions = async (): Promise<
    WorkflowDefinitionResponse[]
> =>
    restRequest<WorkflowDefinitionResponse[]>({
        method: "GET",
        url: "/workflow/definitions",
        authenticated: true,
    })

export const createWorkflowDefinition = async (
    request: WorkflowCreateDefinitionRequest,
): Promise<WorkflowDefinitionResponse> =>
    restRequest<WorkflowDefinitionResponse>({
        method: "POST",
        url: "/workflow/definitions",
        data: request,
    })

export const createWorkflowInstance = async (
    request: WorkflowCreateInstanceRequest,
): Promise<WorkflowInstanceResponse> =>
    restRequest<WorkflowInstanceResponse>({
        method: "POST",
        url: "/workflow/instances",
        data: request,
    })

export const getWorkflowInstance = async (
    id: string,
): Promise<WorkflowInstanceDetail> =>
    restRequest<WorkflowInstanceDetail>({
        method: "GET",
        url: `/workflow/instances/${id}`,
        authenticated: true,
    })

export const getWorkflowQueue = async (request?: {
    domain?: string
    state?: string
    scopeId?: string
    cursor?: string
    limit?: number
}): Promise<WorkflowQueuePage> =>
    restRequest<WorkflowQueuePage>({
        method: "GET",
        url: "/workflow/queue",
        params: {
            domain: request?.domain,
            state: request?.state,
            scopeId: request?.scopeId,
            cursor: request?.cursor,
            limit: request?.limit,
        },
        authenticated: true,
    })

export const rebuildWorkflowQueue = async (): Promise<number> =>
    restRequest<number>({
        method: "POST",
        url: "/workflow/queue/rebuild",
    })

export const claimWorkflowQueueItem = async (
    instanceId: string,
): Promise<void> =>
    restRequest<void>({
        method: "POST",
        url: `/workflow/queue/${instanceId}/claim`,
    })

export const transitionWorkflowInstance = async (
    id: string,
    request: WorkflowTransitionRequest,
): Promise<WorkflowInstanceResponse> =>
    restRequest<WorkflowInstanceResponse>({
        method: "POST",
        url: `/workflow/instances/${id}/transitions`,
        data: request,
    })

export const resubmitWorkflowInstance = async (
    id: string,
    request?: WorkflowResubmitRequest,
): Promise<WorkflowInstanceResponse> =>
    restRequest<WorkflowInstanceResponse>({
        method: "POST",
        url: `/workflow/instances/${id}/resubmit`,
        data: request,
    })
