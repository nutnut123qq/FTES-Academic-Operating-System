import useSWRMutation from "swr/mutation"
import {
    createWorkflowDefinition,
    type WorkflowCreateDefinitionRequest,
    type WorkflowDefinitionResponse,
} from "@/modules/api/rest/workflow"

/**
 * SWR mutation wrapper for {@link createWorkflowDefinition}.
 */
export const usePostCreateWorkflowDefinitionSwr = () => {
    const swr = useSWRMutation<
        WorkflowDefinitionResponse,
        Error,
        string,
        WorkflowCreateDefinitionRequest
    >("POST_CREATE_WORKFLOW_DEFINITION_SWR", async (_key, { arg }) => {
        return createWorkflowDefinition(arg)
    })

    return swr
}
