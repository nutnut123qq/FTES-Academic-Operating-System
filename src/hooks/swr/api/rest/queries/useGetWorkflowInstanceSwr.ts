"use client"

import useSWR from "swr"
import {
    getWorkflowInstance,
    type WorkflowInstanceDetail,
} from "@/modules/api/rest/workflow"

/**
 * SWR query wrapper for {@link getWorkflowInstance}.
 */
export const useGetWorkflowInstanceSwr = (id: string) => {
    const swr = useSWR<WorkflowInstanceDetail, Error>(
        ["GET_WORKFLOW_INSTANCE_SWR", id],
        () => getWorkflowInstance(id),
    )

    return swr
}
