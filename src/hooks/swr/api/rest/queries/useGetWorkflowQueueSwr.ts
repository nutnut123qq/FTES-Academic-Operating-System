"use client"

import useSWR from "swr"
import {
    getWorkflowQueue,
    type WorkflowQueuePage,
} from "@/modules/api/rest/workflow"

/**
 * SWR query wrapper for {@link getWorkflowQueue}.
 */
export const useGetWorkflowQueueSwr = (request?: {
    domain?: string
    state?: string
    scopeId?: string
    cursor?: string
    limit?: number
}) => {
    const swr = useSWR<WorkflowQueuePage, Error>(
        ["GET_WORKFLOW_QUEUE_SWR", request],
        () => getWorkflowQueue(request),
    )

    return swr
}
