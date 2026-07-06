"use client"

import useSWR from "swr"
import {
    listWorkflowDefinitions,
    type WorkflowDefinitionResponse,
} from "@/modules/api/rest/workflow"

/**
 * SWR query wrapper for {@link listWorkflowDefinitions}.
 */
export const useGetWorkflowDefinitionsSwr = () => {
    const swr = useSWR<WorkflowDefinitionResponse[], Error>(
        "GET_WORKFLOW_DEFINITIONS_SWR",
        () => listWorkflowDefinitions(),
    )

    return swr
}
